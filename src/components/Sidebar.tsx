import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Truck,
  Users,
  Building2,
  FileText,
  Route,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { NavItem } from '../types';
import { cn } from '../lib/utils';
import { useFirebase } from '../context/FirebaseContext';
import { canAccess } from '../lib/permissions';
import { logout } from '../firebase';

interface SidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
}

export default function Sidebar({ activeItem, onNavigate }: SidebarProps) {
  const { userProfile } = useFirebase();

  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard, allowed: true },
    { id: 'platformTenants', label: 'Transportadoras', icon: ShieldCheck, allowed: canAccess(userProfile, 'platformTenants', 'read') },
    { id: 'tenantProfile', label: 'Transportadora', icon: Building2, allowed: canAccess(userProfile, 'tenantProfile', 'read') },
    { id: 'expenses', label: 'Despesas', icon: CreditCard, allowed: canAccess(userProfile, 'expenses', 'read') },
    { id: 'vehicles', label: 'Veiculos', icon: Truck, allowed: canAccess(userProfile, 'vehicles', 'read') },
    { id: 'suppliers', label: 'Fornecedores', icon: Users, allowed: canAccess(userProfile, 'providers', 'read') },
    { id: 'companies', label: 'Empresas', icon: Building2, allowed: canAccess(userProfile, 'companies', 'read') },
    { id: 'contracts', label: 'Contratos', icon: FileText, allowed: canAccess(userProfile, 'contracts', 'read') },
    { id: 'freights', label: 'Fretes', icon: Route, allowed: canAccess(userProfile, 'freights', 'read') },
    { id: 'reports', label: 'Relatorios', icon: BarChart3, allowed: canAccess(userProfile, 'reports', 'read') },
  ].filter((item) => item.allowed);

  const bottomItems = [
    { id: 'settings', label: 'Configuracoes', icon: Settings, allowed: canAccess(userProfile, 'settings', 'read') },
  ].filter((item) => item.allowed);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 sidebar-glass flex flex-col py-8 px-4 z-50 shadow-[32px_0_32px_rgba(26,28,21,0.06)] overflow-hidden">
      <div className="px-4 mb-10 shrink-0">
        <h1 className="text-xl font-bold text-primary font-headline tracking-tighter">
          {userProfile?.tenantName || 'JP Soft'}
        </h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mt-1">Plataforma</p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <nav className="flex flex-col gap-1 min-h-0 overflow-y-auto pr-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as NavItem)}
              className={cn(
                'flex min-h-12 shrink-0 items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 group',
                activeItem === item.id
                  ? 'bg-primary-fixed text-on-surface font-bold'
                  : 'text-on-surface-variant hover:bg-primary-fixed-dim/20'
              )}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', activeItem === item.id ? 'text-primary' : 'text-on-surface-variant')} />
              <span className="font-headline text-sm leading-none whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-4 flex flex-col gap-1 border-t border-outline-variant/10 pt-4 pb-2 shrink-0">
          {bottomItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as NavItem)}
              className={cn(
                'flex min-h-12 items-center gap-3 px-4 py-3 rounded-full transition-all duration-300',
                activeItem === item.id
                  ? 'bg-primary-fixed text-on-surface font-bold'
                  : 'text-on-surface-variant hover:bg-primary-fixed-dim/20'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="font-headline text-sm leading-none whitespace-nowrap">{item.label}</span>
            </button>
          ))}

          <button
            onClick={handleLogout}
            className="flex min-h-12 items-center gap-3 px-4 py-3 rounded-full text-on-surface-variant hover:bg-error-container/20 hover:text-error transition-all duration-300 mt-2"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-headline text-sm leading-none whitespace-nowrap">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
