import { useEffect, useMemo, useState } from 'react';
import { LogOut, Menu, Plus } from 'lucide-react';
import { AppContent } from './components/AppContent';
import { NavigationButtons, Sidebar } from './components/AppNavigation';
import { MonthPicker } from './components/MonthPicker';
import { MovementForm } from './components/MovementForm';
import { ConfirmDelete, Toast } from './components/Feedback';
import { useFinance } from './hooks/useFinance';
import { useTheme } from './hooks/useTheme';
import { budgetStatus, calculateSummary, getBudget, movementsForMonth } from './lib/calculations';
import { currentMonth, shiftMonth } from './lib/date';
import { AuthScreen } from './components/AuthScreen';
import { LocalDataImport } from './components/LocalDataImport';
import { useSession } from './hooks/useSession';
import { clearLocalFinancialData, getLocalDataForImport } from './lib/storage';
import { api } from './lib/api';
import type { Movement, Screen, YearMonth } from './types';

export default function App() {
  const session = useSession();
  const finance = useFinance(Boolean(session.user));
  const { theme, toggleTheme } = useTheme();
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [month, setMonth] = useState<YearMonth>(currentMonth);
  const [editingMovement, setEditingMovement] = useState<Movement | null>();
  const [pendingDelete, setPendingDelete] = useState<Movement>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [localImport, setLocalImport] = useState(getLocalDataForImport);

  const monthlyMovements = useMemo(
    () => movementsForMonth(finance.data.movements, month),
    [finance.data.movements, month]
  );
  const summary = calculateSummary(monthlyMovements);
  const previousSummary = calculateSummary(
    movementsForMonth(finance.data.movements, shiftMonth(month, -1))
  );
  const budget = getBudget(finance.data.budgets, month);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isEditingText =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement;
      if (event.key.toLowerCase() === 'n' && !isEditingText) setEditingMovement(null);
      if (event.key === 'Escape') {
        setEditingMovement(undefined);
        setPendingDelete(undefined);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const notify = (message: string): void => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };
  const navigate = (next: Screen): void => {
    setScreen(next);
    setIsMobileMenuOpen(false);
  };

  if (session.loading && !session.user)
    return (
      <div className="app-loading" role="status">
        Cargando sesión…
      </div>
    );
  if (!session.user)
    return (
      <AuthScreen
        loading={session.loading}
        error={session.error}
        onLogin={session.login}
        onRegister={session.register}
      />
    );

  return (
    <div className="app-shell">
      <Sidebar
        currentScreen={screen}
        isOpen={isMobileMenuOpen}
        theme={theme}
        onNavigate={navigate}
        onClose={() => setIsMobileMenuOpen(false)}
        onExport={() =>
          void api
            .downloadCsv()
            .catch((cause) =>
              notify(cause instanceof Error ? cause.message : 'No fue posible exportar')
            )
        }
        onToggleTheme={toggleTheme}
        onLogout={() => void session.logout()}
        userEmail={session.user.email}
      />
      <main>
        <header className={`topbar ${screen !== 'dashboard' ? 'without-month' : ''}`}>
          <button
            className="menu-button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu />
          </button>
          {screen === 'dashboard' && <MonthPicker value={month} onChange={setMonth} />}
          <button
            className="button primary new-button"
            onClick={() => setEditingMovement(null)}
            title="Atajo: N"
          >
            <Plus />
            Nuevo <span>movimiento</span>
          </button>
          <button
            className="icon-button logout-button"
            onClick={() => void session.logout()}
            aria-label="Cerrar sesión"
            title={session.user.email}
          >
            <LogOut />
          </button>
        </header>
        {finance.error && (
          <div className="api-error" role="alert">
            {finance.error}
            <button onClick={() => void finance.refresh()}>Reintentar</button>
          </div>
        )}
        {finance.loading && finance.data.categories.length === 0 ? (
          <div className="app-loading" role="status">
            Cargando tus datos…
          </div>
        ) : (
          <AppContent
            screen={screen}
            month={month}
            finance={finance}
            monthlyMovements={monthlyMovements}
            summary={summary}
            previousMonthExpense={previousSummary.expense}
            budget={budget}
            budgetStatus={budgetStatus(summary.expense, budget.general)}
            onNavigate={navigate}
            onEditMovement={setEditingMovement}
            onDeleteMovement={setPendingDelete}
            onNotify={notify}
            onMonthChange={setMonth}
          />
        )}
      </main>
      <NavigationButtons
        currentScreen={screen}
        onNavigate={navigate}
        mobile
        onLogout={() => void session.logout()}
      />
      {editingMovement !== undefined && (
        <MovementForm
          categories={finance.data.categories}
          movement={editingMovement}
          onSave={(movement) => {
            finance.saveMovement(movement);
            notify('Movimiento guardado.');
          }}
          onAddCategory={finance.addCategory}
          onClose={() => setEditingMovement(undefined)}
        />
      )}
      {pendingDelete && (
        <ConfirmDelete
          movement={pendingDelete}
          onCancel={() => setPendingDelete(undefined)}
          onConfirm={() => {
            finance.deleteMovement(pendingDelete.id);
            setPendingDelete(undefined);
            notify('Movimiento eliminado.');
          }}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      {localImport && (
        <LocalDataImport
          data={localImport}
          onImport={finance.importSnapshot}
          onImported={() => {
            clearLocalFinancialData();
            setLocalImport(null);
            notify('Datos locales importados correctamente.');
          }}
          onDismiss={() => setLocalImport(null)}
        />
      )}
    </div>
  );
}
