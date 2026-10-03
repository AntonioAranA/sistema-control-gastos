import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { slugify } from '../lib/format';
import { todayLocal } from '../lib/date';
import type { Category, ExpenseNature, Movement, MovementType, Recurrence } from '../types';
import { CurrencyInput } from './CurrencyInput';
import { validateMovementDraft } from '../lib/validation';

interface Props {
  categories: Category[];
  movement?: Movement | null;
  onSave: (movement: Movement) => void;
  onAddCategory: (category: Category) => Promise<Category>;
  onClose: () => void;
}

const makeId = (): string => crypto.randomUUID();

export function MovementForm({ categories, movement, onSave, onAddCategory, onClose }: Props) {
  const [type, setType] = useState<MovementType>(movement?.type ?? 'expense');
  const [amount, setAmount] = useState(movement ? String(movement.amount) : '');
  const [date, setDate] = useState(movement?.date ?? todayLocal());
  const [categoryId, setCategoryId] = useState(movement?.categoryId || categories[0]?.id || '');
  const [description, setDescription] = useState(movement?.description ?? '');
  const [expenseNature, setExpenseNature] = useState<ExpenseNature>(
    movement?.expenseNature ?? 'variable'
  );
  const [recurrence, setRecurrence] = useState<Recurrence>(movement?.recurrence ?? 'none');
  const [recurrenceEnd, setRecurrenceEnd] = useState(movement?.recurrenceEnd ?? '');
  const [notes, setNotes] = useState(movement?.notes ?? '');
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState('');
  const recentIds = (() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem('recent-categories') ?? '[]');
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  })();
  const orderedCategories = [...categories].sort((a, b) => {
    const first = recentIds.indexOf(a.id);
    const second = recentIds.indexOf(b.id);
    return (first < 0 ? 999 : first) - (second < 0 ? 999 : second);
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateMovementDraft({ amount, date, categoryId, description });
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    onSave({
      id: movement?.id ?? makeId(),
      amount: validation.amount,
      date,
      categoryId,
      description: description.trim(),
      type,
      expenseNature,
      recurrence,
      recurrenceSourceId: movement?.recurrenceSourceId,
      recurrenceEnd: recurrenceEnd || undefined,
      recurrencePaused: movement?.recurrencePaused ?? false,
      notes: notes.trim(),
      createdAt: movement?.createdAt ?? new Date().toISOString()
    });
    localStorage.setItem(
      'recent-categories',
      JSON.stringify([categoryId, ...recentIds.filter((id) => id !== categoryId)].slice(0, 4))
    );
    onClose();
  };

  const createCategory = async () => {
    const name = categoryName.trim();
    const id = slugify(name);
    if (!name || !id || categories.some((category) => category.id === id)) {
      setError('Escribe una categoría nueva y válida.');
      return;
    }
    try {
      const created = await onAddCategory({ id, name });
      setCategoryId(created.id);
      setCategoryName('');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la categoría.');
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="movement-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Movimiento</p>
            <h2 id="movement-title">{movement ? 'Editar registro' : 'Nuevo registro'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X />
          </button>
        </div>
        <form onSubmit={submit}>
          <fieldset className="type-switch">
            <legend className="sr-only">Tipo</legend>
            <label className={type === 'expense' ? 'selected' : ''}>
              <input
                type="radio"
                value="expense"
                checked={type === 'expense'}
                onChange={() => setType('expense')}
              />
              Gasto
            </label>
            <label className={type === 'income' ? 'selected' : ''}>
              <input
                type="radio"
                value="income"
                checked={type === 'income'}
                onChange={() => setType('income')}
              />
              Ingreso
            </label>
          </fieldset>
          <div className="form-grid">
            <label>
              Monto (CLP)
              <CurrencyInput value={amount} onChange={setAmount} min={1} required />
            </label>
            <label>
              Fecha
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
          </div>
          <label>
            Descripción
            <input
              value={description}
              maxLength={80}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Compra semanal"
              required
            />
          </label>
          <label>
            Categoría
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              {orderedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              Clasificación
              <select
                value={expenseNature}
                onChange={(event) =>
                  setExpenseNature(event.target.value === 'fixed' ? 'fixed' : 'variable')
                }
              >
                <option value="variable">Variable</option>
                <option value="fixed">Fijo</option>
              </select>
            </label>
            <label>
              Repetición
              <select
                value={recurrence}
                onChange={(event) => {
                  const value = event.target.value;
                  setRecurrence(
                    value === 'weekly' ||
                      value === 'biweekly' ||
                      value === 'monthly' ||
                      value === 'yearly'
                      ? value
                      : 'none'
                  );
                }}
              >
                <option value="none">No repetir</option>
                <option value="weekly">Cada semana</option>
                <option value="biweekly">Cada dos semanas</option>
                <option value="monthly">Cada mes</option>
                <option value="yearly">Cada año</option>
              </select>
            </label>
          </div>
          {recurrence !== 'none' && (
            <label>
              Repetir hasta (opcional)
              <input
                type="date"
                value={recurrenceEnd}
                min={date}
                onChange={(event) => setRecurrenceEnd(event.target.value)}
              />
            </label>
          )}
          <label>
            Notas (opcional)
            <textarea
              value={notes}
              maxLength={240}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Detalle adicional"
            />
          </label>
          <div className="inline-create">
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Nueva categoría"
              aria-label="Nueva categoría"
            />
            <button type="button" className="button secondary" onClick={createCategory}>
              <Plus />
              Agregar
            </button>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button type="button" className="button ghost" onClick={onClose}>
              Cancelar
            </button>
            <button className="button primary" type="submit">
              Guardar movimiento
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
