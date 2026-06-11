import React, { useEffect, useState } from 'react';
import { Bell, ChevronRight, Globe, Info, Loader2, Moon, Shield, ToggleRight, UserPlus, Wallet } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import { useFirebase } from '../context/FirebaseContext';
import { canAccess } from '../lib/permissions';
import { getErrorMessage } from '../lib/errors';
import { tenantFeaturesApi, TenantFeature } from '../features/tenant-features/services/tenant-features.api';
import { logout } from '../firebase';

export default function Settings() {
  const { user, userProfile, signUp, refreshProfile } = useFirebase();
  const canManageUsers = canAccess(userProfile, 'users', 'create');
  const isDev = userProfile?.role === 'dev';
  const canCreateAdmin = userProfile?.role === 'dev';
  const isNovalogTenant = userProfile?.tenantSlug === 'novalog';
  const roleOptions = [
    ...(canCreateAdmin ? [{ value: 'admin', label: 'Administrador' }] : []),
    { value: 'financial', label: 'Financeiro' },
    { value: 'operational', label: 'Operacional' },
    ...(!isNovalogTenant ? [{ value: 'driver', label: 'Motorista' }] : []),
    { value: 'viewer', label: 'Visualizador' },
  ];
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'financial' | 'operational' | 'driver' | 'viewer'>('operational');
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
      setNewUserRole('operational');
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
          <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm">
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
                      options={roleOptions}
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

        {isDev && <FeatureFlagsSection onChanged={refreshProfile} />}

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

function FeatureFlagsSection({ onChanged }: { onChanged: () => void }) {
  const [features, setFeatures] = useState<TenantFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingKey, setSavingKey] = useState('');

  useEffect(() => {
    let active = true;
    tenantFeaturesApi
      .list()
      .then((data) => { if (active) setFeatures(data ?? []); })
      .catch((err) => { if (active) setError(getErrorMessage(err, 'Nao foi possivel carregar as feature flags.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const toggle = async (feature: TenantFeature) => {
    setSavingKey(feature.key);
    setError('');
    try {
      const updated = await tenantFeaturesApi.setFeature(feature.key, !feature.enabled);
      setFeatures(updated ?? []);
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err, 'Nao foi possivel atualizar a feature flag.'));
    } finally {
      setSavingKey('');
    }
  };

  return (
    <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-sm">
      <div className="p-6 border-b border-outline-variant">
        <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
          <ToggleRight className="w-6 h-6 text-primary" />
          Funcionalidades (feature flags)
        </h3>
        <p className="text-sm text-on-surface-variant mt-1">Ative ou desative modulos para esta transportadora. Visivel apenas para o perfil dev.</p>
      </div>
      <div className="p-6 space-y-3">
        {error && <p className="text-error text-xs font-bold">{error}</p>}
        {loading ? (
          <p className="text-sm text-on-surface-variant">Carregando...</p>
        ) : (
          features.map((feature) => (
            <div key={feature.key} className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant bg-surface-container px-4 py-3">
              <div>
                <p className="font-bold text-on-surface text-sm">{feature.label}</p>
                <p className="text-xs text-on-surface-variant font-mono">{feature.key}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={feature.enabled}
                aria-label={`Alternar ${feature.label}`}
                disabled={savingKey === feature.key}
                onClick={() => toggle(feature)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${feature.enabled ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-surface-container-lowest transition-all ${feature.enabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))
        )}
        <p className="text-xs text-on-surface-variant">
          A flag mestre <span className="font-mono">fiscal</span> precisa estar ligada para o modulo aparecer; <span className="font-mono">fiscal.third_party</span> libera TAC/CIOT.
        </p>
      </div>
    </section>
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
