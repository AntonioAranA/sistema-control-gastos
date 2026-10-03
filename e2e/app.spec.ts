import { expect, test } from '@playwright/test';

let forceUnauthenticated = false;
let loginPayload: unknown;

test.beforeEach(async ({ page }) => {
  forceUnauthenticated = false;
  loginPayload = undefined;
  const movements: Array<Record<string, unknown>> = [];
  const categories = [
    { id: '11111111-1111-4111-8111-111111111111', name: 'Otros', isDefault: true }
  ];
  await page.route('http://localhost:3000/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    if (path === '/api/auth/refresh' && forceUnauthenticated)
      return route.fulfill({ status: 401, json: { message: 'No hay una sesión activa' } });
    if (path === '/api/auth/refresh')
      return route.fulfill({
        json: { accessToken: 'test-token', user: { id: 'user-1', email: 'test@correo.cl' } }
      });
    if (path === '/api/auth/login' && method === 'POST') {
      loginPayload = request.postDataJSON() as unknown;
      return route.fulfill({
        json: { accessToken: 'test-token', user: { id: 'user-1', email: 'test@correo.cl' } }
      });
    }
    if (path === '/api/categories' && method === 'GET') return route.fulfill({ json: categories });
    if (path === '/api/categories' && method === 'POST') {
      const body = request.postDataJSON() as { name: string };
      const created = { id: crypto.randomUUID(), name: body.name, isDefault: false };
      categories.push(created);
      return route.fulfill({ json: created });
    }
    if (path === '/api/movements' && method === 'GET')
      return route.fulfill({
        json: {
          items: movements,
          page: 1,
          limit: 100,
          total: movements.length,
          pages: movements.length ? 1 : 0
        }
      });
    if (path === '/api/budgets' || path === '/api/goals') return route.fulfill({ json: [] });
    if (path === '/api/movements' && method === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      const item = { ...body, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      movements.unshift(item);
      return route.fulfill({ json: item });
    }
    if (path.startsWith('/api/movements/') && method === 'PATCH') {
      const id = path.split('/').at(-1);
      const body = request.postDataJSON() as Record<string, unknown>;
      const index = movements.findIndex((item) => item.id === id);
      movements[index] = { ...movements[index], ...body };
      return route.fulfill({ json: movements[index] });
    }
    if (path.startsWith('/api/movements/') && method === 'DELETE') {
      const id = path.split('/').at(-1);
      const index = movements.findIndex((item) => item.id === id);
      movements.splice(index, 1);
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ json: {} });
  });
});

test('permite abrir el formulario de movimiento', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.mobile-nav button:last-child')).toBeVisible();
  await page.getByRole('button', { name: /nuevo/i }).click();
  await expect(page.getByRole('dialog', { name: /nuevo registro/i })).toBeVisible();
});

test('mantiene la preferencia de sesión marcada al iniciar sesión', async ({ page }) => {
  forceUnauthenticated = true;
  await page.goto('/');
  await page.locator('input[type="email"]').fill('test@correo.cl');
  await page.locator('input[type="password"]').fill('contraseña-segura');
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect.poll(() => loginPayload).toMatchObject({ rememberMe: true });
});

test('crea, edita y elimina un movimiento', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /nuevo movimiento/i }).click();
  await page.getByLabel(/monto/i).fill('12500');
  await page.getByLabel(/descripción/i).fill('Compra de prueba');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Fecha')).not.toHaveValue('');
  await expect(dialog.locator('select[required]')).not.toHaveValue('');
  await dialog.getByLabel(/Nueva categor/).fill('Mascotas');
  await dialog.getByRole('button', { name: 'Agregar' }).click();
  await expect(dialog.locator('select[required] option:checked')).toHaveText('Mascotas');
  await page.getByRole('button', { name: /guardar movimiento/i }).click();
  await expect(page.getByText('Compra de prueba').first()).toBeVisible();
  await page.getByRole('button', { name: 'Editar Compra de prueba' }).first().click();
  await page.getByLabel(/descripción/i).fill('Compra editada');
  await page.getByRole('button', { name: /guardar movimiento/i }).click();
  await page.getByRole('button', { name: 'Eliminar Compra editada' }).first().click();
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(page.getByText('Compra editada')).toHaveCount(0);
});
