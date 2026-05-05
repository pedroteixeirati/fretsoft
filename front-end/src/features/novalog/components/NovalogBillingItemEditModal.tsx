import React, { useEffect, useState } from 'react';
import Modal from '../../../components/Modal';
import Input from '../../../shared/ui/Input';
import { FieldLabel, FormAlert, FormDatePicker } from '../../../shared/forms';
import { NovalogBillingItem, NovalogBillingItemUpdatePayload } from '../types/novalog-billing.types';
import { formatNovalogDecimalInput, parseNovalogDecimal } from '../utils/novalog.calculations';

interface NovalogBillingItemEditModalProps {
  isOpen: boolean;
  item: NovalogBillingItem | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (itemId: string, payload: NovalogBillingItemUpdatePayload) => Promise<void> | void;
}

export default function NovalogBillingItemEditModal({
  isOpen,
  item,
  isSubmitting = false,
  onClose,
  onSubmit,
}: NovalogBillingItemEditModalProps) {
  const [cteNumber, setCteNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen || !item) return;
    setCteNumber(item.cteNumber || '');
    setIssueDate(item.issueDate || '');
    setDueDate(item.dueDate || '');
    setAmount(String(item.amount || '').replace('.', ','));
    setNotes(item.notes || '');
    setSubmitError('');
  }, [isOpen, item]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!item) return;
    const amountValue = parseNovalogDecimal(amount);
    if (!cteNumber.trim() || !dueDate || amountValue <= 0) {
      setSubmitError('Informe CT-e, vencimento e valor maior que zero.');
      return;
    }

    setSubmitError('');
    await onSubmit(item.id, {
      cteNumber: cteNumber.trim(),
      issueDate: issueDate || undefined,
      dueDate,
      amount: amountValue,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? `Editar CT-e ${item.cteNumber}` : 'Editar CT-e'}
      panelClassName="max-w-[min(94vw,620px)]"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormAlert message={submitError} variant="error" />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <FieldLabel required>CT-e</FieldLabel>
            <Input value={cteNumber} onChange={(event) => setCteNumber(event.target.value)} placeholder="Numero CT-e" />
          </div>
          <FormDatePicker
            label="Emissao"
            value={issueDate}
            onChange={setIssueDate}
            required={false}
          />
          <FormDatePicker
            label="Vencimento"
            value={dueDate}
            onChange={setDueDate}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel required>Valor</FieldLabel>
            <Input value={amount} onChange={(event) => setAmount(formatNovalogDecimalInput(event.target.value))} placeholder="0,00" />
          </div>
          <Input label="Observacoes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcional" />
        </div>

        <div className="flex flex-col gap-3 border-t border-outline-variant/10 pt-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-full border border-outline-variant bg-surface px-5 py-3 text-sm font-bold text-on-surface transition hover:border-primary/20 hover:bg-primary/5 disabled:opacity-60">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition hover:scale-[1.01] active:scale-95 disabled:opacity-60">
            {isSubmitting ? 'Salvando...' : 'Salvar CT-e'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
