import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Search, Settings, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../firebase';
import { useAuth } from '../../auth/hooks/useAuth';
import { getPathFromNavItem } from '../../../app/router/navigation';
import { canAccess } from '../../../lib/permissions';

export default function TopBar() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const canOpenSettings = canAccess(userProfile, 'settings', 'read');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'dev': return 'bg-tertiary/20 text-tertiary';
      case 'owner': return 'bg-primary-fixed text-primary';
      case 'admin': return 'bg-primary/20 text-primary';
      case 'financial': return 'bg-secondary/20 text-secondary';
      case 'operational': return 'bg-tertiary-container text-on-tertiary-container';
      case 'driver': return 'bg-secondary/20 text-secondary';
      default: return 'bg-surface-container text-on-surface-variant';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'dev': return 'Desenvolvedor';
      case 'owner': return 'Proprietario';
      case 'admin': return 'Administrador';
      case 'financial': return 'Financeiro';
      case 'operational': return 'Operacional';
      case 'driver': return 'Motorista';
      case 'viewer': return 'Visualizador';
      default: return role;
    }
  };

  const displayName = userProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'Usuario';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <header className="fixed top-0 right-0 left-64 z-40 flex h-16 items-center justify-between border-none bg-surface/80 px-8 backdrop-blur-md">
      <div className="flex items-center gap-8">
        <div className="group relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar frota..."
            className="w-64 rounded-full border-none bg-surface-container py-1.5 pl-10 pr-4 text-xs outline-none transition-all focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((current) => !current)}
              className="flex items-center gap-3 rounded-full border border-outline-variant/60 bg-surface-container-lowest px-2.5 py-1.5 shadow-sm transition-colors hover:bg-surface-container"
            >
              <div className="hidden text-right lg:block">
                <p className="text-xs font-bold leading-none text-on-surface">{displayName}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-on-surface-variant">
                  {userProfile?.tenantName || 'Conta da plataforma'}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container text-primary">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="h-4 w-4" />
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-on-surface-variant transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] w-72 overflow-hidden rounded-3xl border border-outline-variant/70 bg-surface-container-lowest p-2 shadow-[0_24px_60px_rgba(26,28,21,0.18)]">
                <div className="rounded-[1.35rem] bg-surface-container px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container text-primary">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'Usuario'}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <UserIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-on-surface">{displayName}</p>
                      <p className="truncate text-xs text-on-surface-variant">{user.email}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {userProfile ? (
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-tighter ${getRoleBadge(userProfile.role)}`}>
                        {getRoleLabel(userProfile.role)}
                      </span>
                    ) : (
                      <span className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-black uppercase tracking-tighter text-on-surface-variant">
                        Carregando perfil
                      </span>
                    )}
                    {userProfile?.tenantName && (
                      <span className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-black uppercase tracking-tighter text-on-surface-variant">
                        {userProfile.tenantName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  {canOpenSettings ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate(getPathFromNavItem('settings'));
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
                    >
                      <Settings className="h-4 w-4 text-on-surface-variant" />
                      Configuracoes
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-error transition-colors hover:bg-error/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <button className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
