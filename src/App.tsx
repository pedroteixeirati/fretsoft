import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import PlatformTenants from './pages/PlatformTenants';
import TenantProfile from './pages/TenantProfile';
import Expenses from './pages/Expenses';
import Vehicles from './pages/Vehicles';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import Companies from './pages/Companies';
import Contracts from './pages/Contracts';
import Freights from './pages/Freights';
import Settings from './pages/Settings';
import Support from './pages/Support';
import { NavItem } from './types';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { LogIn } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<NavItem>('dashboard');
  const { user, loading, signIn } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
      // Traduzir alguns erros comuns do Firebase
      let message = 'Ocorreu um erro na autenticação.';
      if (error.code === 'auth/user-not-found') message = 'Usuário não encontrado.';
      if (error.code === 'auth/wrong-password') message = 'Senha incorreta.';
      if (error.code === 'auth/email-already-in-use') message = 'Este usuário ou e-mail já está em uso.';
      if (error.code === 'auth/weak-password') message = 'A senha deve ter pelo menos 6 caracteres.';
      if (error.code === 'auth/invalid-email') message = 'E-mail ou usuário inválido.';
      if (error.code === 'auth/operation-not-allowed') message = 'O login por E-mail/Senha não está ativado no Console do Firebase.';
      
      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <div className="max-w-md w-full bg-surface-container-lowest p-10 rounded-[3rem] shadow-2xl border border-outline-variant">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-8">
            <LogIn className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-on-surface mb-2 tracking-tight text-center">Nova Log</h1>
          <p className="text-on-surface-variant mb-8 leading-relaxed text-center">
            Acesse sua conta para gerenciar sua frota.
          </p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Usuário ou E-mail</label>
              <input 
                required
                type="text" 
                placeholder="Ex: pedro ou seu@email.com"
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
                placeholder="••••••••"
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {authError && (
              <div className="bg-error/10 border border-error/20 p-4 rounded-xl mb-4">
                <p className="text-error text-xs font-bold uppercase mb-1">Erro de Autenticação</p>
                <p className="text-on-surface-variant text-xs leading-relaxed">
                  {authError}
                </p>
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'expenses':
        return <Expenses onNavigate={setActiveTab} />;
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
      <Sidebar activeItem={activeTab} onNavigate={setActiveTab} />
      <TopBar onNavigate={setActiveTab} />
      <main className="ml-64 pt-24 px-10 pb-12">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
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
