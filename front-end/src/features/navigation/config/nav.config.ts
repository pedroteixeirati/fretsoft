import { useMemo, type ElementType } from 'react';
import {
  BarChart3,
  Building2,
  BriefcaseBusiness,
  CreditCard,
  FileText,
  FolderKanban,
  Layers3,
  LayoutDashboard,
  Route,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  WalletCards,
  ReceiptText,
} from 'lucide-react';
import { NavItem, UserProfile } from '../../../shared/types/common.types';
import { canAccess } from '../../../lib/permissions';
import { useAuth } from '../../auth/hooks/useAuth';

export interface NavigationItem {
  id: NavItem;
  label: string;
  icon: ElementType;
}

export interface NavigationSection {
  id: string;
  label: string;
  icon: ElementType;
  items: NavigationItem[];
}

function compactItems(items: Array<NavigationItem | null>): NavigationItem[] {
  return items.filter((item): item is NavigationItem => item !== null);
}

function navItem(id: NavItem, label: string, icon: ElementType): NavigationItem {
  return { id, label, icon };
}

export function buildNavigationSections(userProfile: UserProfile | null): NavigationSection[] {
  const canSeeAdminMenu = userProfile?.role === 'dev';

  return [
    {
      id: 'overview',
      label: 'Visao geral',
      icon: LayoutDashboard,
      items: [navItem('dashboard', 'Painel', LayoutDashboard)],
    },
    {
      id: 'platform',
      label: 'Plataforma',
      icon: ShieldCheck,
      items: canAccess(userProfile, 'platformTenants', 'read')
        ? [navItem('platformTenants', 'Transportadoras', ShieldCheck)]
        : [],
    },
    {
      id: 'operations',
      label: 'Operacao',
      icon: BriefcaseBusiness,
      items: compactItems([
        canAccess(userProfile, 'freights', 'read') ? navItem('freights', 'Fretes', Route) : null,
        canAccess(userProfile, 'contracts', 'read') ? navItem('contracts', 'Contratos', FileText) : null,
        canAccess(userProfile, 'expenses', 'read') ? navItem('expenses', 'Custos operacionais', CreditCard) : null,
      ]),
    },
    {
      id: 'novalog',
      label: 'Novalog',
      icon: ReceiptText,
      items: compactItems([
        userProfile?.tenantSlug === 'novalog' ? navItem('novalogOperations', 'Lancamentos', Layers3) : null,
        userProfile?.tenantSlug === 'novalog' ? navItem('novalogBillings', 'Faturamentos', ReceiptText) : null,
      ]),
    },
    {
      id: 'management',
      label: 'Gestao',
      icon: WalletCards,
      items: [
        navItem('revenues', 'Contas a receber', WalletCards),
        navItem('payables', 'Contas a pagar', CreditCard),
        navItem('reports', 'Relatorios', BarChart3),
      ],
    },
    {
      id: 'registry',
      label: 'Cadastros',
      icon: FolderKanban,
      items: compactItems([
        canAccess(userProfile, 'vehicles', 'read') ? navItem('vehicles', 'Veiculos', Truck) : null,
        canAccess(userProfile, 'providers', 'read') ? navItem('suppliers', 'Fornecedores', Users) : null,
        canAccess(userProfile, 'companies', 'read') ? navItem('companies', 'Empresas', Building2) : null,
      ]),
    },
    {
      id: 'admin',
      label: 'Administracao',
      icon: Settings,
      items: compactItems([
        canSeeAdminMenu && canAccess(userProfile, 'tenantProfile', 'read') ? navItem('tenantProfile', 'Transportadora', Building2) : null,
        canSeeAdminMenu && canAccess(userProfile, 'settings', 'read') ? navItem('settings', 'Configuracoes', Settings) : null,
        canSeeAdminMenu ? navItem('support', 'Suporte', ShieldCheck) : null,
      ]),
    },
  ].filter((section) => section.items.length > 0);
}

export function useNavigationSections(): NavigationSection[] {
  const { userProfile } = useAuth();

  return useMemo(() => buildNavigationSections(userProfile), [userProfile]);
}
