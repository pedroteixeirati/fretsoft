import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Filter, Loader2, Plus, Search, ShieldCheck, UserRoundPlus } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import KpiCard from '../components/KpiCard';
import Modal from '../components/Modal';
import { useFirebase } from '../context/FirebaseContext';
import { FormFieldErrors, resolveFieldError } from '../lib/errors';
import { platformTenantsApi } from '../lib/api';
import { canAccess } from '../lib/permissions';
import { FieldLabel, FormAlert, hasRequiredFieldsFilled, useFormErrorFocus } from '../shared/forms';
import Input from '../shared/ui/Input';
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

type TenantFormField =
  | 'name'
  | 'tradeName'
  | 'slug'
  | 'cnpj'
  | 'phone'
  | 'legalRepresentative'
  | 'city'
  | 'state'
  | 'plan'
  | 'status'
  | 'ownerName'
  | 'ownerEmail'
  | 'ownerPassword'
  | 'ownerPasswordConfirm';

function getTenantFormErrors(formData: typeof initialForm): FormFieldErrors<TenantFormField> {
  const normalizedCnpj = formData.cnpj.replace(/\D/g, '');
  const normalizedPhone = formData.phone.replace(/\D/g, '');
  const normalizedState = formData.state.trim().toUpperCase();
  const errors: FormFieldErrors<TenantFormField> = {};

  if (formData.name.trim().length < 3) {
    errors.name = 'A razao social deve ter pelo menos 3 caracteres.';
  }

  if (formData.slug.trim() && !/^[a-z0-9-]+$/.test(formData.slug.trim())) {
    errors.slug = 'Use apenas letras minusculas, numeros e hifens no slug.';
  }

  if (normalizedCnpj && !isValidCnpj(normalizedCnpj)) {
    errors.cnpj = 'Informe um CNPJ valido.';
  }

  if (normalizedPhone && normalizedPhone.length < 10) {
    errors.phone = 'Informe um telefone valido com DDD.';
  }

  if (normalizedState && !/^[A-Z]{2}$/.test(normalizedState)) {
    errors.state = 'A UF deve conter 2 letras.';
  }

  if (formData.ownerName.trim().length < 3) {
    errors.ownerName = 'Informe o nome completo do owner.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail.trim())) {
    errors.ownerEmail = 'Informe um e-mail valido para o owner.';
  }

  if (formData.ownerPassword.length < 6) {
    errors.ownerPassword = 'A senha inicial deve ter pelo menos 6 caracteres.';
  }

  if (formData.ownerPassword !== formData.ownerPasswordConfirm) {
    errors.ownerPasswordConfirm = 'A confirmacao de senha nao confere.';
  }

  return errors;
}

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
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<TenantFormField>>({});

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
    setFieldErrors({});
  };
  const fieldValidationErrors = useMemo(() => getTenantFormErrors(formData), [formData]);
  const formValidationMessage =
    Object.values(fieldValidationErrors).find(Boolean) ||
    '';
  const formIsValid = Object.keys(fieldValidationErrors).length === 0;
  const canSubmit = hasRequiredFieldsFilled(formData, [
    'name',
    'ownerName',
    'ownerEmail',
    'ownerPassword',
    'ownerPasswordConfirm',
  ]);
  const hasFieldErrors = Object.values(fieldErrors).some(Boolean);
  const formMessage =
    submitError || (hasFieldErrors ? 'Revise os campos destacados antes de salvar.' : '');
  const { formRef, alertRef } = useFormErrorFocus({
    enabled: isModalOpen,
    fieldErrors,
    message: formMessage,
  });

  useEffect(() => {
    if (slugEdited) return;
    const suggestedSlug = slugify(formData.tradeName || formData.name);
    setFormData((current) => current.slug === suggestedSlug ? current : { ...current, slug: suggestedSlug });
  }, [formData.name, formData.tradeName, slugEdited]);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setFieldErrors((current) => {
      if (!current[field as TenantFormField]) return current;
      return {
        ...current,
        [field]: undefined,
      };
    });
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate) return;
    setSubmitError('');
    setSubmitSuccess('');

    if (!formIsValid) {
      setFieldErrors(fieldValidationErrors);
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
      setFieldErrors({});
      setSubmitSuccess('Transportadora cadastrada com sucesso.');
    } catch (error) {
      const resolvedFieldError = resolveFieldError<TenantFormField>(error, {
        fieldMap: {
          name: 'name',
          slug: 'slug',
          cnpj: 'cnpj',
          ownerEmail: 'ownerEmail',
          ownerPassword: 'ownerPassword',
        },
      });

      if (resolvedFieldError?.field) {
        setFieldErrors((current) => ({
          ...current,
          [resolvedFieldError.field!]: resolvedFieldError.message,
        }));
      }

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
        <KpiCard label="Transportadoras" value={String(tenants.length)} />
        <KpiCard label="Ativas" value={String(tenants.filter((tenant) => tenant.status === 'active').length)} />
        <KpiCard label="Owners vinculados" value={String(tenants.filter((tenant) => tenant.ownerLinked).length)} />
        <KpiCard label="Planos ativos" value={String(new Set(tenants.map((tenant) => tenant.plan).filter(Boolean)).size)} />
      </section>

      {submitSuccess && <p className="text-sm font-bold text-primary">{submitSuccess}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-surface-container-lowest rounded-xl p-2 flex items-center shadow-sm focus-within:shadow-md transition-shadow">
            <Search className="w-5 h-5 text-outline ml-3" />
            <input type="text" placeholder="Buscar por transportadora ou owner..." className="w-full border-none focus:ring-0 bg-transparent text-on-surface text-sm py-2 px-4 placeholder:text-outline/60" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="h-6 w-px bg-outline/20 mx-2" />
            <div className="flex items-center gap-2 px-2">
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                variant="inline"
                options={[
                  { value: 'all', label: 'Todos os Status' },
                  { value: 'active', label: 'Ativa' },
                  { value: 'inactive', label: 'Inativa' },
                  { value: 'suspended', label: 'Suspensa' },
                ]}
              />
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
        <form ref={formRef} noValidate onSubmit={handleSubmit} className="space-y-6">
          <div ref={alertRef}>
            <FormAlert message={formMessage} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Razao social"
              value={formData.name}
              onChange={(value) => updateField('name', value)}
              error={fieldErrors.name}
            />
            <Field
              label="Nome fantasia"
              value={formData.tradeName}
              onChange={(value) => updateField('tradeName', value)}
              required={false}
              error={fieldErrors.tradeName}
            />
            <Field
              label="Slug"
              value={formData.slug}
              onChange={(value) => {
                setSlugEdited(true);
                updateField('slug', slugify(value));
              }}
              required={false}
              helperText="Usado no identificador interno da transportadora."
              error={fieldErrors.slug}
            />
            <Field
              label="CNPJ"
              value={formData.cnpj}
              onChange={(value) => updateField('cnpj', formatCnpj(value))}
              required={false}
              placeholder="00.000.000/0000-00"
              error={fieldErrors.cnpj}
            />
            <Field
              label="Telefone principal"
              value={formData.phone}
              onChange={(value) => updateField('phone', formatPhone(value))}
              required={false}
              placeholder="(11) 99999-9999"
              error={fieldErrors.phone}
            />
            <Field
              label="Responsavel legal"
              value={formData.legalRepresentative}
              onChange={(value) => updateField('legalRepresentative', value)}
              required={false}
              error={fieldErrors.legalRepresentative}
            />
            <Field
              label="Cidade"
              value={formData.city}
              onChange={(value) => updateField('city', value)}
              required={false}
              error={fieldErrors.city}
            />
            <Field
              label="UF"
              value={formData.state}
              onChange={(value) => updateField('state', value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase())}
              required={false}
              placeholder="SP"
              maxLength={2}
              error={fieldErrors.state}
            />
            <div className="space-y-2">
              <FieldLabel>Plano</FieldLabel>
              <CustomSelect
                value={formData.plan}
                onChange={(value) => updateField('plan', value)}
                error={fieldErrors.plan}
                options={[
                  { value: 'starter', label: 'Starter' },
                  { value: 'growth', label: 'Growth' },
                  { value: 'enterprise', label: 'Enterprise' },
                ]}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel>Status</FieldLabel>
              <CustomSelect
                value={formData.status}
                onChange={(value) => updateField('status', value)}
                error={fieldErrors.status}
                options={[
                  { value: 'active', label: 'Ativa' },
                  { value: 'inactive', label: 'Inativa' },
                  { value: 'suspended', label: 'Suspensa' },
                ]}
              />
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
              <Field
                label="Nome do owner"
                value={formData.ownerName}
                onChange={(value) => updateField('ownerName', value)}
                error={fieldErrors.ownerName}
              />
              <Field
                label="E-mail do owner"
                type="email"
                value={formData.ownerEmail}
                onChange={(value) => updateField('ownerEmail', value)}
                error={fieldErrors.ownerEmail}
              />
              <div>
                <Field
                  label="Senha inicial"
                  type="password"
                  value={formData.ownerPassword}
                  onChange={(value) => updateField('ownerPassword', value)}
                  error={fieldErrors.ownerPassword}
                />
              </div>
              <div>
                <Field
                  label="Confirmar senha"
                  type="password"
                  value={formData.ownerPasswordConfirm}
                  onChange={(value) => updateField('ownerPasswordConfirm', value)}
                  error={fieldErrors.ownerPasswordConfirm}
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={resetForm} className="rounded-full px-8 py-3 font-bold text-on-surface-variant transition-colors hover:bg-surface-container">Cancelar</button>
            <button type="submit" disabled={isSubmitting || !canSubmit} className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] disabled:opacity-50">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              Cadastrar transportadora
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
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
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  maxLength?: number;
  error?: string;
}) {
  return (
    <Input
      label={label}
      required={required}
      type={type}
      placeholder={placeholder}
      maxLength={maxLength}
      value={value}
      error={error}
      hint={helperText}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-xl bg-surface-container"
    />
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
