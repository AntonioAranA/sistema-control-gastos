# Referencia de la API

La API usa el prefijo /api. Swagger interactivo está disponible en /api/docs mientras NestJS se ejecuta. Las rutas protegidas requieren Authorization: Bearer <accessToken>.

Las solicitudes JSON usan Content-Type: application/json. Los identificadores de recursos son UUID. Los errores de validación devuelven códigos HTTP 4xx; los errores inesperados se ocultan detrás de un mensaje genérico 500.

## Autenticación

### POST /auth/register y POST /auth/login

Entrada:

    {
      "email": "persona@example.cl",
      "password": "una-clave-segura",
      "rememberMe": true
    }

rememberMe es opcional y por defecto false. La respuesta contiene accessToken y user (id, email), y establece cookies de refresh/CSRF. Con rememberMe: true las cookies expiran según REFRESH_TOKEN_TTL_DAYS (30 días por defecto); de lo contrario son cookies de sesión. El registro crea las categorías iniciales del usuario.

### POST /auth/refresh

Renueva y rota la sesión usando la cookie refresh_token. Requiere enviar X-CSRF-Token igual al valor de la cookie csrf_token. Devuelve un nuevo access token y actualiza las cookies.

### POST /auth/logout

Revoca la sesión y elimina cookies. Requiere el mismo encabezado CSRF que /auth/refresh.

### GET /auth/me

Devuelve id y email para el access token actual.

### DELETE /auth/data

Elimina los datos financieros del usuario autenticado; no elimina su cuenta ni categorías iniciales.

## Categorías

- GET /categories: categorías del usuario actual.
- POST /categories: crea una categoría con name (1–60 caracteres).
- PATCH /categories/:id: cambia el nombre de una categoría personalizada.
- DELETE /categories/:id: elimina una categoría personalizada si no tiene movimientos ni presupuestos asociados.

Las categorías iniciales se protegen contra edición y eliminación. Los errores de ownership o uso se devuelven sin exponer datos de otros usuarios.

## Movimientos

### GET /movements

Historial paginado. Query params:

| Parámetro     | Valores / formato                | Valor predeterminado |
| ------------- | -------------------------------- | -------------------- |
| page          | Entero ≥ 1                       | 1                    |
| limit         | Entero entre 1 y 100             | 25                   |
| search        | Texto en descripción o categoría | —                    |
| from, to      | Fecha YYYY-MM-DD, inclusiva      | —                    |
| categoryId    | UUID                             | —                    |
| type          | income o expense                 | —                    |
| expenseNature | fixed o variable                 | —                    |
| sortBy        | date o amount                    | date                 |
| sortOrder     | asc o desc                       | desc                 |

Respuesta paginada: items, page, limit, total y pages.

### Crear y editar

- POST /movements
- PATCH /movements/:id (acepta campos parciales)

Ejemplo del cuerpo de creación:

    {
      "amount": 12500,
      "date": "2026-10-02",
      "categoryId": "UUID-DE-CATEGORIA",
      "description": "Compra semanal",
      "type": "expense",
      "expenseNature": "variable",
      "recurrence": "none"
    }

amount debe ser un entero positivo; description admite hasta 80 caracteres, notes hasta 240. date y recurrenceEnd usan YYYY-MM-DD. Tipos válidos: income/expense; naturaleza: fixed/variable; recurrencia: none, weekly, biweekly, monthly, yearly.

### Otras operaciones

- DELETE /movements/:id: elimina un movimiento.
- POST /movements/bulk-delete: recibe ids, máximo 500.
- POST /movements/bulk-category: recibe ids y categoryId.
- POST /movements/import: recibe movements, máximo 500. Responde con imported, duplicates y rejected.
- GET /movements/export.csv: descarga CSV; admite los mismos filtros/orden de historial.
- GET /movements/all: listado completo legado. Para consultas de interfaz usa /movements paginado.

## Presupuestos

- GET /budgets: lista presupuestos del usuario.
- GET /budgets/:month: devuelve el presupuesto YYYY-MM, o valores vacíos si no existe.
- PUT /budgets: crea o reemplaza el presupuesto del mes.

Entrada:

    {
      "month": "2026-10",
      "general": 300000,
      "categories": [
        { "categoryId": "UUID-DE-CATEGORIA", "amount": 100000 }
      ]
    }

Los montos son enteros CLP no negativos (el límite por categoría debe ser positivo). El mes/categoría no se puede duplicar dentro de la solicitud y cada categoría debe ser propia.

## Analítica

Todas estas rutas están protegidas. month es opcional y usa el mes actual de America/Santiago si se omite.

- GET /analytics/summary?month=YYYY-MM: ingresos, gastos, saldo, presupuesto general y porcentaje usado (nulo si no hay presupuesto).
- GET /analytics/expenses-by-category?month=YYYY-MM: gastos agrupados por categoría.
- GET /analytics/monthly-evolution?month=YYYY-MM: ingresos y gastos de los seis meses terminados en el mes solicitado.

## Metas de ahorro

- GET /goals: lista metas y aportes.
- POST /goals: recibe name, targetAmount y targetDate opcional.
- PATCH /goals/:id: actualiza nombre, monto objetivo o fecha objetivo.
- DELETE /goals/:id: elimina la meta y sus aportes.
- POST /goals/:id/contributions: recibe amount entero positivo y date YYYY-MM-DD.

Todas las cantidades son enteros CLP. Las fechas representan días calendario.

## Salud

GET /health no requiere autenticación. Comprueba la conexión a PostgreSQL y devuelve status ok y timestamp.
