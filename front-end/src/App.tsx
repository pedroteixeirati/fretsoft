import React, { useMemo, useState } from 'react';
import { ArrowRight, Globe, Lock, Mail, ShieldCheck, TrendingUp } from 'lucide-react';
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
      <div
        className="relative min-h-screen overflow-hidden bg-surface px-4 py-6 sm:px-6"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(82,102,0,0.08) 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,237,127,0.18),transparent_40%)]" />

        <div className="relative flex min-h-screen items-center justify-center">
          <div className="w-full max-w-[24rem] rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest/90 px-7 py-8 shadow-[0_20px_64px_rgba(82,102,0,0.09)] backdrop-blur xl:px-8">
            <div className="flex justify-center">
              <img
                src="/fretsoft-login-icon.png"
                alt="Icone Fretsoft"
                className="h-16 w-16 object-contain drop-shadow-[0_14px_28px_rgba(82,102,0,0.18)]"
              />
            </div>

            <div className="mt-6 text-center">
              <h1 className="text-3xl font-black tracking-tight text-primary">Fretsoft</h1>
              <p className="mt-2 text-[13px] uppercase tracking-[0.22em] text-on-surface-variant">GESTAO MODERNA PARA FROTAS</p>
            </div>

            <form onSubmit={handleAuth} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label className="block pl-1 text-xs font-medium uppercase tracking-[0.18em] text-on-surface">Email</label>
                <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 shadow-inner shadow-primary/5 ring-1 ring-primary/5">
                  <Mail className="h-4.5 w-4.5 text-on-surface-variant" />
                  <input
                    required
                    type="email"
                    placeholder="seu@email.com"
                    className="w-full bg-transparent text-lg text-on-surface placeholder:text-on-surface-variant/65 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <label className="block pl-1 text-xs font-medium uppercase tracking-[0.18em] text-on-surface">Senha</label>
                  <span className="text-sm font-bold text-primary">Esqueceu?</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 shadow-inner shadow-primary/5 ring-1 ring-primary/5">
                  <Lock className="h-4.5 w-4.5 text-on-surface-variant" />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-transparent text-lg text-on-surface placeholder:text-on-surface-variant/65 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {authError && (
                <div className="rounded-2xl border border-error/20 bg-error/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-error">Erro de autenticacao</p>
                  <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{authError}</p>
                  {authError.includes('Console do Firebase') && (
                    <p className="mt-2 text-xs italic text-on-surface-variant">
                      Acesse: Console {' > '} Authentication {' > '} Sign-in method {' > '} Ativar E-mail/Senha.
                    </p>
                  )}
                </div>
              )}

              <button
                disabled={isSubmitting}
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 text-lg font-black text-on-primary shadow-[0_16px_26px_rgba(82,102,0,0.2)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? 'Processando...' : 'Entrar no painel'}
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </form>

            <div className="mt-8 border-t border-outline-variant/15 pt-5 text-center">
              <p className="text-sm text-on-surface-variant">
                Nao possui acesso? <span className="font-black text-primary">Fale com o suporte</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4 text-xs uppercase tracking-[0.22em] text-on-surface-variant/75">
          <span>Powered by JPSOFT</span>
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
