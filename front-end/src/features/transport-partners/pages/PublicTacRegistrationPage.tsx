import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardCheck, Send } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button, Input, Modal, Select } from '../../../shared/ui';
import { submitPublicTacRegistration, type TacReceiptMethod } from '../services/public-tac-registration.api';

type TacFormValues = {
  name: string;
  documentNumber: string;
  rntrc: string;
  phone: string;
  receiptMethod: TacReceiptMethod;
  pixKey: string;
  pixKeyType: string;
  bankName: string;
  bankBranch: string;
  bankAccount: string;
  bankAccountType: string;
  notes: string;
  acceptedResponsibility: boolean;
  acceptedLgpd: boolean;
};

const initialValues: TacFormValues = {
  name: '',
  documentNumber: '',
  rntrc: '',
  phone: '',
  receiptMethod: '',
  pixKey: '',
  pixKeyType: '',
  bankName: '',
  bankBranch: '',
  bankAccount: '',
  bankAccountType: '',
  notes: '',
  acceptedResponsibility: false,
  acceptedLgpd: false,
};

type FieldErrors = Partial<Record<keyof TacFormValues, string>>;

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatPhoneInput(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function shouldShowPix(receiptMethod: TacReceiptMethod) {
  return receiptMethod === 'pix' || receiptMethod === 'both';
}

function shouldShowBank(receiptMethod: TacReceiptMethod) {
  return receiptMethod === 'bank_transfer' || receiptMethod === 'both';
}

export default function PublicTacRegistrationPage() {
  const { tenantSlug = 'novalog' } = useParams();
  const [values, setValues] = useState<TacFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [successName, setSuccessName] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showPix = shouldShowPix(values.receiptMethod);
  const showBank = shouldShowBank(values.receiptMethod);

  const isReady = useMemo(() => {
    if (!values.name.trim() || !values.documentNumber.trim() || !values.rntrc.trim() || !values.phone.trim() || !values.receiptMethod) return false;
    if (showPix && (!values.pixKey.trim() || !values.pixKeyType.trim())) return false;
    if (showBank && (!values.bankName.trim() || !values.bankBranch.trim() || !values.bankAccount.trim() || !values.bankAccountType.trim())) return false;
    return values.acceptedResponsibility && values.acceptedLgpd;
  }, [showBank, showPix, values]);

  const update = <K extends keyof TacFormValues>(field: K, value: TacFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError('');
    setIsErrorModalOpen(false);
  };

  const updatePixKeyType = (pixKeyType: string) => {
    setValues((current) => ({
      ...current,
      pixKeyType,
      pixKey: current.pixKeyType === pixKeyType ? current.pixKey : '',
    }));
    setFieldErrors((current) => ({
      ...current,
      pixKeyType: undefined,
      pixKey: undefined,
    }));
    setSubmitError('');
    setIsErrorModalOpen(false);
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};
    const documentDigits = onlyDigits(values.documentNumber);
    const rntrcDigits = onlyDigits(values.rntrc);
    const phoneDigits = onlyDigits(values.phone);

    if (values.name.trim().length < 2) nextErrors.name = 'Informe seu nome completo ou razao social.';
    if (![11, 14].includes(documentDigits.length)) nextErrors.documentNumber = 'Informe CPF ou CNPJ valido.';
    if (rntrcDigits.length < 8 || rntrcDigits.length > 12) nextErrors.rntrc = 'Informe o RNTRC.';
    if (phoneDigits.length < 10 || phoneDigits.length > 11) nextErrors.phone = 'Informe WhatsApp com DDD.';
    if (!values.receiptMethod) nextErrors.receiptMethod = 'Selecione a forma de recebimento.';

    if (showPix) {
      if (!values.pixKeyType.trim()) nextErrors.pixKeyType = 'Informe o tipo da chave.';
      if (!values.pixKey.trim()) nextErrors.pixKey = 'Informe a chave PIX.';
    }

    if (showBank) {
      if (!values.bankName.trim()) nextErrors.bankName = 'Informe o banco.';
      if (!values.bankBranch.trim()) nextErrors.bankBranch = 'Informe a agencia.';
      if (!values.bankAccount.trim()) nextErrors.bankAccount = 'Informe a conta.';
      if (!values.bankAccountType.trim()) nextErrors.bankAccountType = 'Informe o tipo de conta.';
    }

    if (!values.acceptedResponsibility) nextErrors.acceptedResponsibility = 'Aceite a responsabilidade pelos dados.';
    if (!values.acceptedLgpd) nextErrors.acceptedLgpd = 'Aceite o uso dos dados conforme LGPD.';

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setSuccessName('');

    if (!validate() || !values.receiptMethod) return;

    setIsSubmitting(true);

    try {
      const response = await submitPublicTacRegistration(tenantSlug, {
        ...values,
        receiptMethod: values.receiptMethod,
      });
      setSuccessName(response.name);
      setIsSuccessModalOpen(true);
      setValues(initialValues);
      setFieldErrors({});
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Nao foi possivel enviar o cadastro.');
      setIsErrorModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface px-4 py-6 text-on-surface sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-[0_18px_48px_rgba(26,28,21,0.08)] sm:p-7">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-on-primary">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">NovaLog</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-primary sm:text-3xl">Cadastro de TAC</h1>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Preencha os dados com atencao. Eles serao usados para validacao cadastral, CIOT e pagamento de frete.
              </p>
            </div>
          </div>
        </section>

        {isSuccessModalOpen ? (
          <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-[0_18px_48px_rgba(26,28,21,0.08)] sm:p-7">
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h2 className="text-lg font-black text-primary">Cadastro enviado</h2>
                  <p className="mt-2 text-sm leading-6 text-on-surface">
                    {successName ? `Cadastro de ${successName} enviado com sucesso.` : 'Cadastro enviado com sucesso.'}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    A NovaLog fara a conferencia dos dados antes de liberar o cadastro.
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-[0_18px_48px_rgba(26,28,21,0.08)] sm:p-7">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Nome completo / razao social" value={values.name} onChange={(event) => update('name', event.target.value)} error={fieldErrors.name} required />
              <Input label="CPF ou CNPJ" value={values.documentNumber} onChange={(event) => update('documentNumber', event.target.value)} placeholder="Somente numeros" error={fieldErrors.documentNumber} required />
              <Input label="RNTRC" value={values.rntrc} onChange={(event) => update('rntrc', event.target.value)} placeholder="Registro ANTT" error={fieldErrors.rntrc} required />
              <Input label="Telefone / WhatsApp" value={values.phone} onChange={(event) => update('phone', formatPhoneInput(event.target.value))} placeholder="(00) 00000-0000" error={fieldErrors.phone} required />
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-on-surface-variant">Metodo de recebimento</span>
              <Select
                value={values.receiptMethod}
                onChange={(value) => update('receiptMethod', value as TacReceiptMethod)}
                placeholder="Selecione"
                error={fieldErrors.receiptMethod}
                options={[
                  { value: 'pix', label: 'PIX' },
                  { value: 'bank_transfer', label: 'Transferencia bancaria' },
                  { value: 'both', label: 'PIX e transferencia bancaria' },
                ]}
              />
            </div>

            {showPix ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="mb-2 block text-sm font-medium text-on-surface-variant">Tipo da chave PIX</span>
                  <Select
                    value={values.pixKeyType}
                    onChange={updatePixKeyType}
                    placeholder="Selecione"
                    error={fieldErrors.pixKeyType}
                    options={[
                      { value: 'cpf', label: 'CPF' },
                      { value: 'cnpj', label: 'CNPJ' },
                      { value: 'phone', label: 'Telefone' },
                      { value: 'email', label: 'E-mail' },
                      { value: 'random', label: 'Chave aleatoria' },
                    ]}
                  />
                </div>
                <Input label="Chave PIX" value={values.pixKey} onChange={(event) => update('pixKey', event.target.value)} placeholder="Informe a chave PIX" error={fieldErrors.pixKey} required />
              </div>
            ) : null}

            {showBank ? (
              <div className="grid gap-4 md:grid-cols-4">
                <Input label="Banco" value={values.bankName} onChange={(event) => update('bankName', event.target.value)} error={fieldErrors.bankName} required />
                <Input label="Agencia" value={values.bankBranch} onChange={(event) => update('bankBranch', event.target.value)} placeholder="0000" error={fieldErrors.bankBranch} required />
                <Input label="Conta" value={values.bankAccount} onChange={(event) => update('bankAccount', event.target.value)} placeholder="00000-0" error={fieldErrors.bankAccount} required />
                <Input label="Tipo de conta" value={values.bankAccountType} onChange={(event) => update('bankAccountType', event.target.value)} placeholder="Corrente" error={fieldErrors.bankAccountType} required />
              </div>
            ) : null}

            <Input label="Observacoes" value={values.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Informacoes adicionais, se necessario" />

            <div className="space-y-3 rounded-2xl border border-outline-variant/20 bg-surface-container p-4">
              <label className="flex gap-3 text-sm leading-5 text-on-surface">
                <input
                  type="checkbox"
                  checked={values.acceptedResponsibility}
                  onChange={(event) => update('acceptedResponsibility', event.target.checked)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span>Declaro que as informacoes preenchidas sao verdadeiras e assumo responsabilidade pelos dados enviados.</span>
              </label>
              {fieldErrors.acceptedResponsibility ? <p className="pl-7 text-xs font-medium text-error">{fieldErrors.acceptedResponsibility}</p> : null}

              <label className="flex gap-3 text-sm leading-5 text-on-surface">
                <input
                  type="checkbox"
                  checked={values.acceptedLgpd}
                  onChange={(event) => update('acceptedLgpd', event.target.checked)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span>Autorizo o uso dos meus dados para cadastro, validacao operacional, emissao fiscal e pagamento de frete, conforme a LGPD.</span>
              </label>
              {fieldErrors.acceptedLgpd ? <p className="pl-7 text-xs font-medium text-error">{fieldErrors.acceptedLgpd}</p> : null}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || !isReady}>
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Enviando...' : 'Enviar cadastro'}
              </Button>
            </div>
          </div>
        </form>
        )}
      </div>

      <Modal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        title="Cadastro nao enviado"
        subtitle="Revise a informacao indicada e tente novamente."
        panelClassName="max-w-md"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-error/15 bg-error/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
            <p className="text-sm leading-6 text-on-surface">
              {submitError || 'Nao foi possivel enviar o cadastro.'}
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setIsErrorModalOpen(false)}>Entendi</Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
