import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, ImagePlus, Loader2, MapPin, Save, ShieldCheck, Trash2 } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import { useFirebase } from '../context/FirebaseContext';
import { tenantProfileApi } from '../lib/api';
import { canAccess } from '../lib/permissions';
import { TenantProfile } from '../types';

const emptyProfile: TenantProfile = {
  id: '',
  name: '',
  tradeName: '',
  slug: '',
  cnpj: '',
  stateRegistration: '',
  municipalRegistration: '',
  taxRegime: '',
  mainCnae: '',
  secondaryCnaes: '',
  openedAt: '',
  legalRepresentative: '',
  phone: '',
  whatsapp: '',
  email: '',
  financialEmail: '',
  fiscalEmail: '',
  website: '',
  logoUrl: '',
  zipCode: '',
  ibgeCode: '',
  addressLine: '',
  addressNumber: '',
  addressComplement: '',
  district: '',
  city: '',
  state: '',
  plan: 'starter',
  status: 'active',
};

export default function TenantProfilePage() {
  const { userProfile, refreshProfile } = useFirebase();
  const canUpdate = canAccess(userProfile, 'tenantProfile', 'update');
  const canManageBilling = userProfile?.role === 'dev';
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<TenantProfile>(emptyProfile);
  const [draft, setDraft] = useState<TenantProfile>(emptyProfile);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const isDirty = useMemo(() => JSON.stringify(profile) !== JSON.stringify(draft), [profile, draft]);
  const validationMessage = useMemo(() => {
    const normalizedCnpj = draft.cnpj.replace(/\D/g, '');
    const normalizedPhone = draft.phone.replace(/\D/g, '');
    const normalizedWhatsapp = draft.whatsapp.replace(/\D/g, '');

    if (draft.name.trim().length < 3) return 'A razao social deve ter pelo menos 3 caracteres.';
    if (normalizedCnpj && !isValidCnpj(normalizedCnpj)) return 'Informe um CNPJ valido.';
    if (draft.email && !isValidEmail(draft.email)) return 'Informe um e-mail principal valido.';
    if (draft.financialEmail && !isValidEmail(draft.financialEmail)) return 'Informe um e-mail financeiro valido.';
    if (draft.fiscalEmail && !isValidEmail(draft.fiscalEmail)) return 'Informe um e-mail fiscal valido.';
    if (normalizedPhone && normalizedPhone.length < 10) return 'Informe um telefone principal valido.';
    if (normalizedWhatsapp && normalizedWhatsapp.length < 10) return 'Informe um WhatsApp valido.';
    if (draft.state && !/^[A-Z]{2}$/.test(draft.state.trim().toUpperCase())) return 'A UF deve conter 2 letras.';
    return '';
  }, [draft]);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await tenantProfileApi.get();
        setProfile(data);
        setDraft(data);
        setSubmitError('');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (field: keyof TenantProfile, value: string) => {
    setSubmitError('');
    setSubmitSuccess('');
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canUpdate) return;
    if (validationMessage) {
      setSubmitError(validationMessage);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const updated = await tenantProfileApi.update({
        name: draft.name,
        tradeName: draft.tradeName,
        slug: draft.slug,
        cnpj: draft.cnpj,
        stateRegistration: draft.stateRegistration,
        municipalRegistration: draft.municipalRegistration,
        taxRegime: draft.taxRegime,
        mainCnae: draft.mainCnae,
        secondaryCnaes: draft.secondaryCnaes,
        openedAt: draft.openedAt,
        legalRepresentative: draft.legalRepresentative,
        phone: draft.phone,
        whatsapp: draft.whatsapp,
        email: draft.email,
        financialEmail: draft.financialEmail,
        fiscalEmail: draft.fiscalEmail,
        website: draft.website,
        logoUrl: draft.logoUrl,
        zipCode: draft.zipCode,
        ibgeCode: draft.ibgeCode,
        addressLine: draft.addressLine,
        addressNumber: draft.addressNumber,
        addressComplement: draft.addressComplement,
        district: draft.district,
        city: draft.city,
        state: draft.state,
        plan: draft.plan,
        status: draft.status,
      });
      setProfile(updated);
      setDraft(updated);
      await refreshProfile();
      setSubmitSuccess('Perfil da transportadora atualizado com sucesso.');
    } catch (error: any) {
      setSubmitError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setDraft(profile);
    setSubmitError('');
    setSubmitSuccess('');
  };

  const handleLogoUpload = async (file?: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError('Selecione um arquivo de imagem valido para a logo.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('A logo deve ter no maximo 5 MB.');
      return;
    }

    try {
      const dataUrl = await buildOptimizedLogoDataUrl(file);
      handleChange('logoUrl', dataUrl);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Nao foi possivel carregar a imagem da logo.');
    }
  };

  const handleRemoveLogo = () => {
    handleChange('logoUrl', '');
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="font-medium">Carregando perfil da transportadora...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Tenant profile</p>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Perfil da Transportadora</h1>
            <p className="mt-2 max-w-3xl text-on-surface-variant">
              Gerencie os dados institucionais, fiscais e de localizacao da transportadora cliente que opera neste ambiente.
            </p>
            {submitSuccess && <p className="mt-3 text-sm font-bold text-primary">{submitSuccess}</p>}
            {!submitSuccess && submitError && <p className="mt-3 text-sm font-bold text-error">{submitError}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || isSubmitting}
            className="rounded-full px-6 py-3 font-bold text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            Descartar
          </button>
          <button
            type="submit"
            form="tenant-profile-form"
            disabled={!canUpdate || !isDirty || isSubmitting}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Salvar alteracoes
          </button>
        </div>
      </header>

      <form id="tenant-profile-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
            <SectionTitle icon={Building2} title="Dados da Empresa" description="Base legal e tributaria da transportadora." />
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Razao social" value={draft.name} onChange={(value) => handleChange('name', value)} disabled={!canUpdate} />
              <Field label="Nome fantasia" value={draft.tradeName} onChange={(value) => handleChange('tradeName', value)} disabled={!canUpdate} />
              <Field label="CNPJ" value={draft.cnpj} onChange={(value) => handleChange('cnpj', formatCnpj(value))} disabled={!canUpdate} placeholder="00.000.000/0000-00" />
              <Field label="Inscricao estadual" value={draft.stateRegistration} onChange={(value) => handleChange('stateRegistration', value)} disabled={!canUpdate} />
              <Field label="Inscricao municipal" value={draft.municipalRegistration} onChange={(value) => handleChange('municipalRegistration', value)} disabled={!canUpdate} />
              <Field label="Regime tributario" value={draft.taxRegime} onChange={(value) => handleChange('taxRegime', value)} disabled={!canUpdate} />
              <Field label="CNAE principal" value={draft.mainCnae} onChange={(value) => handleChange('mainCnae', value)} disabled={!canUpdate} />
              <Field label="Data de abertura" type="date" value={draft.openedAt} onChange={(value) => handleChange('openedAt', value)} disabled={!canUpdate} />
              <div className="md:col-span-2">
                <Field label="CNAEs secundarios" value={draft.secondaryCnaes} onChange={(value) => handleChange('secondaryCnaes', value)} disabled={!canUpdate} />
              </div>
              <Field label="Representante legal" value={draft.legalRepresentative} onChange={(value) => handleChange('legalRepresentative', value)} disabled={!canUpdate} />
              <Field label="Slug do tenant" value={draft.slug} onChange={(value) => handleChange('slug', value)} disabled={!canUpdate} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
            <SectionTitle icon={ShieldCheck} title="Comunicacao e Digital" description="Canais oficiais usados na operacao, fiscal e financeiro." />
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="E-mail principal" type="email" value={draft.email} onChange={(value) => handleChange('email', value.trim().toLowerCase())} disabled={!canUpdate} />
              <Field label="E-mail financeiro" type="email" value={draft.financialEmail} onChange={(value) => handleChange('financialEmail', value.trim().toLowerCase())} disabled={!canUpdate} />
              <Field label="E-mail fiscal" type="email" value={draft.fiscalEmail} onChange={(value) => handleChange('fiscalEmail', value.trim().toLowerCase())} disabled={!canUpdate} />
              <Field label="Telefone principal" value={draft.phone} onChange={(value) => handleChange('phone', formatPhone(value))} disabled={!canUpdate} placeholder="(11) 99999-9999" />
              <Field label="WhatsApp" value={draft.whatsapp} onChange={(value) => handleChange('whatsapp', formatPhone(value))} disabled={!canUpdate} placeholder="(11) 99999-9999" />
              <Field label="Site institucional" value={draft.website} onChange={(value) => handleChange('website', value)} disabled={!canUpdate} />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
            <SectionTitle icon={MapPin} title="Endereco da Empresa" description="Dados para emissao fiscal e localizacao institucional." />
            <div className="mt-6 rounded-[1.75rem] bg-[radial-gradient(circle_at_top,_rgba(120,140,60,0.22),_transparent_55%),linear-gradient(135deg,rgba(140,154,93,0.18),rgba(26,28,21,0.02))] p-5">
              <div className="flex h-40 items-center justify-center rounded-[1.5rem] border border-white/40 bg-white/40 text-center">
                {draft.logoUrl ? (
                  <div className="flex h-full w-full items-center justify-center p-4">
                    <img
                      src={draft.logoUrl}
                      alt={`Logo da ${draft.tradeName || draft.name || 'transportadora'}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Tenant</p>
                    <p className="mt-2 text-2xl font-black text-on-surface">{draft.tradeName || draft.name || 'Transportadora'}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{draft.city && draft.state ? `${draft.city} - ${draft.state}` : 'Perfil institucional da conta'}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Logo da transportadora</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      disabled={!canUpdate}
                      onChange={(event) => void handleLogoUpload(event.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={!canUpdate}
                      className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ImagePlus className="h-4 w-4 text-primary" />
                      {draft.logoUrl ? 'Trocar logo' : 'Enviar logo'}
                    </button>
                    {draft.logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={!canUpdate}
                        className="inline-flex items-center gap-2 rounded-full border border-error/20 bg-error/10 px-4 py-3 text-sm font-bold text-error transition-colors hover:bg-error/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover logo
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Envie uma imagem de ate 5 MB. Ela sera otimizada automaticamente antes de salvar.
                  </p>
                </div>
              </div>
              <Field label="CEP" value={draft.zipCode} onChange={(value) => handleChange('zipCode', formatZipCode(value))} disabled={!canUpdate} placeholder="00000-000" />
              <Field label="Codigo IBGE" value={draft.ibgeCode} onChange={(value) => handleChange('ibgeCode', value)} disabled={!canUpdate} />
              <div className="md:col-span-2">
                <Field label="Logradouro" value={draft.addressLine} onChange={(value) => handleChange('addressLine', value)} disabled={!canUpdate} />
              </div>
              <Field label="Numero" value={draft.addressNumber} onChange={(value) => handleChange('addressNumber', value)} disabled={!canUpdate} />
              <Field label="Complemento" value={draft.addressComplement} onChange={(value) => handleChange('addressComplement', value)} disabled={!canUpdate} />
              <div className="md:col-span-2">
                <Field label="Bairro" value={draft.district} onChange={(value) => handleChange('district', value)} disabled={!canUpdate} />
              </div>
              <Field label="Cidade" value={draft.city} onChange={(value) => handleChange('city', value)} disabled={!canUpdate} />
              <Field label="UF" value={draft.state} onChange={(value) => handleChange('state', value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase())} disabled={!canUpdate} maxLength={2} placeholder="SP" />
            </div>
          </section>

          <section className="rounded-[2rem] border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
            <SectionTitle icon={ShieldCheck} title="Conta SaaS" description="Informacoes operacionais do tenant dentro da plataforma." />
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Plano" value={draft.plan} onChange={(value) => handleChange('plan', value)} disabled={!canUpdate || !canManageBilling} />
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Status da conta</label>
                <CustomSelect
                  value={draft.status}
                  onChange={(value) => handleChange('status', value)}
                  disabled={!canUpdate || !canManageBilling}
                  options={[
                    { value: 'active', label: 'Ativa' },
                    { value: 'inactive', label: 'Inativa' },
                    { value: 'suspended', label: 'Suspensa' },
                  ]}
                />
              </div>
              <div className="rounded-2xl bg-surface-container p-4 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Auditoria</p>
                <div className="mt-3 space-y-1 text-sm text-on-surface-variant">
                  <p>Criado por: <span className="font-semibold text-on-surface">{draft.createdByName || 'Nao identificado'}</span></p>
                  <p>Ultima atualizacao por: <span className="font-semibold text-on-surface">{draft.updatedByName || 'Nao identificado'}</span></p>
                  {!canManageBilling && <p className="pt-2 text-xs">Plano e status da conta sao controlados pela JP Soft.</p>}
                </div>
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-1 rounded-full bg-primary" />
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-on-surface">{title}</h2>
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">{description}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = 'text',
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-xl border border-outline-variant bg-surface-container px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

function formatZipCode(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, '$1-$2');
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
  return 'Nao foi possivel atualizar o perfil da transportadora.';
}

async function buildOptimizedLogoDataUrl(file: File) {
  const image = await loadImageFromFile(file);
  const maxWidth = 480;
  const maxHeight = 240;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas indisponivel.');
  }

  context.clearRect(0, 0, targetWidth, targetHeight);
  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const attempts: Array<{ type: string; quality?: number }> = [
    { type: 'image/webp', quality: 0.8 },
    { type: 'image/webp', quality: 0.65 },
    { type: 'image/jpeg', quality: 0.72 },
    { type: 'image/jpeg', quality: 0.56 },
    { type: 'image/jpeg', quality: 0.42 },
  ];

  for (const attempt of attempts) {
    const dataUrl = canvas.toDataURL(attempt.type, attempt.quality);
    if (dataUrl.length <= 900_000) {
      return dataUrl;
    }
  }

  throw new Error('A imagem continua muito grande mesmo apos a otimizacao.');
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('Falha ao carregar imagem.'));
    };
    image.src = imageUrl;
  });
}
