import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Filter, Loader2, Plus, Search, ShieldCheck, UserRoundPlus } from 'lucide-react';
import Modal from '../components/Modal';
import { useFirebase } from '../context/FirebaseContext';
import { platformTenantsApi } from '../lib/api';
import { canAccess } from '../lib/permissions';
import { PlatformTenant } from '../types';

const initialForm = {
  name: '',
  tradeName: '',
  slug: '',
  cnpj: '',
  phone: '',
  legalRepresentative: '',
  city: '',
  state: '',
  plan: 'starter',
  status: 'active' as const,
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '',
  ownerPasswordConfirm: '',
};

export default function PlatformTenants() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'platformTenants', 'create');
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState(initialForm);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);

  const loadTenants = async () => {
    setLoading(true);
    try {
      setTenants(await platformTenantsApi.list());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTenants();
  }, []);

  const filteredTenants = useMemo(
    () =>
      tenants.filter((tenant) =>
        (tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === 'all' || tenant.status === statusFilter)
      ),
    [tenants, searchTerm, statusFilter]
  );

  const resetForm = () => {
    setFormData(initialForm);
    setIsModalOpen(false);
    setSubmitError('');
    setSubmitSuccess('');
    setSlugEdited(false);
  };

  const normalizedCnpj = formData.cnpj.replace(/\D/g, '');
  const normalizedPhone = formData.phone.replace(/\D/g, '');
  const normalizedState = formData.state.trim().toUpperCase();
  const formValidationMessage =
    formData.name.trim().length < 3 ? 'A razao social deve ter pelo menos 3 caracteres.' :
    formData.ownerName.trim().length < 3 ? 'Informe o nome completo do owner.' :
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail.trim()) ? 'Informe um e-mail valido para o owner.' :
    formData.ownerPassword.length > 0 && formData.ownerPassword.length < 6 ? 'A senha inicial deve ter pelo menos 6 caracteres.' :
    formData.ownerPassword !== formData.ownerPasswordConfirm ? 'A confirmacao de senha nao confere.' :
    normalizedPhone && normalizedPhone.length < 10 ? 'Informe um telefone valido com DDD.' :
    normalizedCnpj && !isValidCnpj(normalizedCnpj) ? 'Informe um CNPJ valido.' :
    normalizedState && !/^[A-Z]{2}$/.test(normalizedState) ? 'A UF deve conter 2 letras.' :
    '';
  const formIsValid =
    formData.name.trim().length >= 3 &&
    formData.ownerName.trim().length >= 3 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail.trim()) &&
    formData.ownerPassword.length >= 6 &&
    formData.ownerPassword === formData.ownerPasswordConfirm &&
    (!normalizedPhone || normalizedPhone.length >= 10) &&
    (!normalizedCnpj || isValidCnpj(normalizedCnpj)) &&
    (!normalizedState || /^[A-Z]{2}$/.test(normalizedState));

  useEffect(() => {
    if (slugEdited) return;
    const suggestedSlug = slugify(formData.tradeName || formData.name);
    setFormData((current) => current.slug === suggestedSlug ? current : { ...current, slug: suggestedSlug });
  }, [formData.name, formData.tradeName, slugEdited]);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate) return;
    setSubmitError('');
    setSubmitSuccess('');

    if (!formIsValid) {
      setSubmitError(formValidationMessage || 'Revise os campos obrigatorios antes de salvar.');
      return;
    }

    setIsSubmitting(true);
    try {
      await platformTenantsApi.create({
        name: formData.name,
        tradeName: formData.tradeName,
        slug: formData.slug,
        cnpj: formData.cnpj,
        phone: formData.phone,
        legalRepresentative: formData.legalRepresentative,
        city: formData.city,
        state: formData.state,
        plan: formData.plan,
        status: formData.status,
        ownerEmail: formData.ownerEmail,
        ownerName: formData.ownerName,
        ownerPassword: formData.ownerPassword,
      });

      await loadTenants();
      setFormData(initialForm);
      setSlugEdited(false);
      setIsModalOpen(false);
      setSubmitSuccess('Transportadora cadastrada com sucesso.');
    } catch (error: any) {
      setSubmitError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Transportadoras</h1>
          <p className="text-on-secondary-container mt-2">Cadastre e acompanhe as transportadoras clientes da plataforma.</p>
        </div>
        {canCreate && (
          <button onClick={() => setIsModalOpen(true)} className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" />
            NOVA TRANSPORTADORA
          </button>
        )}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Transportadoras" value={String(tenants.length)} />
        <StatCard label="Ativas" value={String(tenants.filter((tenant) => tenant.status === 'active').length)} />
        <StatCard label="Owners vinculados" value={String(tenants.filter((tenant) => tenant.ownerLinked).length)} />
        <StatCard label="Planos ativos" value={String(new Set(tenants.map((tenant) => tenant.plan).filter(Boolean)).size)} />
      </section>

      {submitSuccess && <p className="text-sm font-bold text-primary">{submitSuccess}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-surface-container-lowest rounded-xl p-2 flex items-center shadow-sm focus-within:shadow-md transition-shadow">
            <Search className="w-5 h-5 text-outline ml-3" />
            <input type="text" placeholder="Buscar por transportadora ou owner..." className="w-full border-none focus:ring-0 bg-transparent text-on-surface text-sm py-2 px-4 placeholder:text-outline/60" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="h-6 w-px bg-outline/20 mx-2" />
            <div className="flex items-center gap-2 px-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent text-primary text-sm font-semibold appearance-none cursor-pointer focus:outline-none">
                <option value="all">Todos os Status</option>
                <option value="active">Ativa</option>
                <option value="inactive">Inativa</option>
                <option value="suspended">Suspensa</option>
              </select>
              <Filter className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 bg-surface-container-low rounded-xl p-1">
          <div className="bg-surface-container-lowest rounded-lg p-6 h-full min-h-[420px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-lg text-on-surface">Lista de Transportadoras</h3>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-on-surface-variant font-medium">Carregando transportadoras...</p>
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center text-outline/40 mb-4">
                  <Building2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-on-surface">Nenhuma transportadora encontrada</h4>
                <p className="text-on-surface-variant max-w-xs mt-2">Cadastre uma nova transportadora ou ajuste os filtros para visualizar os registros.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTenants.map((tenant) => (
                  <div key={tenant.id} className="group flex items-center p-3 rounded-xl hover:bg-primary-fixed-dim/10 transition-all">
                    <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center text-primary">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold font-headline text-on-surface">{tenant.name}</span>
                        <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                          {tenant.status === 'active' ? 'Ativa' : tenant.status === 'inactive' ? 'Inativa' : 'Suspensa'}
                        </span>
                      </div>
                      <p className="text-xs text-on-secondary-container flex items-center gap-1 mt-1"><ShieldCheck className="w-3.5 h-3.5" />slug {tenant.slug}</p>
                      <p className="text-[11px] text-on-surface-variant mt-1 flex flex-wrap gap-3">
                        <span>{tenant.tradeName || tenant.name}</span>
                        <span>{tenant.city && tenant.state ? `${tenant.city} - ${tenant.state}` : 'Localizacao nao informada'}</span>
                        <span>{tenant.phone || 'Telefone nao informado'}</span>
                        <span>Plano {tenant.plan}</span>
                      </p>
                      <p className="text-[10px] text-on-surface-variant mt-1">
                        Criada por {tenant.createdByName || 'JP Soft'}{tenant.updatedByName ? ` • ultima atualizacao por ${tenant.updatedByName}` : ''}
                      </p>
                    </div>
                    <div className="hidden sm:block text-right mr-6">
                      <span className="text-sm font-bold text-on-surface inline-flex items-center gap-1"><UserRoundPlus className="w-4 h-4 text-primary" />{tenant.ownerName || 'Sem owner'}</span>
                      <p className="text-[10px] text-on-secondary-container uppercase">{tenant.ownerEmail || 'owner nao informado'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={resetForm} title="Nova transportadora">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Razao social" value={formData.name} onChange={(value) => updateField('name', value)} />
            <Field label="Nome fantasia" value={formData.tradeName} onChange={(value) => updateField('tradeName', value)} required={false} />
            <Field
              label="Slug"
              value={formData.slug}
              onChange={(value) => {
                setSlugEdited(true);
                updateField('slug', slugify(value));
              }}
              required={false}
              helperText="Usado no identificador interno da transportadora."
            />
            <Field
              label="CNPJ"
              value={formData.cnpj}
              onChange={(value) => updateField('cnpj', formatCnpj(value))}
              required={false}
              placeholder="00.000.000/0000-00"
            />
            <Field
              label="Telefone principal"
              value={formData.phone}
              onChange={(value) => updateField('phone', formatPhone(value))}
              required={false}
              placeholder="(11) 99999-9999"
            />
            <Field label="Responsavel legal" value={formData.legalRepresentative} onChange={(value) => updateField('legalRepresentative', value)} required={false} />
            <Field label="Cidade" value={formData.city} onChange={(value) => updateField('city', value)} required={false} />
            <Field
              label="UF"
              value={formData.state}
              onChange={(value) => updateField('state', value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase())}
              required={false}
              placeholder="SP"
              maxLength={2}
            />
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Plano</label>
              <select className="w-full rounded-xl border border-outline-variant bg-surface-container px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary/20" value={formData.plan} onChange={(event) => setFormData({ ...formData, plan: event.target.value })}>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Status</label>
              <select className="w-full rounded-xl border border-outline-variant bg-surface-container px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary/20" value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value as typeof formData.status })}>
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
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const generatedPassword = generateTemporaryPassword();
                  updateField('ownerPassword', generatedPassword);
                  updateField('ownerPasswordConfirm', generatedPassword);
                }}
                className="rounded-full border border-outline-variant px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                Gerar senha temporaria
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Nome do owner" value={formData.ownerName} onChange={(value) => updateField('ownerName', value)} />
              <Field label="E-mail do owner" type="email" value={formData.ownerEmail} onChange={(value) => updateField('ownerEmail', value)} />
              <div>
                <Field label="Senha inicial" type="password" value={formData.ownerPassword} onChange={(value) => updateField('ownerPassword', value)} />
              </div>
              <div>
                <Field label="Confirmar senha" type="password" value={formData.ownerPasswordConfirm} onChange={(value) => updateField('ownerPasswordConfirm', value)} />
              </div>
            </div>
          </section>

          {submitError && <p className="text-sm font-bold text-error">{submitError}</p>}
          {!submitError && formValidationMessage && <p className="text-sm font-bold text-on-surface-variant">{formValidationMessage}</p>}

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={resetForm} className="rounded-full px-8 py-3 font-bold text-on-surface-variant transition-colors hover:bg-surface-container">Cancelar</button>
            <button type="submit" disabled={isSubmitting || !formIsValid} className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] disabled:opacity-50">
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
  return <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"><p className="mb-2 text-sm font-medium text-on-surface-variant">{label}</p><p className="text-3xl font-black text-on-surface">{value}</p></div>;
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = true,
  placeholder,
  helperText,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  maxLength?: number;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</label>
      <input
        required={required}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-xl border border-outline-variant bg-surface-container px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {helperText && <p className="text-[11px] text-on-surface-variant">{helperText}</p>}
    </div>
  );
}

function isValidCnpj(cnpj: string) {
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calc = (base: string, factors: number[]) => {
    const total = base.split('').reduce((sum, digit, index) => sum + Number(digit) * factors[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = calc(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calc(cnpj.slice(0, 12) + String(first), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj === `${cnpj.slice(0, 12)}${first}${second}`;
}

function extractErrorMessage(error: unknown) {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as { error?: string };
      if (parsed?.error) return parsed.error;
    } catch {
      return error.message;
    }
    return error.message;
  }
  return 'Nao foi possivel cadastrar a transportadora.';
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function generateTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 12 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}
