import type { AppData, Budget, Category, Movement, SavingsGoal } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
let accessToken: string | null = null;
let refreshInFlight: Promise<SessionResponse> | null = null;

export interface User {
  id: string;
  email: string;
}
interface SessionResponse {
  accessToken: string;
  user: User;
}
const csrfToken = (): string =>
  document.cookie
    .split('; ')
    .find((item) => item.startsWith('csrf_token='))
    ?.split('=')[1] ?? '';

const request = async <T>(path: string, init: RequestInit = {}, retry = true): Promise<T> => {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' });
  } catch {
    throw new Error('No se pudo conectar con la API. Comprueba que el backend esté en ejecución.');
  }
  if (response.status === 401 && retry && path !== '/auth/refresh') {
    try {
      await api.refresh();
      return request<T>(path, init, false);
    } catch {
      accessToken = null;
      window.dispatchEvent(new Event('session-expired'));
    }
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === 'object' && body && 'message' in body
        ? String(body.message)
        : 'No fue posible completar la operación';
    throw new Error(message);
  }
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
};

const session = async (path: string, body?: object): Promise<SessionResponse> => {
  const result = await request<SessionResponse>(
    path,
    {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers:
        path === '/auth/refresh' ? { 'X-CSRF-Token': decodeURIComponent(csrfToken()) } : undefined
    },
    false
  );
  accessToken = result.accessToken;
  return result;
};

const movementPayload = (item: Movement) => ({
  amount: item.amount,
  date: item.date,
  categoryId: item.categoryId,
  description: item.description,
  notes: item.notes,
  type: item.type,
  expenseNature: item.expenseNature,
  recurrence: item.recurrence,
  recurrenceEnd: item.recurrenceEnd,
  recurrencePaused: item.recurrencePaused,
  recurrenceSourceId: item.recurrenceSourceId
});

export const api = {
  register: (email: string, password: string, rememberMe: boolean) =>
    session('/auth/register', { email, password, rememberMe }),
  login: (email: string, password: string, rememberMe: boolean) =>
    session('/auth/login', { email, password, rememberMe }),
  refresh: () => {
    if (!refreshInFlight) {
      refreshInFlight = session('/auth/refresh').finally(() => {
        refreshInFlight = null;
      });
    }
    return refreshInFlight;
  },
  me: () => request<User>('/auth/me'),
  logout: async () => {
    await request(
      '/auth/logout',
      { method: 'POST', headers: { 'X-CSRF-Token': decodeURIComponent(csrfToken()) } },
      false
    );
    accessToken = null;
  },
  categories: () => request<Category[]>('/categories'),
  createCategory: (category: Category) =>
    request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name: category.name })
    }),
  updateCategory: (category: Category) =>
    request<Category>(`/categories/${category.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: category.name })
    }),
  deleteCategory: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  movements: async () => {
    const all: Movement[] = [];
    let page = 1;
    let pages = 1;
    while (page <= pages) {
      const result = await request<{ items: Movement[]; pages: number }>(
        `/movements?page=${page}&limit=100&sortBy=date&sortOrder=desc`
      );
      all.push(...result.items);
      pages = result.pages;
      page += 1;
    }
    return all;
  },
  createMovement: (movement: Movement) =>
    request<Movement>('/movements', {
      method: 'POST',
      body: JSON.stringify(movementPayload(movement))
    }),
  updateMovement: (movement: Movement) =>
    request<Movement>(`/movements/${movement.id}`, {
      method: 'PATCH',
      body: JSON.stringify(movementPayload(movement))
    }),
  deleteMovement: (id: string) => request<void>(`/movements/${id}`, { method: 'DELETE' }),
  bulkDelete: (ids: string[]) =>
    request<{ count: number }>('/movements/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    }),
  bulkCategory: (ids: string[], categoryId: string) =>
    request<{ count: number }>('/movements/bulk-category', {
      method: 'POST',
      body: JSON.stringify({ ids, categoryId })
    }),
  importMovements: (movements: Movement[]) =>
    request<{ imported: number; duplicates: number; rejected: unknown[] }>('/movements/import', {
      method: 'POST',
      body: JSON.stringify({ movements: movements.map(movementPayload) })
    }),
  budgets: () => request<Budget[]>('/budgets'),
  saveBudget: (budget: Budget) =>
    request<Budget>('/budgets', {
      method: 'PUT',
      body: JSON.stringify({
        month: budget.month,
        general: budget.general,
        categories: Object.entries(budget.byCategory)
          .filter(([, amount]) => amount > 0)
          .map(([categoryId, amount]) => ({ categoryId, amount }))
      })
    }),
  goals: () => request<SavingsGoal[]>('/goals'),
  createGoal: (goal: SavingsGoal) =>
    request<SavingsGoal>('/goals', {
      method: 'POST',
      body: JSON.stringify({
        name: goal.name,
        targetAmount: goal.targetAmount,
        targetDate: goal.targetDate
      })
    }),
  updateGoal: (goal: SavingsGoal) =>
    request<SavingsGoal>(`/goals/${goal.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: goal.name,
        targetAmount: goal.targetAmount,
        targetDate: goal.targetDate
      })
    }),
  contribute: (goalId: string, amount: number, date: string) =>
    request<SavingsGoal>(`/goals/${goalId}/contributions`, {
      method: 'POST',
      body: JSON.stringify({ amount, date })
    }),
  deleteGoal: (id: string) => request<void>(`/goals/${id}`, { method: 'DELETE' }),
  clearData: () => request<void>('/auth/data', { method: 'DELETE' }),
  downloadCsv: async (filters?: Record<string, string>) => {
    const query = filters
      ? `?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString()}`
      : '';
    const response = await fetch(`${API_URL}/movements/export.csv${query}`, {
      credentials: 'include',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    });
    if (!response.ok) throw new Error('No fue posible exportar los movimientos');
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = 'movimientos.csv';
    link.click();
    URL.revokeObjectURL(url);
  },
  snapshot: async (): Promise<AppData> => ({
    version: 3,
    categories: await api.categories(),
    movements: await api.movements(),
    budgets: await api.budgets(),
    savingsGoals: await api.goals()
  })
};
