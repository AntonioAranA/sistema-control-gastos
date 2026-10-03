import type { Budget, BudgetStatus, Movement, MonthlySummary, Screen, YearMonth } from '../types';
import type { FinanceStore } from '../hooks/useFinance';
import { lazy, Suspense } from 'react';
import { BudgetPanel } from './BudgetPanel';
import { FinanceTools } from './FinanceTools';
import { MonthlySummary as SummaryView } from './MonthlySummary';
import { MovementHistory } from './MovementHistory';
import { PageTitle } from './PageTitle';
import { SavingsGoals } from './SavingsGoals';
import { RecurrenceManager } from './RecurrenceManager';
import { MonthPicker } from './MonthPicker';
import { getBudget } from '../lib/calculations';
import { shiftMonth } from '../lib/date';
import { CategoriesPanel } from './CategoriesPanel';

const Reports = lazy(() => import('./Reports').then((module) => ({ default: module.Reports })));

interface AppContentProps {
  screen: Screen;
  month: YearMonth;
  finance: FinanceStore;
  monthlyMovements: Movement[];
  summary: MonthlySummary;
  previousMonthExpense: number;
  budget: Budget;
  budgetStatus: BudgetStatus;
  onNavigate: (screen: Screen) => void;
  onEditMovement: (movement: Movement) => void;
  onDeleteMovement: (movement: Movement) => void;
  onNotify: (message: string) => void;
  onMonthChange: (month: YearMonth) => void;
}

export function AppContent({
  screen,
  month,
  finance,
  monthlyMovements,
  summary,
  previousMonthExpense,
  budget,
  budgetStatus,
  onNavigate,
  onEditMovement,
  onDeleteMovement,
  onNotify,
  onMonthChange
}: AppContentProps) {
  const { data } = finance;
  const previousBudget = getBudget(data.budgets, shiftMonth(month, -1));
  const history = (movements: Movement[]) => (
    <MovementHistory
      movements={movements}
      categories={data.categories}
      onEdit={onEditMovement}
      onDelete={onDeleteMovement}
      onDuplicate={(movement) => {
        finance.duplicateMovement(movement);
        onNotify('Movimiento duplicado.');
      }}
      onMoveNextMonth={(movement) => {
        finance.moveToNextMonth(movement);
        onNotify('Movimiento copiado al mes siguiente.');
      }}
      onBulkDelete={finance.deleteMovements}
      onBulkCategory={finance.recategorizeMovements}
    />
  );
  return (
    <div className="content">
      {screen === 'dashboard' && (
        <>
          <SummaryView
            summary={summary}
            previousMonthExpense={previousMonthExpense}
            budgetLimit={budget.general}
            budgetStatus={budgetStatus}
            showDemoAction={data.movements.length === 0}
            onLoadDemo={() => finance.loadDemo(month)}
            onReviewBudget={() => onNavigate('budgets')}
          />
          {history(monthlyMovements)}
        </>
      )}
      {screen === 'movements' && (
        <>
          <PageTitle
            eyebrow="Registro completo"
            title="Todos los movimientos"
            description="Busca, filtra y ordena tu historial."
          />
          <RecurrenceManager movements={data.movements} onToggle={finance.toggleRecurrence} />
          <FinanceTools
            data={data}
            month={month}
            categories={data.categories}
            onGenerateRecurring={finance.generateRecurring}
            onImportMovements={finance.importMovements}
            onRestore={finance.replaceData}
            onClearData={finance.clearData}
            onNotify={onNotify}
          />
          {history(data.movements)}
        </>
      )}
      {screen === 'budgets' && (
        <>
          <div className="content-month">
            <MonthPicker value={month} onChange={onMonthChange} />
          </div>
          <PageTitle
            eyebrow="Planificación"
            title="Presupuesto mensual"
            description="Fija límites realistas y sigue el avance por categoría."
          />
          <BudgetPanel
            key={`${budget.month}-${budget.general}-${JSON.stringify(budget.byCategory)}`}
            budget={budget}
            previousBudget={previousBudget}
            movements={monthlyMovements}
            categories={data.categories}
            onSave={finance.saveBudget}
          />
          <button
            className="text-button carry-budget"
            onClick={() =>
              void finance
                .copyPreviousBudget(month)
                .then((copied) =>
                  onNotify(
                    copied
                      ? 'Presupuesto anterior copiado.'
                      : 'No existe un presupuesto en el mes anterior.'
                  )
                )
            }
          >
            Copiar presupuesto del mes anterior
          </button>
          <SavingsGoals
            goals={data.savingsGoals}
            onSave={finance.saveGoal}
            onDelete={finance.deleteGoal}
          />
        </>
      )}
      {screen === 'reports' && (
        <>
          <div className="content-month">
            <MonthPicker value={month} onChange={onMonthChange} />
          </div>
          <PageTitle
            eyebrow="Análisis"
            title="Informes"
            description="Observa en qué gastas y cómo evoluciona tu balance."
          />
          <Suspense
            fallback={
              <div className="chart-skeleton" aria-label="Cargando informes">
                <span />
                <span />
                <span />
              </div>
            }
          >
            <Reports movements={data.movements} categories={data.categories} month={month} />
          </Suspense>
        </>
      )}
      {screen === 'categories' && (
        <CategoriesPanel
          categories={data.categories}
          onCreate={finance.addCategory}
          onUpdate={finance.updateCategory}
          onDelete={finance.deleteCategory}
        />
      )}
    </div>
  );
}
