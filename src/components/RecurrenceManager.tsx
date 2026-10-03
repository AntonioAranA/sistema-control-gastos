import { CalendarClock, Pause, Play } from 'lucide-react';
import type { Movement } from '../types';
import { formatCLP } from '../lib/format';

const labels = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  yearly: 'Anual'
} as const;

export function RecurrenceManager({
  movements,
  onToggle
}: {
  movements: Movement[];
  onToggle: (id: string) => void;
}) {
  const recurring = movements.filter((item) => item.recurrence !== 'none');
  return (
    <details className="recurrence-manager">
      <summary>
        <CalendarClock />
        Recurrentes ({recurring.length})
      </summary>
      {recurring.length === 0 ? (
        <p>No hay movimientos recurrentes configurados.</p>
      ) : (
        <div>
          {recurring.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.description}</strong>
                <span>
                  {labels[item.recurrence as keyof typeof labels]} · {formatCLP(item.amount)}
                  {item.recurrenceEnd ? ` · hasta ${item.recurrenceEnd}` : ''}
                </span>
              </div>
              <span className={item.recurrencePaused ? 'status-paused' : 'status-active'}>
                {item.recurrencePaused ? 'Pausado' : 'Activo'}
              </span>
              <button
                className="icon-button"
                onClick={() => onToggle(item.id)}
                aria-label={`${item.recurrencePaused ? 'Reanudar' : 'Pausar'} ${item.description}`}
              >
                {item.recurrencePaused ? <Play /> : <Pause />}
              </button>
            </article>
          ))}
        </div>
      )}
    </details>
  );
}
