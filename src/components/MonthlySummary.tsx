import type { BudgetStatus, MonthlySummary as Summary } from '../types';
import { formatCLP } from '../lib/format';

interface MonthlySummaryProps {
  summary: Summary;
  budgetLimit: number;
  budgetStatus: BudgetStatus;
  showDemoAction: boolean;
  onLoadDemo: () => void;
  onReviewBudget: () => void;
  previousMonthExpense?: number;
}

export function MonthlySummary({
  summary,
  budgetLimit,
  budgetStatus,
  showDemoAction,
  onLoadDemo,
  onReviewBudget,
  previousMonthExpense
}: MonthlySummaryProps) {
  return (
    <>
      <section className="summary">
        <div className="summary-heading">
          <div>
            <p className="eyebrow">Resumen mensual</p>
            <h1>Resumen del mes</h1>
          </div>
          {showDemoAction && (
            <button className="text-button" onClick={onLoadDemo}>
              Cargar datos de demostración
            </button>
          )}
        </div>

        <div className="metrics">
          <Metric label="Ingresos" value={formatCLP(summary.income)} className="income" />
          <Metric label="Gastos" value={formatCLP(summary.expense)} className="expense" />
          <Metric label="Saldo disponible" value={formatCLP(summary.balance)} className="balance" />
          <Metric
            label="Presupuesto usado"
            value={budgetLimit > 0 ? `${budgetStatus.percentage}%` : 'Sin definir'}
            detail={
              budgetLimit > 0
                ? `${formatCLP(Math.max(budgetStatus.remaining, 0))} disponible`
                : 'Configura un límite mensual'
            }
          />
        </div>
        {previousMonthExpense !== undefined && previousMonthExpense > 0 && (
          <p className="monthly-comparison">
            Gastaste{' '}
            {Math.abs(
              Math.round(((summary.expense - previousMonthExpense) / previousMonthExpense) * 100)
            )}
            % {summary.expense <= previousMonthExpense ? 'menos' : 'más'} que el mes anterior.
          </p>
        )}
      </section>

      {budgetStatus.exceeded && (
        <div className="budget-alert" role="alert">
          <span aria-hidden="true">!</span>
          <div>
            <strong>Presupuesto mensual superado</strong>
            <p>Los gastos exceden el límite en {formatCLP(Math.abs(budgetStatus.remaining))}.</p>
          </div>
          <button onClick={onReviewBudget}>Revisar presupuesto</button>
        </div>
      )}
    </>
  );
}

interface MetricProps {
  label: string;
  value: string;
  detail?: string;
  className?: string;
}

function Metric({ label, value, detail, className = '' }: MetricProps) {
  return (
    <div className={className}>
      <span>{label}</span>
      <strong className={className === 'balance' ? '' : className}>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}
