# Operación y mantenimiento

## Variables y archivos de entorno

- .env.example de la raíz: configuración usada por Compose y Vite.
- backend/.env.example: ejemplo para ejecutar NestJS fuera de Docker con PostgreSQL local.
- .env, sus variantes locales (por ejemplo .env.local o .env.production) y backend/.env están excluidos de Git; los archivos .env.example quedan permitidos como plantillas.

Genera POSTGRES_PASSWORD, JWT_ACCESS_SECRET y JWT_REFRESH_SECRET con valores aleatorios distintos. Una rotación de claves JWT invalida tokens existentes; el usuario tendrá que volver a iniciar sesión. Si se cambia la contraseña PostgreSQL después de inicializar el volumen, también debe actualizarse el rol dentro de esa base de datos: cambiar solo la variable Compose no altera automáticamente el rol ya creado.

## Docker Compose

    docker compose up --build -d
    docker compose ps
    docker compose logs -f api
    docker compose logs -f postgres

Puertos locales: API 3000, PostgreSQL host 5433 → contenedor 5432. Si el puerto host se ocupa, cambia solo la parte izquierda del mapeo host:container en docker-compose.yml; la URL de conexión entre contenedores debe continuar usando postgres:5432.

Comprueba la disponibilidad con GET http://localhost:3000/api/health. La API espera que PostgreSQL esté saludable y aplica migraciones pendientes antes de iniciar.

docker compose down detiene los servicios y conserva el volumen expenses_postgres. docker compose down -v elimina también el volumen y es destructivo. Haz un respaldo antes de operaciones de mantenimiento o actualizaciones con riesgo.

## Migraciones Prisma

Las migraciones aplicadas están en backend/prisma/migrations.

- Aplicar migraciones versionadas: npm --prefix backend run prisma:migrate.
- Regenerar cliente al cambiar Prisma: npm --prefix backend run prisma:generate.
- En desarrollo, después de modificar schema.prisma, crea una migración con npx prisma migrate dev --name nombre-descriptivo desde backend y versiona el directorio generado.
- No uses migrate reset contra datos que quieras conservar.

## Pruebas y calidad

Desde la raíz:

    npm run verify
    npm run test:e2e -- --workers=1
    npm run format:check
    npm audit
    npm --prefix backend audit

verify cubre TypeScript, ESLint, Vitest, Jest y builds. Playwright prueba interacciones reales del frontend con la API simulada. Para verificar integración, levanta Compose y comprueba health, login, refresh, CRUD y persistencia con cuentas de prueba; elimina solo las cuentas de prueba creadas durante esa comprobación.

## Seguridad de despliegue

- Sirve el frontend y la API exclusivamente mediante HTTPS y configura COOKIE_SECURE=true.
- Ajusta CORS_ORIGINS a la lista exacta de orígenes del frontend; no uses comodín junto con credenciales.
- Mantén secretos fuera del repositorio y de logs; usa un gestor de secretos del entorno.
- Limita el acceso a PostgreSQL. El puerto Compose se publica en loopback por defecto.
- Habilita respaldos de PostgreSQL y prueba periódicamente su restauración.
- No almacenes contraseñas en el frontend. La recuperación de contraseña por email no está implementada hasta configurar un proveedor de correo y un flujo de tokens de un solo uso.

## Problemas frecuentes

### El puerto 5432 no está disponible

Compose publica PostgreSQL en 127.0.0.1:5433:5432 porque puede existir una instancia local en 5432. Ejecuta docker compose config y confirma que el puerto publicado sea 5433. No cambies el puerto interno del contenedor ni postgres:5432 en DATABASE_URL dentro de la red Compose.

### Faltan secretos de entorno

Compose exige POSTGRES_PASSWORD, JWT_ACCESS_SECRET y JWT_REFRESH_SECRET. Copia el ejemplo de la raíz y reemplaza todos los valores de ejemplo antes de ejecutar.

### La sesión pide autenticación otra vez

Marca «Mantener sesión iniciada» para una cookie persistente (30 días por defecto). Revisa que frontend y API usen el mismo host (localhost, no mezclarlo con 127.0.0.1), que CORS permita el origen del frontend y que el navegador acepte cookies. En producción, usa HTTPS y COOKIE_SECURE=true.

### Migración o API no inicia

Consulta docker compose logs api y docker compose logs postgres. Confirma que PostgreSQL esté healthy, que DATABASE_URL use el servicio postgres y el puerto interno 5432, y que las credenciales coincidan con el rol de la base persistente.
