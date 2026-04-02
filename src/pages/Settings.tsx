import React, { useState } from 'react';
import { User, Bell, Shield, Wallet, Globe, Moon, Sun, ChevronRight, Save, LogOut, UserPlus, Loader2 } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { logout } from '../firebase';

export default function Settings() {
  const { user, userProfile, signUp } = useFirebase();
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'driver' | 'viewer'>('driver');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess(false);
    setIsCreating(true);
    try {
      await signUp(newUserEmail, newUserPassword, newUserRole);
      setCreateSuccess(true);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('driver');
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      let message = error.message || 'Erro ao criar usuário.';
      if (error.code === 'auth/email-already-in-use' || message.includes('email-already-in-use')) {
        message = 'Este nome de usuário ou e-mail já está em uso.';
      } else if (error.code === 'auth/weak-password') {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'E-mail ou nome de usuário inválido.';
      }
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Configurações</h1>
        <p className="text-on-surface-variant mt-1">Gerencie sua conta, preferências e segurança</p>
      </header>

      <div className="space-y-6">
        {userProfile?.role === 'dev' && (
          <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-sm">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-primary" />
                Gerenciamento de Usuários (Acesso Dev)
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Usuário ou E-mail</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: joao ou joao@email.com"
                      className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Senha</label>
                    <input 
                      required
                      type="password" 
                      placeholder="••••••••"
                      className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nível de Acesso</label>
                    <select 
                      required
                      className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                    >
                      <option value="driver">Motorista</option>
                      <option value="admin">Administrador</option>
                      <option value="viewer">Visualizador</option>
                    </select>
                  </div>
                </div>
                {createError && <p className="text-error text-xs font-bold">{createError}</p>}
                {createSuccess && <p className="text-primary text-xs font-bold">Usuário criado com sucesso!</p>}
                <button 
                  disabled={isCreating}
                  type="submit"
                  className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Criar Novo Usuário
                </button>
              </form>
            </div>
          </section>
        )}

        <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="p-6 border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-black text-primary overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user?.displayName?.charAt(0) || 'U'
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface">{user?.displayName || 'Usuário'}</h3>
                <p className="text-on-surface-variant text-sm">{user?.email}</p>
              </div>
            </div>
            <button className="text-primary font-bold text-sm hover:underline">Editar Perfil</button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Nome Completo</label>
                <input type="text" value={user?.displayName || ''} readOnly className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-on-surface focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Endereço de E-mail</label>
                <input type="email" value={user?.email || ''} readOnly className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-on-surface focus:outline-none" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="p-6 border-b border-outline-variant">
            <h3 className="text-xl font-bold text-on-surface">Preferências</h3>
          </div>
          <div className="divide-y divide-outline-variant">
            <div className="p-6 flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">Notificações</h4>
                  <p className="text-sm text-on-surface-variant">Gerencie como você recebe alertas e relatórios</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-on-surface-variant" />
            </div>
            
            <div className="p-6 flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-tertiary/10 rounded-xl flex items-center justify-center text-tertiary">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">Segurança e Privacidade</h4>
                  <p className="text-sm text-on-surface-variant">Senha, 2FA e permissões de dados</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-on-surface-variant" />
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">Faturamento e Assinatura</h4>
                  <p className="text-sm text-on-surface-variant">Gerencie seu plano e métodos de pagamento</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-on-surface-variant" />
            </div>

            <div className="p-6 flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">Idioma e Região</h4>
                  <p className="text-sm text-on-surface-variant">Português (BR), UTC-3</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-on-surface-variant" />
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="p-6 border-b border-outline-variant">
            <h3 className="text-xl font-bold text-on-surface">Aparência</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-on-surface/5 rounded-xl flex items-center justify-center text-on-surface">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">Modo Escuro</h4>
                  <p className="text-sm text-on-surface-variant">Ajuste o tema do seu painel</p>
                </div>
              </div>
              <div className="w-14 h-8 bg-surface-container border border-outline-variant rounded-full relative cursor-pointer p-1 transition-colors">
                <div className="w-6 h-6 bg-primary rounded-full shadow-sm transform translate-x-0 transition-transform" />
              </div>
            </div>
          </div>
        </section>

        <div className="pt-6 flex justify-end gap-4">
          <button className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors">
            Cancelar
          </button>
          <button className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20">
            <Save className="w-5 h-5" />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
