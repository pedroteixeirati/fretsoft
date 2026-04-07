import React, { useEffect, useState } from 'react';
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
  ChevronDown,
  BriefcaseBusiness,
  FolderKanban,
  WalletCards,
} from 'lucide-react';
import { NavItem } from '../types';
import { cn } from '../lib/utils';
import { useFirebase } from '../context/FirebaseContext';
import { canAccess } from '../lib/permissions';

interface SidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
}

export default function Sidebar({ activeItem, onNavigate }: SidebarProps) {
  const { userProfile } = useFirebase();

  const sections = [
    {
      id: 'overview',
      label: 'Visao geral',
      icon: LayoutDashboard,
      items: [{ id: 'dashboard', label: 'Painel', icon: LayoutDashboard, allowed: true }],
    },
    {
      id: 'platform',
      label: 'Plataforma',
      icon: ShieldCheck,
      items: [{ id: 'platformTenants', label: 'Transportadoras', icon: ShieldCheck, allowed: canAccess(userProfile, 'platformTenants', 'read') }],
    },
    {
      id: 'registry',
      label: 'Cadastros',
      icon: FolderKanban,
      items: [
        { id: 'vehicles', label: 'Veiculos', icon: Truck, allowed: canAccess(userProfile, 'vehicles', 'read') },
        { id: 'suppliers', label: 'Fornecedores', icon: Users, allowed: canAccess(userProfile, 'providers', 'read') },
        { id: 'companies', label: 'Empresas', icon: Building2, allowed: canAccess(userProfile, 'companies', 'read') },
      ],
    },
    {
      id: 'operations',
      label: 'Operacao',
      icon: BriefcaseBusiness,
      items: [
        { id: 'freights', label: 'Fretes', icon: Route, allowed: canAccess(userProfile, 'freights', 'read') },
        { id: 'contracts', label: 'Contratos', icon: FileText, allowed: canAccess(userProfile, 'contracts', 'read') },
        { id: 'expenses', label: 'Custos operacionais', icon: CreditCard, allowed: canAccess(userProfile, 'expenses', 'read') },
      ],
    },
    {
      id: 'management',
      label: 'Gestao',
      icon: WalletCards,
      items: [
        { id: 'revenues', label: 'Contas a receber', icon: WalletCards, allowed: canAccess(userProfile, 'revenues', 'read') },
        { id: 'payables', label: 'Contas a pagar', icon: CreditCard, allowed: canAccess(userProfile, 'payables', 'read') },
        { id: 'reports', label: 'Relatorios', icon: BarChart3, allowed: canAccess(userProfile, 'reports', 'read') },
      ],
    },
    {
      id: 'admin',
      label: 'Administracao',
      icon: Settings,
      items: [
        { id: 'tenantProfile', label: 'Transportadora', icon: Building2, allowed: canAccess(userProfile, 'tenantProfile', 'read') },
        { id: 'settings', label: 'Configuracoes', icon: Settings, allowed: canAccess(userProfile, 'settings', 'read') },
        { id: 'support', label: 'Suporte', icon: ShieldCheck, allowed: true },
      ],
    },
  ]
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.allowed),
    }))
    .filter((section) => section.items.length > 0);

  const sectionForActiveItem =
    sections.find((section) => section.items.some((item) => item.id === activeItem))?.id || sections[0]?.id;

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((section) => [section.id, section.id === sectionForActiveItem]))
  );

  useEffect(() => {
    if (!sectionForActiveItem) return;
    setOpenSections((current) => ({
      ...Object.fromEntries(sections.map((section) => [section.id, current[section.id] ?? false])),
      [sectionForActiveItem]: true,
    }));
  }, [activeItem, sectionForActiveItem, sections.length]);

  const toggleSection = (sectionId: string) => {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 sidebar-glass flex flex-col py-8 px-4 z-50 shadow-[32px_0_32px_rgba(26,28,21,0.06)] overflow-hidden">
      <div className="px-4 mb-10 shrink-0">
        {userProfile?.tenantLogoUrl ? (
          <div className="flex h-28 items-center justify-start px-1">
            <img
              src={userProfile.tenantLogoUrl}
              alt={`Logo da ${userProfile.tenantName}`}
              className="max-h-full max-w-full object-contain object-left"
            />
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-primary font-headline tracking-tighter">
              {userProfile?.tenantName || 'JP Soft'}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mt-1">Plataforma</p>
          </>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <nav className="min-h-0 overflow-y-auto pr-1">
          <div className="rounded-[2rem] p-1">
            <div className="space-y-0.5">
              {sections.map((section, index) => {
                const isOpen = openSections[section.id];
                const hasActiveChild = section.items.some((item) => item.id === activeItem);

                return (
                  <div
                    key={section.id}
                    className={cn(
                      'pb-1',
                      index !== sections.length - 1 ? 'border-b border-outline-variant/10 mb-1.5' : ''
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-[1rem] px-3 py-2.5 text-left transition-colors',
                        hasActiveChild ? 'bg-primary-fixed/55 text-on-surface' : 'text-on-surface-variant hover:bg-primary-fixed-dim/15'
                      )}
                    >
                      <section.icon className={cn('h-4 w-4 shrink-0', hasActiveChild ? 'text-primary' : 'text-on-surface-variant')} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em]">{section.label}</p>
                        <p className="mt-0.5 text-[9px] text-on-surface-variant">{section.items.length} item{section.items.length > 1 ? 's' : ''}</p>
                      </div>
                      <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', isOpen ? 'rotate-180' : '')} />
                    </button>

                    {isOpen && (
                      <div className="mt-1 space-y-0.5 px-1">
                        {section.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => onNavigate(item.id as NavItem)}
                            className={cn(
                              'flex min-h-9 w-full items-center gap-2.5 rounded-full px-3.5 py-2 transition-all duration-300',
                              activeItem === item.id
                                ? 'bg-primary text-on-primary font-bold shadow-lg shadow-primary/15'
                                : 'text-on-surface-variant hover:bg-primary-fixed-dim/20'
                            )}
                          >
                            <item.icon className={cn('h-4 w-4 shrink-0', activeItem === item.id ? 'text-on-primary' : 'text-on-surface-variant')} />
                            <span className="font-headline text-[13px] leading-none whitespace-nowrap">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="mt-4 border-t border-outline-variant/10 pt-4 shrink-0" />
      </div>
    </aside>
  );
}
