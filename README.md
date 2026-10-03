# Control de gastos personales

Aplicación web full stack para llevar ingresos, gastos, presupuestos, metas de ahorro y recurrencias en pesos chilenos (CLP). La interfaz está en español y funciona en escritorio y móvil.

## Funcionalidades

- Resumen mensual, historial filtrable, búsqueda y exportación CSV.
- Categorías predeterminadas y personalizadas.
- Presupuesto mensual general y por categoría.
- Informes de gastos por categoría y evolución mensual.
- Metas de ahorro, aportes y movimientos recurrentes.
- Tema claro/oscuro y carga de datos de demostración opcional.
- Persistencia financiera en PostgreSQL; los datos antiguos del navegador solo se importan tras confirmación.
- Inicio de sesión con la opción «Mantener sesión iniciada».

## Tecnologías

- Frontend: React, TypeScript estricto, Vite, Tailwind CSS, Lucide React y Recharts.
- API: Node.js, NestJS, TypeScript, class-validator y Swagger.
- Datos: PostgreSQL y Prisma ORM.
- Pruebas: Vitest, Jest y Playwright.

## Requisitos

- Node.js 22 o superior y npm 10 o superior.
- Docker Desktop con Docker Compose para ejecutar la API y PostgreSQL en contenedores.

## Inicio rápido con Docker

1. Copia `.env.example` a `.env`.
2. Genera tres secretos distintos y aleatorios. Por ejemplo, ejecuta `openssl rand -hex 32` tres veces y asigna los valores a `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` en `.env`.
3. Inicia la base de datos y API:

   ```bash
   docker compose up --build -d
   ```

4. Instala dependencias e inicia el frontend en otra terminal:

   ```bash
   npm install
   npm run dev
   ```

Abre la URL que muestra Vite (normalmente `http://localhost:5173`). La API está en `http://localhost:3000/api`, Swagger en `http://localhost:3000/api/docs` y PostgreSQL queda publicado en `localhost:5433` (el puerto interno del contenedor es `5432`). El mapeo `5433` evita conflictos con instalaciones locales de PostgreSQL.

La primera cuenta se crea desde la pantalla de acceso. No hay cuenta de demostración precargada; los datos de ejemplo se cargan de forma explícita desde la aplicación.

Para detener los servicios sin borrar la base de datos:

```bash
docker compose down
```

No uses `docker compose down -v` salvo que quieras borrar deliberadamente el volumen y todos los datos de PostgreSQL.

## Desarrollo sin Docker

1. Inicia PostgreSQL local y crea una base de datos y usuario.
2. Copia `backend/.env.example` a `backend/.env` y ajusta `DATABASE_URL`, secretos y orígenes.
3. Instala y prepara el backend:

   ```bash
   npm --prefix backend install
   npm --prefix backend run prisma:generate
   npm --prefix backend run prisma:migrate
   npm --prefix backend run start:dev
   ```

4. En otra terminal, inicia el frontend:

   ```bash
   npm install
   npm run dev
   ```

El frontend usa `VITE_API_URL`; si no se define, utiliza `http://localhost:3000/api`.

## Configuración

Compose lee las variables del `.env` de la raíz. Para ejecutar NestJS fuera de Docker, configura `backend/.env` con los mismos secretos y una URL de PostgreSQL accesible desde el host. Las variables principales son:

| Variable                 | Descripción                                                                      |
| ------------------------ | -------------------------------------------------------------------------------- |
| `DATABASE_URL`           | URL de conexión PostgreSQL para Prisma.                                          |
| `POSTGRES_PASSWORD`      | Contraseña requerida por el servicio PostgreSQL de Compose.                      |
| `JWT_ACCESS_SECRET`      | Clave aleatoria para firmar access tokens.                                       |
| `JWT_REFRESH_SECRET`     | Clave independiente para refresh tokens.                                         |
| `ACCESS_TOKEN_TTL`       | Vigencia del access token; por defecto `15m`.                                    |
| `REFRESH_TOKEN_TTL_DAYS` | Vigencia máxima de refresh tokens y sesión persistente; por defecto 30 días.     |
| `CORS_ORIGINS`           | Lista separada por comas de orígenes frontend permitidos.                        |
| `COOKIE_SECURE`          | Usa `true` detrás de HTTPS en producción; `false` es solo para desarrollo local. |
| `VITE_API_URL`           | URL base de la API utilizada por el frontend.                                    |

No subas archivos `.env` ni secretos al repositorio. Para producción configura HTTPS, `COOKIE_SECURE=true`, CORS con dominios exactos y secretos administrados fuera del código.

## Sesiones y contraseñas

La opción «Mantener sesión iniciada» no guarda la contraseña. Si se marca, la cookie de refresh HttpOnly tiene expiración persistente (30 días por defecto); si no, es una cookie de sesión del navegador. Los access tokens permanecen en memoria, los refresh tokens rotan y solo se guarda su hash en la base de datos. La aplicación no incluye recuperación de contraseña por correo porque aún no tiene un proveedor de envío configurado.

## Documentación adicional

- [Arquitectura y flujo de datos](docs/ARQUITECTURA.md)
- [Referencia de endpoints de la API](docs/API.md)
- [Operación, migraciones y solución de problemas](docs/OPERACION.md)
- [OpenAPI/Swagger](http://localhost:3000/api/docs) cuando la API está en ejecución.

## Migraciones

Las migraciones versionadas están en `backend/prisma/migrations`. Compose espera a que PostgreSQL esté saludable y ejecuta `prisma migrate deploy` antes de iniciar NestJS. Para aplicar migraciones manualmente:

```bash
npm --prefix backend run prisma:migrate
```

Al modificar el esquema en desarrollo, crea una migración versionada con Prisma y agrégala al repositorio; no edites la base de datos de producción manualmente.

## Verificaciones

```bash
npm run verify
npm run test:e2e -- --workers=1
npm run format:check
npm audit
npm --prefix backend audit
```

`npm run verify` ejecuta comprobaciones TypeScript, lint, pruebas unitarias y builds de frontend y backend. Playwright cubre los flujos principales de interfaz. GitHub Actions ejecuta las verificaciones del proyecto en push y pull request.
