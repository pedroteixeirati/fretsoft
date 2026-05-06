import React, { useEffect, useMemo, useState } from 'react';
import { Copy, FileText, Plus, Trash2 } from 'lucide-react';
import Modal from '../../../components/Modal';
import Input from '../../../shared/ui/Input';
import { FieldLabel, FormAlert, FormDatePicker } from '../../../shared/forms';
import { Company } from '../../companies/types/company.types';
import NovalogAutocompleteSelect from './NovalogAutocompleteSelect';
import { getTodayInputDate } from '../constants/novalog.constants';
import { NovalogBilling, NovalogBillingItemDraft, NovalogBillingPayload } from '../types/novalog-billing.types';
import { formatNovalogCurrency, formatNovalogDecimalInput, parseNovalogDecimal } from '../utils/novalog.calculations';

interface NovalogBillingFormModalProps {
  isOpen: boolean;
  companies: Company[];
  draftBilling?: NovalogBilling | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: NovalogBillingPayload, action: 'draft' | 'close') => Promise<void> | void;
}

type ItemErrors = Partial<Record<keyof Pick<NovalogBillingItemDraft, 'cteNumber' | 'issueDate' | 'dueDate' | 'amount'>, string>>;

function createDraftItem(defaultDueDate = getTodayInputDate()): NovalogBillingItemDraft {
  return {
    id: `cte-row-${Math.random().toString(36).slice(2, 10)}`,
    cteNumber: '',
    cteKey: '',
    issueDate: '',
    dueDate: defaultDueDate,
    originName: '',
    destinationName: '',
    amount: '',
    notes: '',
  };
}

function mapBillingToDraftRows(billing?: NovalogBilling | null, defaultDueDate = getTodayInputDate()) {
  if (!billing?.items?.length) return [createDraftItem(defaultDueDate)];
  return billing.items.map((item) => ({
    id: item.id,
    cteNumber: item.cteNumber,
    cteKey: item.cteKey || '',
    issueDate: item.issueDate || '',
    dueDate: item.dueDate || billing.dueDate || defaultDueDate,
    originName: item.originName || '',
    destinationName: item.destinationName || '',
    amount: String(item.amount).replace('.', ','),
    notes: item.notes || '',
  }));
}

export default function NovalogBillingFormModal({
  isOpen,
  companies,
  draftBilling,
  isSubmitting = false,
  onClose,
  onSubmit,
}: NovalogBillingFormModalProps) {
  const [companyId, setCompanyId] = useState('');
  const [billingDate, setBillingDate] = useState(getTodayInputDate());
  const [dueDate, setDueDate] = useState(getTodayInputDate());
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<NovalogBillingItemDraft[]>([createDraftItem()]);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, ItemErrors>>({});

  const isEditing = Boolean(draftBilling);
  const companyOptions = useMemo(
    () =>
      companies
        .filter((company) => company.status === 'active')
        .map((company) => ({
          value: company.id,
          label: company.tradeName || company.corporateName,
        }))
        .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR')),
    [companies],
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + parseNovalogDecimal(item.amount), 0),
    [items],
  );

  useEffect(() => {
    if (!isOpen) return;
    setCompanyId(draftBilling?.companyId || '');
    setBillingDate(draftBilling?.billingDate || getTodayInputDate());
    setDueDate(draftBilling?.dueDate || getTodayInputDate());
    setNotes(draftBilling?.notes || '');
    setItems(mapBillingToDraftRows(draftBilling, draftBilling?.dueDate || getTodayInputDate()));
    setSubmitError('');
    setFieldErrors({});
    setItemErrors({});
  }, [draftBilling, isOpen]);

  const updateItem = (itemId: string, field: keyof NovalogBillingItemDraft, value: string) => {
    setItems((current) => current.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));
    setItemErrors((current) => {
      const currentErrors = current[itemId];
      if (!currentErrors?.[field as keyof ItemErrors]) return current;
      const nextItemErrors = { ...currentErrors };
      delete nextItemErrors[field as keyof ItemErrors];
      if (Object.keys(nextItemErrors).length === 0) {
        const nextErrors = { ...current };
        delete nextErrors[itemId];
        return nextErrors;
      }
      return { ...current, [itemId]: nextItemErrors };
    });
  };

  const addItem = () => setItems((current) => [...current, createDraftItem(dueDate)]);

  const duplicateItem = (itemId: string) => {
    setItems((current) => {
      const item = current.find((row) => row.id === itemId);
      if (!item) return current;
      return [...current, { ...item, id: `cte-row-${Math.random().toString(36).slice(2, 10)}`, cteNumber: '' }];
    });
  };

  const removeItem = (itemId: string) => {
    setItems((current) => (current.length === 1 ? current : current.filter((item) => item.id !== itemId)));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const action = submitter?.dataset.action === 'close' ? 'close' : 'draft';
    const nextFieldErrors: Record<string, string> = {};
    const nextItemErrors: Record<string, ItemErrors> = {};
    const seenCtes = new Set<string>();

    if (!companyId) nextFieldErrors.companyId = 'Selecione o cliente.';
    if (!billingDate) nextFieldErrors.billingDate = 'Informe a data do faturamento.';
    if (!dueDate) nextFieldErrors.dueDate = 'Informe o vencimento.';

    items.forEach((item) => {
      const errors: ItemErrors = {};
      const cteNumber = item.cteNumber.trim();
      if (!cteNumber) errors.cteNumber = 'Informe o CT-e.';
      if (cteNumber && seenCtes.has(cteNumber.toLocaleLowerCase('pt-BR'))) {
        errors.cteNumber = 'CT-e duplicado no faturamento.';
      }
      if (cteNumber) seenCtes.add(cteNumber.toLocaleLowerCase('pt-BR'));
      if (!item.dueDate) errors.dueDate = 'Informe o vencimento.';
      if (parseNovalogDecimal(item.amount) <= 0) errors.amount = 'Informe um valor maior que zero.';
      if (Object.keys(errors).length > 0) nextItemErrors[item.id] = errors;
    });

    setFieldErrors(nextFieldErrors);
    setItemErrors(nextItemErrors);
    if (Object.keys(nextFieldErrors).length > 0 || Object.keys(nextItemErrors).length > 0) {
      setSubmitError('Revise os campos obrigatorios antes de salvar o faturamento.');
      return;
    }

    setSubmitError('');
    await onSubmit({
      companyId,
      billingDate,
      dueDate,
      notes: notes.trim() || undefined,
      items: items.map((item) => ({
        cteNumber: item.cteNumber.trim(),
        cteKey: item.cteKey.trim() || undefined,
        issueDate: item.issueDate || undefined,
        dueDate: item.dueDate || dueDate,
        amount: parseNovalogDecimal(item.amount),
        notes: item.notes.trim() || undefined,
      })),
    }, action);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar faturamento Novalog' : 'Novo faturamento Novalog'}
      panelClassName="max-w-[min(94vw,1320px)]"
      contentClassName="xl:px-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormAlert message={submitError} variant="error" />

        <section className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-2">
            <FieldLabel required>Cliente</FieldLabel>
            <NovalogAutocompleteSelect
              value={companyId}
              onChange={(value) => {
                setCompanyId(value);
                setFieldErrors((current) => ({ ...current, companyId: '' }));
              }}
              options={companyOptions}
              placeholder="Selecione o cliente"
              error={fieldErrors.companyId}
              allowFreeText={false}
            />
          </div>
          <FormDatePicker
            label="Data"
            value={billingDate}
            onChange={(value) => {
              setBillingDate(value);
              setFieldErrors((current) => ({ ...current, billingDate: '' }));
            }}
            error={fieldErrors.billingDate}
          />
          <FormDatePicker
            label="Vencimento"
            value={dueDate}
            onChange={(value) => {
              setDueDate(value);
              setFieldErrors((current) => ({ ...current, dueDate: '' }));
            }}
            error={fieldErrors.dueDate}
          />
        </section>

        <Input label="Observacoes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcional" />

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface">CT-es do faturamento</h3>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface px-4 py-2 text-xs font-bold text-on-surface transition hover:border-primary/20 hover:bg-primary/5"
            >
              <Plus className="h-4 w-4 text-primary" />
              Adicionar CT-e
            </button>
          </div>

          <div className="overflow-hidden rounded-[1.8rem] border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">CT-e</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Emissao</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Vencimento</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Valor</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-center">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {items.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="min-w-[140px] px-4 py-4">
                        <Input value={item.cteNumber} onChange={(event) => updateItem(item.id, 'cteNumber', event.target.value)} placeholder="Numero CTe" error={itemErrors[item.id]?.cteNumber} />
                      </td>
                      <td className="min-w-[160px] px-4 py-4">
                        <FormDatePicker
                          label="Emissao"
                          value={item.issueDate}
                          onChange={(value) => updateItem(item.id, 'issueDate', value)}
                          required={false}
                          showLabel={false}
                          error={itemErrors[item.id]?.issueDate}
                          containerClassName="space-y-0"
                          buttonClassName="rounded-[1.35rem] border-outline-variant bg-surface px-4 py-3.5"
                        />
                      </td>
                      <td className="min-w-[160px] px-4 py-4">
                        <FormDatePicker
                          label="Vencimento"
                          value={item.dueDate}
                          onChange={(value) => updateItem(item.id, 'dueDate', value)}
                          required={false}
                          showLabel={false}
                          error={itemErrors[item.id]?.dueDate}
                          containerClassName="space-y-0"
                          buttonClassName="rounded-[1.35rem] border-outline-variant bg-surface px-4 py-3.5"
                        />
                      </td>
                      <td className="min-w-[160px] px-4 py-4">
                        <Input value={item.amount} onChange={(event) => updateItem(item.id, 'amount', formatNovalogDecimalInput(event.target.value))} placeholder="0,00" error={itemErrors[item.id]?.amount} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-[130px] items-center justify-center gap-2">
                          <button type="button" onClick={() => duplicateItem(item.id)} className="rounded-full border border-outline-variant bg-surface p-2 text-primary transition hover:bg-primary/5" aria-label="Duplicar CT-e">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => removeItem(item.id)} className="rounded-full border border-error/20 bg-error/5 p-2 text-error transition hover:bg-error/10" aria-label="Remover CT-e">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-outline-variant/12 bg-surface-container-low/40 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Total do faturamento</p>
          <p className="mt-1 text-xl font-black text-primary">{formatNovalogCurrency(totalAmount)}</p>
        </section>

        <div className="flex flex-col gap-3 border-t border-outline-variant/10 pt-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-full border border-outline-variant bg-surface px-5 py-3 text-sm font-bold text-on-surface transition hover:border-primary/20 hover:bg-primary/5">
            Cancelar
          </button>
          <button type="submit" data-action="draft" disabled={isSubmitting} className="rounded-full border border-outline-variant bg-surface px-5 py-3 text-sm font-bold text-on-surface transition hover:border-primary/20 hover:bg-primary/5 disabled:opacity-60">
            {isSubmitting ? 'Salvando...' : 'Salvar rascunho'}
          </button>
          <button type="submit" data-action="close" disabled={isSubmitting} className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition hover:scale-[1.01] active:scale-95 disabled:opacity-60">
            {isSubmitting ? 'Gerando...' : 'Salvar e gerar recebiveis'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
