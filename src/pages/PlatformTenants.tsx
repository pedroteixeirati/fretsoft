import React, { useEffect, useState } from 'react';
import { Building2, Loader2, Plus, ShieldCheck, UserRoundPlus } from 'lucide-react';
import Modal from '../components/Modal';
import { createUserByAdmin } from '../firebase';
import { useFirebase } from '../context/FirebaseContext';
import { platformTenantsApi } from '../lib/api';
import { canAccess } from '../lib/permissions';
import { PlatformTenant } from '../types';

const initialForm = {
  name: '',
  tradeName: '',
  slug: '',
  cnpj: '',
  city: '',
  state: '',
  plan: 'starter',
  status: 'active' as const,
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '',
};

export default function PlatformTenants() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'platformTenants', 'create');
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const loadTenants = async () => {
    setLoading(true);
    try {
      setTenants(await platformTenantsApi.list());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const resetForm = () => {
    setFormData(initialForm);
    setIsModalOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate) return;

    setIsSubmitting(true);
    try {
      const authResult = await createUserByAdmin(formData.ownerEmail, formData.ownerPassword);
      await platformTenantsApi.create({
        name: formData.name,
        tradeName: formData.tradeName,
        slug: formData.slug,
        cnpj: formData.cnpj,
        city: formData.city,
        state: formData.state,
        plan: formData.plan,
        status: formData.status,
        ownerUid: authResult.user.uid,
        ownerEmail: authResult.user.email || formData.ownerEmail,
        ownerName: formData.ownerName,
      });

      await loadTenants();
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Plataforma JP Soft</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-on-surface">Transportadoras</h1>
          <p className="mt-2 max-w-3xl text-on-surface-variant">
            Cadastre e acompanhe as transportadoras clientes da plataforma, com o primeiro usuario owner vinculado desde a criacao.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]"
          >
            <Plus className="h-5 w-5" />
            Nova transportadora
          </button>
        )}
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Transportadoras" value={String(tenants.length)} />
        <StatCard label="Ativas" value={String(tenants.filter((tenant) => tenant.status === 'active').length)} />
        <StatCard label="Owners vinculados" value={String(tenants.filter((tenant) => tenant.ownerLinked).length)} />
        <StatCard label="Planos ativos" value={String(new Set(tenants.map((tenant) => tenant.plan).filter(Boolean)).size)} />
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-medium text-on-surface-variant">Carregando transportadoras...</p>
        </div>
      ) : tenants.length === 0 ? (
        <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-12 text-center">
          <Building2 className="mx-auto mb-4 h-14 w-14 text-primary" />
          <h3 className="text-2xl font-bold text-on-surface">Nenhuma transportadora cadastrada</h3>
          <p className="mx-auto mt-2 max-w-xl text-on-surface-variant">
            Crie o primeiro tenant da plataforma e vincule o usuario owner responsavel pela operacao dessa transportadora.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {tenants.map((tenant) => (
            <article key={tenant.id} className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-7 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-primary">{tenant.tradeName || tenant.name}</p>
                  <h2 className="text-2xl font-bold text-on-surface">{tenant.name}</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">Slug: {tenant.slug}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${tenant.status === 'active' ? 'bg-primary-container text-on-primary-container' : tenant.status === 'suspended' ? 'bg-error/10 text-error' : 'bg-surface-container text-on-surface-variant'}`}>
                  {tenant.status === 'active' ? 'Ativa' : tenant.status === 'inactive' ? 'Inativa' : 'Suspensa'}
                </span>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoTile label="CNPJ" value={tenant.cnpj || 'Nao informado'} />
                <InfoTile label="Localizacao" value={[tenant.city, tenant.state].filter(Boolean).join(' - ') || 'Nao informada'} />
                <InfoTile label="Plano" value={tenant.plan || 'starter'} />
                <InfoTile label="Owner" value={tenant.ownerName || 'Nao vinculado'} />
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <UserRoundPlus className="h-4 w-4 text-primary" />
                  <span>{tenant.ownerEmail || 'Owner nao informado'}</span>
                </div>
                <span className={`font-bold ${tenant.ownerLinked ? 'text-primary' : 'text-error'}`}>
                  {tenant.ownerLinked ? 'Owner vinculado' : 'Sem owner'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={resetForm} title="Nova transportadora">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Razao social" value={formData.name} onChange={(value) => setFormData({ ...formData, name: value })} />
            <Field label="Nome fantasia" value={formData.tradeName} onChange={(value) => setFormData({ ...formData, tradeName: value })} required={false} />
            <Field label="Slug" value={formData.slug} onChange={(value) => setFormData({ ...formData, slug: value })} required={false} />
            <Field label="CNPJ" value={formData.cnpj} onChange={(value) => setFormData({ ...formData, cnpj: value })} required={false} />
            <Field label="Cidade" value={formData.city} onChange={(value) => setFormData({ ...formData, city: value })} required={false} />
            <Field label="UF" value={formData.state} onChange={(value) => setFormData({ ...formData, state: value.toUpperCase() })} required={false} />
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Plano</label>
              <select
                className="w-full rounded-xl border border-outline-variant bg-surface-container px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary/20"
                value={formData.plan}
                onChange={(event) => setFormData({ ...formData, plan: event.target.value })}
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Status</label>
              <select
                className="w-full rounded-xl border border-outline-variant bg-surface-container px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary/20"
                value={formData.status}
                onChange={(event) => setFormData({ ...formData, status: event.target.value as typeof formData.status })}
              >
                <option value="active">Ativa</option>
                <option value="inactive">Inativa</option>
                <option value="suspended">Suspensa</option>
              </select>
            </div>
          </div>

          <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-bold text-on-surface">Primeiro usuario owner</h3>
                <p className="text-sm text-on-surface-variant">Esse usuario sera criado no Firebase e vinculado como owner da nova transportadora.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Nome do owner" value={formData.ownerName} onChange={(value) => setFormData({ ...formData, ownerName: value })} />
              <Field label="E-mail do owner" type="email" value={formData.ownerEmail} onChange={(value) => setFormData({ ...formData, ownerEmail: value })} />
              <div className="md:col-span-2">
                <Field label="Senha inicial" type="password" value={formData.ownerPassword} onChange={(value) => setFormData({ ...formData, ownerPassword: value })} />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={resetForm} className="rounded-full px-8 py-3 font-bold text-on-surface-variant transition-colors hover:bg-surface-container">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              Cadastrar transportadora
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
      <p className="mb-2 text-sm font-medium text-on-surface-variant">{label}</p>
      <p className="text-3xl font-black text-on-surface">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="text-base font-black text-on-surface">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</label>
      <input
        required={required}
        type={type}
        className="w-full rounded-xl border border-outline-variant bg-surface-container px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
