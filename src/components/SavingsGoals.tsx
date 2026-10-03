import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatCLP } from '../lib/format';
import { todayLocal } from '../lib/date';
import type { SavingsGoal } from '../types';

const SESSION_START = new Date().getTime();

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  onSave: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
}

export function SavingsGoals({ goals, onSave, onDelete }: SavingsGoalsProps) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [contributions, setContributions] = useState<Record<string, string>>({});
  const addGoal = () => {
    const targetAmount = Number(target);
    if (!name.trim() || targetAmount <= 0) return;
    onSave({
      id: crypto.randomUUID(),
      name: name.trim(),
      targetAmount,
      savedAmount: 0,
      targetDate: targetDate || undefined,
      contributions: []
    });
    setName('');
    setTarget('');
    setTargetDate('');
  };
  const addContribution = (goal: SavingsGoal) => {
    const amount = Number(contributions[goal.id]);
    if (amount <= 0) return;
    onSave({
      ...goal,
      savedAmount: goal.savedAmount + amount,
      contributions: [
        ...goal.contributions,
        { id: crypto.randomUUID(), amount, date: todayLocal() }
      ]
    });
    setContributions((current) => ({ ...current, [goal.id]: '' }));
  };
  const active = goals.filter((goal) => goal.savedAmount < goal.targetAmount);
  const completed = goals.filter((goal) => goal.savedAmount >= goal.targetAmount);
  return (
    <section className="savings-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Ahorro</p>
          <h2>Metas</h2>
        </div>
      </div>
      <div className="goal-create">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre de la meta"
          aria-label="Nombre de la meta"
        />
        <input
          type="number"
          min="1"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          placeholder="Monto objetivo"
          aria-label="Monto objetivo"
        />
        <input
          type="date"
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
          aria-label="Fecha objetivo"
        />
        <button className="button secondary" onClick={addGoal}>
          <Plus />
          Crear
        </button>
      </div>
      {active.length === 0 && completed.length === 0 ? (
        <p className="subtle-empty">Aún no tienes metas de ahorro.</p>
      ) : (
        <>
          <GoalList
            goals={active}
            contributions={contributions}
            setContributions={setContributions}
            onAdd={addContribution}
            onDelete={onDelete}
          />
          {completed.length > 0 && (
            <details className="completed-goals">
              <summary>Metas completadas ({completed.length})</summary>
              <GoalList
                goals={completed}
                contributions={contributions}
                setContributions={setContributions}
                onAdd={addContribution}
                onDelete={onDelete}
              />
            </details>
          )}
        </>
      )}
    </section>
  );
}

interface GoalListProps {
  goals: SavingsGoal[];
  contributions: Record<string, string>;
  setContributions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onAdd: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
}
function GoalList({ goals, contributions, setContributions, onAdd, onDelete }: GoalListProps) {
  return (
    <div className="goals-list">
      {goals.map((goal) => {
        const percentage = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
        const months = goal.targetDate
          ? Math.max(
              1,
              Math.ceil(
                (new Date(`${goal.targetDate}T00:00:00`).getTime() - SESSION_START) / 2_629_800_000
              )
            )
          : 0;
        const monthly = months
          ? Math.max(0, Math.ceil((goal.targetAmount - goal.savedAmount) / months))
          : 0;
        return (
          <article key={goal.id}>
            <div>
              <strong>{goal.name}</strong>
              <span>
                {formatCLP(goal.savedAmount)} de {formatCLP(goal.targetAmount)}
              </span>
              {monthly > 0 && <small>Ahorra {formatCLP(monthly)} al mes</small>}
            </div>
            <div className="progress-track">
              <span style={{ width: `${percentage}%` }} />
            </div>
            <div className="goal-contribution">
              <input
                type="number"
                min="1"
                value={contributions[goal.id] ?? ''}
                onChange={(event) =>
                  setContributions((current) => ({ ...current, [goal.id]: event.target.value }))
                }
                placeholder="Nuevo aporte"
                aria-label={`Aporte a ${goal.name}`}
              />
              <button className="button secondary" onClick={() => onAdd(goal)}>
                Aportar
              </button>
            </div>
            <button
              className="icon-button"
              onClick={() => onDelete(goal.id)}
              aria-label={`Eliminar meta ${goal.name}`}
            >
              <Trash2 />
            </button>
            {goal.contributions.length > 0 && (
              <details className="contribution-history">
                <summary>
                  {goal.contributions.length} aporte{goal.contributions.length === 1 ? '' : 's'}
                </summary>
                <ul>
                  {goal.contributions.map((item) => (
                    <li key={item.id}>
                      <span>{item.date}</span>
                      <strong>{formatCLP(item.amount)}</strong>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </article>
        );
      })}
    </div>
  );
}
