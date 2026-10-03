# Arquitectura

## Vista general

La solución se divide en una SPA React, una API NestJS y PostgreSQL. El frontend no accede a la base de datos: usa un cliente HTTP tipado y la API deriva la identidad desde el access token.

    Navegador (React + TypeScript)
      ├─ cliente HTTP: access token en memoria, cookies incluidas
      └─ API NestJS (/api)
           ├─ módulos por dominio
           ├─ validación DTO, guards y servicios
           └─ Prisma ORM → PostgreSQL

## Frontend

- src/App.tsx: composición de la aplicación, navegación, sesión y modales globales.
- src/components/: interfaz organizada por tareas (movimientos, presupuestos, metas, informes, categorías y autenticación).
- src/hooks/useFinance.ts: carga y coordinación de operaciones financieras.
- src/hooks/useSession.ts: inicio/cierre de sesión y restauración desde refresh cookie.
- src/lib/api.ts: cliente HTTP, renovación coordinada de access tokens y adaptación de respuestas.
- src/lib/calculations.ts, date.ts, validation.ts: cálculos, fechas locales y validaciones compartidas.
- src/lib/storage.ts: migración y lectura de respaldos locales anteriores; los datos financieros nuevos viven en la API.

Los montos CLP se transportan como enteros. Las fechas de movimientos se envían como YYYY-MM-DD para representar un día calendario, sin convertirlas a la zona horaria del navegador.

## Backend

backend/src contiene módulos de autenticación, categorías, movimientos, presupuestos, analítica, metas, salud y Prisma. Los controladores manejan HTTP/DTOs; los servicios implementan reglas de negocio y consultas. ValidationPipe transforma DTOs, elimina campos no permitidos y rechaza propiedades adicionales.

backend/prisma/schema.prisma define usuarios, sesiones de refresh, categorías, movimientos, presupuestos, metas y aportes. Importes monetarios usan Int; fechas de calendario usan PostgreSQL DATE. Las relaciones e índices están versionados mediante backend/prisma/migrations.

## Aislamiento y reglas

- Los endpoints protegidos reciben el usuario desde CurrentUser, construido a partir del JWT; no se confía en userId del cuerpo o query.
- Cada consulta financiera filtra por el usuario autenticado.
- Una categoría debe pertenecer al usuario para poder asignarse a un movimiento o presupuesto.
- Las categorías iniciales no se pueden editar ni eliminar; tampoco se eliminan categorías en uso.
- Los presupuestos son únicos por usuario y mes; los presupuestos por categoría se reemplazan al guardar el conjunto mensual.
- Los resúmenes y gráficos se calculan en el backend a partir de movimientos y presupuestos.

## Ciclo de sesión

1. Registro o login verifica credenciales y crea una sesión de refresh. El refresh token se almacena hasheado con Argon2.
2. El access token de corta duración vive solo en memoria en el frontend.
3. El refresh token se entrega en cookie HttpOnly; el token CSRF complementario se entrega en cookie legible por la SPA.
4. Al recargar la página, el frontend solicita /auth/refresh; las operaciones de refresh y logout envían X-CSRF-Token.
5. La rotación reclama atómicamente la sesión anterior para evitar que dos solicitudes concurrentes la reutilicen.
6. «Mantener sesión iniciada» controla si las cookies tienen una fecha de expiración persistente. La contraseña no se guarda en localStorage.

## Datos locales anteriores

La aplicación puede encontrar datos guardados por versiones anteriores. Presenta una acción de importación explícita, valida el formato y las referencias de categoría, usa la importación idempotente del backend y conserva los datos locales si la operación falla. Las preferencias visuales del navegador no son datos financieros de la cuenta.

## Extensión

Para agregar una funcionalidad, crea o amplía un módulo de backend (DTO, controlador, servicio y pruebas), actualiza el cliente API tipado y añade la interfaz en los componentes/hook del dominio correspondiente. Si cambia el esquema, agrega una migración Prisma versionada. Evita introducir cálculos financieros en controladores o aceptar totales calculados por el cliente.
