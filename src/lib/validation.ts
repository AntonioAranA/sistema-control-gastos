import type { CategoryId, IsoDate } from '../types';

export interface MovementDraft {
  amount: string;
  date: IsoDate;
  categoryId: CategoryId;
  description: string;
}
export type ValidationResult = { valid: true; amount: number } | { valid: false; message: string };

export const validateMovementDraft = (draft: MovementDraft): ValidationResult => {
  const amount = Number(draft.amount);
  if (!draft.description.trim() || !draft.date || !draft.categoryId)
    return { valid: false, message: 'Completa todos los campos obligatorios.' };
  if (!Number.isFinite(amount) || amount <= 0)
    return { valid: false, message: 'Ingresa un monto mayor que cero.' };
  return { valid: true, amount: Math.round(amount) };
};
