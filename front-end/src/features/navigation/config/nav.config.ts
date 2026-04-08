import { useMemo, type ElementType } from 'react';
import {
  BarChart3,
  Building2,
  BriefcaseBusiness,
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Route,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  WalletCards,
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
      id: 'management',
      label: 'Gestao',
      icon: WalletCards,
      items: compactItems([
        canAccess(userProfile, 'revenues', 'read') ? navItem('revenues', 'Contas a receber', WalletCards) : null,
        canAccess(userProfile, 'payables', 'read') ? navItem('payables', 'Contas a pagar', CreditCard) : null,
        canAccess(userProfile, 'reports', 'read') ? navItem('reports', 'Relatorios', BarChart3) : null,
      ]),
    },
    {
      id: 'admin',
      label: 'Administracao',
      icon: Settings,
      items: compactItems([
        canAccess(userProfile, 'tenantProfile', 'read') ? navItem('tenantProfile', 'Transportadora', Building2) : null,
        canAccess(userProfile, 'settings', 'read') ? navItem('settings', 'Configuracoes', Settings) : null,
        navItem('support', 'Suporte', ShieldCheck),
      ]),
    },
  ].filter((section) => section.items.length > 0);
}

export function useNavigationSections(): NavigationSection[] {
  const { userProfile } = useAuth();

  return useMemo(() => buildNavigationSections(userProfile), [userProfile]);
}
