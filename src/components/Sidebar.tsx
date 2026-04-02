import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  Truck, 
  Users, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  LogOut,
  User
} from 'lucide-react';
import { NavItem } from '../types';
import { cn } from '../lib/utils';
import { useFirebase } from '../context/FirebaseContext';
import { logout } from '../firebase';

interface SidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
}

export default function Sidebar({ activeItem, onNavigate }: SidebarProps) {
  const { user, userProfile } = useFirebase();

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'dev';

  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'expenses', label: 'Despesas', icon: CreditCard },
    { id: 'vehicles', label: 'Veículos', icon: Truck },
    { id: 'suppliers', label: 'Fornecedores', icon: Users },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, adminOnly: true },
  ].filter(item => !item.adminOnly || isAdmin);

  const bottomItems = [
    { id: 'settings', label: 'Configurações', icon: Settings, adminOnly: true },
    { id: 'support', label: 'Suporte', icon: HelpCircle },
  ].filter(item => !item.adminOnly || isAdmin);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 sidebar-glass flex flex-col py-8 px-4 z-50 shadow-[32px_0_32px_rgba(26,28,21,0.06)]">
      <div className="px-4 mb-10">
        <h1 className="text-xl font-bold text-primary font-headline tracking-tighter">Nova Log</h1>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as NavItem)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 group",
              activeItem === item.id 
                ? "bg-primary-fixed text-on-surface font-bold" 
                : "text-on-surface-variant hover:bg-primary-fixed-dim/20"
            )}
          >
            <item.icon className={cn("w-5 h-5", activeItem === item.id ? "text-primary" : "text-on-surface-variant")} />
            <span className="font-headline text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant/10 pt-4">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as NavItem)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300",
              activeItem === item.id 
                ? "bg-primary-fixed text-on-surface font-bold" 
                : "text-on-surface-variant hover:bg-primary-fixed-dim/20"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-headline text-sm">{item.label}</span>
          </button>
        ))}
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-full text-on-surface-variant hover:bg-error-container/20 hover:text-error transition-all duration-300 mt-2"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-headline text-sm">Sair</span>
        </button>

        <div className="px-4 mt-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-container overflow-hidden flex items-center justify-center">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'Usuário'} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold truncate">
              {userProfile?.name || 
               (user?.email?.endsWith('@novalog.test') ? user.email.split('@')[0] : user?.displayName) || 
               'Usuário'}
            </p>
            <p className="text-[10px] text-on-surface-variant truncate">
              {userProfile?.role === 'dev' ? 'Desenvolvedor' : userProfile?.role === 'admin' ? 'Administrador' : userProfile?.role === 'driver' ? 'Motorista' : 'Visualizador'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
