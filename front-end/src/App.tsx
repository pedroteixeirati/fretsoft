import React, { useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import PlatformTenants from './pages/PlatformTenants';
import TenantProfile from './pages/TenantProfile';
import Revenues from './pages/Revenues';
import Payables from './pages/Payables';
import Expenses from './pages/Expenses';
import Vehicles from './pages/Vehicles';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import Companies from './pages/Companies';
import Contracts from './pages/Contracts';
import Freights from './pages/Freights';
import Settings from './pages/Settings';
import Support from './pages/Support';
import { NavItem, UserProfile } from './types';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { canAccess } from './lib/permissions';

function getFirstAllowedTab(profile: UserProfile): NavItem {
  if (canAccess(profile, 'platformTenants', 'read')) return 'platformTenants';
  if (canAccess(profile, 'vehicles', 'read')) return 'vehicles';
  if (canAccess(profile, 'providers', 'read')) return 'suppliers';
  if (canAccess(profile, 'companies', 'read')) return 'companies';
  if (canAccess(profile, 'freights', 'read')) return 'freights';
  if (canAccess(profile, 'contracts', 'read')) return 'contracts';
  if (canAccess(profile, 'expenses', 'read')) return 'expenses';
  if (canAccess(profile, 'revenues', 'read')) return 'revenues';
  if (canAccess(profile, 'payables', 'read')) return 'payables';
  if (canAccess(profile, 'reports', 'read')) return 'reports';
  if (canAccess(profile, 'tenantProfile', 'read')) return 'tenantProfile';
  if (canAccess(profile, 'settings', 'read')) return 'settings';
  return 'dashboard';
}

function resolveAllowedTab(profile: UserProfile, activeTab: NavItem): NavItem {
  switch (activeTab) {
    case 'platformTenants':
      return canAccess(profile, 'platformTenants', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'tenantProfile':
      return canAccess(profile, 'tenantProfile', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'revenues':
      return canAccess(profile, 'revenues', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'payables':
      return canAccess(profile, 'payables', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'expenses':
      return canAccess(profile, 'expenses', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'vehicles':
      return canAccess(profile, 'vehicles', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'suppliers':
      return canAccess(profile, 'providers', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'companies':
      return canAccess(profile, 'companies', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'contracts':
      return canAccess(profile, 'contracts', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'freights':
      return canAccess(profile, 'freights', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'reports':
      return canAccess(profile, 'reports', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'settings':
      return canAccess(profile, 'settings', 'read') ? activeTab : getFirstAllowedTab(profile);
    default:
      return activeTab;
  }
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<NavItem>('dashboard');
  const { user, userProfile, loading, signIn, logout } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveTab = useMemo(() => {
    if (!userProfile) return activeTab;
    return resolveAllowedTab(userProfile, activeTab);
  }, [activeTab, userProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      console.error('Auth error:', error);
      let message = 'Ocorreu um erro na autenticacao.';
      if (error.code === 'auth/user-not-found') message = 'Usuario nao encontrado.';
      if (error.code === 'auth/wrong-password') message = 'Senha incorreta.';
      if (error.code === 'auth/email-already-in-use') message = 'Este e-mail ja esta em uso.';
      if (error.code === 'auth/weak-password') message = 'A senha deve ter pelo menos 6 caracteres.';
      if (error.code === 'auth/invalid-email') message = 'E-mail invalido.';
      if (error.code === 'auth/operation-not-allowed') message = 'O login por E-mail/Senha nao esta ativado no Console do Firebase.';
      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <div className="max-w-md w-full bg-surface-container-lowest p-10 rounded-[3rem] shadow-2xl border border-outline-variant">
          <div className="flex justify-center mb-10">
            <img
              src="/fretsoft-logo.png"
              alt="Fretsoft"
              className="h-28 w-auto object-contain"
            />
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">E-mail</label>
              <input
                required
                type="email"
                placeholder="Ex: seu@email.com"
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Senha</label>
              <input
                required
                type="password"
                placeholder="........"
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {authError && (
              <div className="bg-error/10 border border-error/20 p-4 rounded-xl mb-4">
                <p className="text-error text-xs font-bold uppercase mb-1">Erro de Autenticacao</p>
                <p className="text-on-surface-variant text-xs leading-relaxed">{authError}</p>
                {authError.includes('Console do Firebase') && (
                  <p className="mt-2 text-[10px] text-on-surface-variant italic">
                    Acesse: Console {' > '} Authentication {' > '} Sign-in method {' > '} Ativar E-mail/Senha.
                  </p>
                )}
              </div>
            )}

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full bg-primary text-on-primary py-4 rounded-full font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? 'Processando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <div className="max-w-lg w-full bg-surface-container-lowest p-10 rounded-[3rem] shadow-2xl border border-outline-variant">
          <h1 className="text-3xl font-black text-on-surface mb-2 tracking-tight text-center">Acesso pendente</h1>
          <p className="text-on-surface-variant leading-relaxed text-center">
            Sua conta foi autenticada, mas ainda nao possui vinculacao com uma transportadora ativa.
            Solicite acesso ao administrador da plataforma ou ao owner da sua empresa.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => void logout()}
              className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (effectiveTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'expenses':
        return <Expenses onNavigate={setActiveTab} />;
      case 'revenues':
        return <Revenues />;
      case 'payables':
        return <Payables />;
      case 'tenantProfile':
        return <TenantProfile />;
      case 'platformTenants':
        return <PlatformTenants />;
      case 'vehicles':
        return <Vehicles />;
      case 'suppliers':
        return <Suppliers />;
      case 'companies':
        return <Companies />;
      case 'contracts':
        return <Contracts />;
      case 'freights':
        return <Freights />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'support':
        return <Support />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar activeItem={effectiveTab} onNavigate={setActiveTab} />
      <TopBar onNavigate={setActiveTab} />
      <main className="ml-64 pt-24 px-10 pb-12">
        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
