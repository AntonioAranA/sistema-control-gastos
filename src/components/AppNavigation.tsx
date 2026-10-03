import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Download,
  LayoutDashboard,
  LogOut,
  Moon,
  ReceiptText,
  Tags,
  Sun,
  WalletCards,
  X
} from 'lucide-react';
import type { Screen } from '../types';
import type { Theme } from '../hooks/useTheme';

interface NavigationItem {
  id: Screen;
  label: string;
  icon: LucideIcon;
}

const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'movements', label: 'Movimientos', icon: ReceiptText },
  { id: 'budgets', label: 'Presupuestos', icon: WalletCards },
  { id: 'reports', label: 'Informes', icon: BarChart3 },
  { id: 'categories', label: 'Categorías', icon: Tags }
];

interface SidebarProps {
  currentScreen: Screen;
  isOpen: boolean;
  theme: Theme;
  onNavigate: (screen: Screen) => void;
  onClose: () => void;
  onExport: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  userEmail: string;
}

export function Sidebar({
  currentScreen,
  isOpen,
  theme,
  onNavigate,
  onClose,
  onExport,
  onToggleTheme,
  onLogout,
  userEmail
}: SidebarProps) {
  return (
    <>
      <aside className={isOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>Balance</strong>
            <span>Finanzas personales</span>
          </div>
          <button className="mobile-close" onClick={onClose} aria-label="Cerrar menú">
            <X />
          </button>
        </div>
        <NavigationButtons currentScreen={currentScreen} onNavigate={onNavigate} />
        <div className="sidebar-bottom">
          <button onClick={onExport}>
            <Download />
            Exportar CSV
          </button>
          <button onClick={onToggleTheme}>
            {theme === 'dark' ? <Sun /> : <Moon />}
            {theme === 'dark' ? 'Tema luminoso' : 'Tema oscuro'}
          </button>
          <button onClick={onLogout} title={userEmail}>
            <LogOut />
            Cerrar sesión
          </button>
        </div>
      </aside>
      {isOpen && <button className="menu-scrim" aria-label="Cerrar menú" onClick={onClose} />}
    </>
  );
}

interface NavigationButtonsProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  mobile?: boolean;
  onLogout?: () => void;
}

export function NavigationButtons({
  currentScreen,
  onNavigate,
  mobile = false,
  onLogout
}: NavigationButtonsProps) {
  const buttons = NAVIGATION_ITEMS.map((item) => (
    <button
      key={item.id}
      className={currentScreen === item.id ? 'active' : ''}
      onClick={() => onNavigate(item.id)}
    >
      <item.icon />
      {mobile ? <span>{item.label}</span> : item.label}
    </button>
  ));

  return mobile ? (
    <nav className="mobile-nav" aria-label="Navegación móvil">
      {buttons}
      {onLogout && (
        <button type="button" onClick={onLogout} aria-label="Cerrar sesión">
          <LogOut />
          <span>Salir</span>
        </button>
      )}
    </nav>
  ) : (
    <nav aria-label="Navegación principal">{buttons}</nav>
  );
}
