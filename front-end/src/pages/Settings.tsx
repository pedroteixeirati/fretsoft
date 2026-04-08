import React, { useState } from 'react';
import { Bell, ChevronRight, Globe, Info, Loader2, Moon, Shield, UserPlus, Wallet } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import { useFirebase } from '../context/FirebaseContext';
import { canAccess } from '../lib/permissions';
import { logout } from '../firebase';

export default function Settings() {
  const { user, userProfile, signUp } = useFirebase();
  const canManageUsers = canAccess(userProfile, 'users', 'create');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'financial' | 'operational' | 'driver' | 'viewer'>('driver');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess(false);
    setIsCreating(true);
    try {
      await signUp(newUserEmail, newUserPassword, newUserRole, newUserName);
      setCreateSuccess(true);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('driver');
    } catch (error: any) {
      let message = error.message || 'Erro ao criar usuario.';
      if (error.code === 'auth/email-already-in-use' || message.includes('email-already-in-use')) {
        message = 'Este usuario ou e-mail ja esta em uso.';
      } else if (error.code === 'auth/weak-password') {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'E-mail invalido.';
      }
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Configuracoes</h1>
        <p className="text-on-surface-variant mt-1">Gerencie conta, preferencias e acesso do tenant.</p>
      </header>

      <div className="space-y-6">
        {canManageUsers && (
          <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-sm">
            <div className="p-6 border-b border-outline-variant">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-primary" />
                Gerenciamento de Usuarios
              </h3>
              <p className="text-sm text-on-surface-variant mt-1">Crie usuarios vinculados apenas ao tenant atual.</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Field label="Nome do usuario">
                    <input
                      type="text"
                      placeholder="Ex: Joao Silva"
                      className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                    />
                  </Field>
                  <Field label="E-mail">
                    <input
                      required
                      type="email"
                      placeholder="Ex: joao@email.com"
                      className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </Field>
                  <Field label="Senha">
                    <input
                      required
                      type="password"
                      placeholder="Minimo 6 caracteres"
                      className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                    />
                  </Field>
                  <Field label="Nivel de Acesso">
                    <CustomSelect
                      value={newUserRole}
                      onChange={(value) => setNewUserRole(value as typeof newUserRole)}
                      options={[
                        { value: 'admin', label: 'Administrador' },
                        { value: 'financial', label: 'Financeiro' },
                        { value: 'operational', label: 'Operacional' },
                        { value: 'driver', label: 'Motorista' },
                        { value: 'viewer', label: 'Visualizador' },
                      ]}
                    />
                  </Field>
                </div>
                {createError && <p className="text-error text-xs font-bold">{createError}</p>}
                {createSuccess && <p className="text-primary text-xs font-bold">Usuario criado com sucesso.</p>}
                <button
                  disabled={isCreating}
                  type="submit"
                  className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Criar Novo Usuario
                </button>
              </form>
            </div>
          </section>
        )}

        <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="p-6 border-b border-outline-variant flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-on-surface">{userProfile?.tenantName || 'Tenant Atual'}</h3>
              <p className="text-on-surface-variant text-sm">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-primary font-bold text-sm hover:underline">
              Sair
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Usuario">
              <input type="text" value={userProfile?.name || user?.displayName || ''} readOnly className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-on-surface focus:outline-none" />
            </Field>
            <Field label="Perfil">
              <input type="text" value={userProfile?.role || ''} readOnly className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-on-surface focus:outline-none" />
            </Field>
            <Field label="Tenant">
              <input type="text" value={userProfile?.tenantName || ''} readOnly className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-on-surface focus:outline-none" />
            </Field>
            <Field label="Slug do Tenant">
              <input type="text" value={userProfile?.tenantSlug || ''} readOnly className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-on-surface focus:outline-none" />
            </Field>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="p-6 border-b border-outline-variant">
            <h3 className="text-xl font-bold text-on-surface">Preferencias</h3>
          </div>
          <div className="divide-y divide-outline-variant">
            <Preference icon={Bell} title="Notificacoes" description="Gerencie alertas e resumos da operacao." />
            <Preference icon={Shield} title="Seguranca e Privacidade" description="Controle de acesso e permissões do tenant." />
            <Preference icon={Wallet} title="Faturamento e Assinatura" description="Informacoes comerciais do tenant." />
            <Preference icon={Globe} title="Idioma e Regiao" description="Configurado para Portugues (BR)." />
            <Preference icon={Moon} title="Aparencia" description="Ajuste visual do painel." />
          </div>
        </section>

        <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest px-6 py-5 text-sm text-on-surface-variant flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5" />
          <p>
            As preferencias desta area sao informativas nesta etapa. As acoes disponiveis hoje sao o gerenciamento de usuarios do tenant e a saida segura da sessao.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  );
}

function Preference({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 flex items-center justify-between hover:bg-surface-container transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-on-surface">{title}</h4>
          <p className="text-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-on-surface-variant" />
    </div>
  );
}
