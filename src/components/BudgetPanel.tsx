import { AlertTriangle, Check, Save } from 'lucide-react';
import { useState } from 'react';
import { budgetStatus, spentByCategory } from '../lib/calculations';
import { formatCLP } from '../lib/format';
import type { Budget, Category, Movement } from '../types';

export function BudgetPanel({
  budget,
  previousBudget,
  movements,
  categories,
  onSave
}: {
  budget: Budget;
  previousBudget?: Budget;
  movements: Movement[];
  categories: Category[];
  onSave: (budget: Budget) => void;
}) {
  const [general, setGeneral] = useState(String(budget.general || ''));
  const [limits, setLimits] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(budget.byCategory).map(([key, value]) => [key, String(value)])
    )
  );
  const [saved, setSaved] = useState(false);
  const spent = spentByCategory(movements);
  const totalSpent = movements
    .filter(({ type }) => type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);
  const visibleCategories = categories.filter(
    ({ id }) => Number(limits[id] ?? 0) > 0 || (spent[id] ?? 0) > 0
  );
  const save = () => {
    onSave({
      month: budget.month,
      general: Math.max(0, Math.round(Number(general) || 0)),
      byCategory: Object.fromEntries(
        Object.entries(limits).map(([key, value]) => [
          key,
          Math.max(0, Math.round(Number(value) || 0))
        ])
      )
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };
  const generalStatus = budgetStatus(totalSpent, Number(general) || 0);
  return (
    <section className="budget-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Límites del mes</p>
          <h2>Presupuesto</h2>
        </div>
        <button className="button primary" onClick={save}>
          {saved ? <Check /> : <Save />}
          {saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>
      <div className="budget-general">
        <label>
          Presupuesto general (CLP)
          <input
            type="number"
            min="0"
            step="1"
            value={general}
            onChange={(e) => setGeneral(e.target.value)}
            placeholder="Sin límite"
          />
        </label>
        <Progress spent={totalSpent} limit={Number(general) || 0} label="Gasto total" />
      </div>
      {previousBudget && previousBudget.general > 0 && (
        <p className="budget-comparison">
          Mes anterior: {formatCLP(previousBudget.general)} ·{' '}
          {budget.general > previousBudget.general
            ? 'aumentó'
            : budget.general < previousBudget.general
              ? 'disminuyó'
              : 'sin cambios'}{' '}
          {budget.general !== previousBudget.general
            ? formatCLP(Math.abs(budget.general - previousBudget.general))
            : ''}
        </p>
      )}
      {generalStatus.exceeded && (
        <p className="warning" role="alert">
          <AlertTriangle />
          Superaste el presupuesto general por {formatCLP(Math.abs(generalStatus.remaining))}.
        </p>
      )}
      <div className="budget-category-heading">
        <h3>Por categoría</h3>
        <p>Define solo los límites que necesites.</p>
      </div>
      <div className="budget-categories">
        {categories.map((category) => (
          <div className="budget-row" key={category.id}>
            <label>
              {category.name}
              <input
                aria-label={`Presupuesto para ${category.name}`}
                type="number"
                min="0"
                step="1"
                value={limits[category.id] ?? ''}
                onChange={(e) =>
                  setLimits((current) => ({ ...current, [category.id]: e.target.value }))
                }
                placeholder="0"
              />
            </label>
            {visibleCategories.some(({ id }) => id === category.id) && (
              <Progress
                spent={spent[category.id] ?? 0}
                limit={Number(limits[category.id]) || 0}
                label={`Gastado en ${category.name}`}
                compact
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Progress({
  spent,
  limit,
  label,
  compact = false
}: {
  spent: number;
  limit: number;
  label: string;
  compact?: boolean;
}) {
  const status = budgetStatus(spent, limit);
  return (
    <div className={`progress-block ${compact ? 'compact' : ''}`}>
      <div className="progress-copy">
        <span>{label}</span>
        <span>
          {formatCLP(spent)} {limit > 0 && `de ${formatCLP(limit)}`}
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit || Math.max(spent, 1)}
        aria-valuenow={spent}
      >
        <span
          className={status.exceeded ? 'over' : ''}
          style={{ width: `${Math.min(status.percentage, 100)}%` }}
        />
      </div>
      {limit > 0 && (
        <small className={status.exceeded ? 'over-text' : ''}>
          {status.exceeded
            ? `Límite superado · ${status.percentage}%`
            : `${status.percentage}% utilizado`}
        </small>
      )}
    </div>
  );
}
