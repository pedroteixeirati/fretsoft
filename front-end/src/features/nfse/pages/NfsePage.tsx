import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Loader2, Plus, RefreshCw, Send, Trash2 } from 'lucide-react';
import { getErrorMessage } from '../../../lib/errors';
import { canAccess } from '../../../lib/permissions';
import { cn } from '../../../lib/utils';
import { useFirebase } from '../../../context/FirebaseContext';
import Alert from '../../../shared/ui/Alert';
import Modal from '../../../components/Modal';
import CustomSelect from '../../../components/CustomSelect';
import Input from '../../../shared/ui/Input';
import { FieldLabel } from '../../../shared/forms';
import { companiesApi } from '../../companies/services/companies.api';
import { queryKeys } from '../../../shared/lib/query-keys';
import { useNfse } from '../hooks/useNfse';
import { NfseDocument, NfseStatus, nfseStatusLabels } from '../types/nfse.types';

const statusStyles: Record<NfseStatus, string> = {
  draft: 'bg-surface-container text-on-surface-variant',
  processing: 'bg-tertiary-container text-on-tertiary-container',
  authorized: 'bg-primary/10 text-primary',
  rejected: 'bg-error/10 text-error',
  canceled: 'bg-surface-container text-on-surface-variant',
  error: 'bg-error/10 text-error',
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function NfsePage() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'payables', 'create');

  const { documents, isLoading, error, createNfse, emitNfse, syncNfse, removeNfse } = useNfse(Boolean(userProfile));
  const companiesQuery = useQuery({ queryKey: queryKeys.companies.list(), queryFn: companiesApi.list, enabled: Boolean(userProfile) });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);
  const [form, setForm] = useState({ companyId: '', competenceMonth: '', serviceAmount: '', serviceDescription: '' });

  const resetForm = () => setForm({ companyId: '', competenceMonth: '', serviceAmount: '', serviceDescription: '' });

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await createNfse.mutateAsync({
        companyId: form.companyId,
        competenceMonth: form.competenceMonth.trim(),
        serviceAmount: Number(form.serviceAmount.replace(',', '.')),
        serviceDescription: form.serviceDescription.trim(),
      });
      setFeedback({ tone: 'success', message: 'NFS-e criada como rascunho. Revise e emita.' });
      setIsModalOpen(false);
      resetForm();
    } catch (createError) {
      setFeedback({ tone: 'danger', message: getErrorMessage(createError, 'Nao foi possivel criar a NFS-e.') });
    }
  };

  const runAction = async (action: Promise<unknown>, okMessage: string) => {
    setFeedback(null);
    try {
      await action;
      setFeedback({ tone: 'success', message: okMessage });
    } catch (actionError) {
      setFeedback({ tone: 'danger', message: getErrorMessage(actionError, 'Nao foi possivel concluir a acao.') });
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">NFS-e</h1>
          <p className="mt-2 text-on-secondary-container">
            Emita a nota fiscal de servico do transporte. O prestador e os parametros vem do perfil fiscal e da Configuracao NFS-e.
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => { setFeedback(null); resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-all hover:shadow-md"
          >
            <Plus className="h-5 w-5" /> NOVA NFS-e
          </button>
        ) : null}
      </div>

      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}
      {error ? <Alert tone="danger">{getErrorMessage(error, 'Nao foi possivel carregar as NFS-e.')}</Alert> : null}

      <div className="rounded-xl bg-surface-container-low p-1">
        <div className="min-h-[400px] rounded-lg bg-surface-container-lowest p-4 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-medium text-on-surface-variant">Carregando NFS-e...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-outline/40">
                <FileText className="h-10 w-10" />
              </div>
              <h4 className="text-xl font-bold text-on-surface">Nenhuma NFS-e</h4>
              <p className="mt-2 max-w-sm text-on-surface-variant">Crie uma NFS-e selecionando o tomador, a competencia e o valor do servico.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {documents.map((doc: NfseDocument) => (
                <div key={doc.id} className="group flex flex-col gap-3 rounded-xl p-3 transition-all hover:bg-primary-fixed-dim/10 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3 sm:flex-1 sm:items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold font-headline text-on-surface">{doc.companyName || 'Tomador'}</span>
                        {doc.number ? (
                          <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">NFS-e {doc.number}</span>
                        ) : null}
                        <span className={cn('rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider', statusStyles[doc.status])}>
                          {nfseStatusLabels[doc.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-on-secondary-container">
                        {doc.competenceMonth ? `Competencia ${doc.competenceMonth} • ` : ''}
                        {doc.serviceDescription || 'Servico de transporte'}
                        {doc.errorMessage ? ` • ${doc.errorMessage}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:mr-4 sm:text-right">
                    <span className="text-sm font-bold text-on-surface">{formatCurrency(doc.serviceAmount)}</span>
                    <p className="text-[10px] uppercase text-on-secondary-container">Valor do servico</p>
                  </div>

                  <div className="flex items-center justify-end gap-1 self-end sm:self-auto">
                    {doc.xmlUrl ? (
                      <a href={doc.xmlUrl} target="_blank" rel="noreferrer" className="rounded-full px-2 py-1 text-xs font-bold text-primary hover:underline">XML</a>
                    ) : null}
                    {doc.pdfUrl ? (
                      <a href={doc.pdfUrl} target="_blank" rel="noreferrer" className="rounded-full px-2 py-1 text-xs font-bold text-primary hover:underline">PDF</a>
                    ) : null}
                    {canCreate && ['draft', 'rejected', 'error'].includes(doc.status) ? (
                      <button
                        type="button"
                        onClick={() => runAction(emitNfse.mutateAsync(doc.id), 'NFS-e enviada para emissao.')}
                        disabled={emitNfse.isPending}
                        className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-on-primary disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" /> Emitir
                      </button>
                    ) : null}
                    {canCreate && ['processing', 'authorized'].includes(doc.status) ? (
                      <button
                        type="button"
                        aria-label="Sincronizar"
                        onClick={() => runAction(syncNfse.mutateAsync(doc.id), 'Status da NFS-e atualizado.')}
                        disabled={syncNfse.isPending}
                        className="p-2 text-outline transition-colors hover:text-primary"
                        title="Sincronizar status"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </button>
                    ) : null}
                    {canCreate && doc.status === 'draft' ? (
                      <button
                        type="button"
                        aria-label="Excluir rascunho"
                        onClick={() => runAction(removeNfse.mutateAsync(doc.id), 'Rascunho excluido.')}
                        className="p-2 text-outline transition-colors hover:text-error"
                        title="Excluir rascunho"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova NFS-e">
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <FieldLabel required>Tomador (cliente)</FieldLabel>
              <CustomSelect
                value={form.companyId}
                onChange={(value) => setForm((current) => ({ ...current, companyId: value }))}
                options={companies.map((company) => ({ value: company.id, label: `${company.corporateName} — ${company.cnpj}` }))}
              />
            </div>
            <Input
              label="Competencia (AAAA-MM)"
              value={form.competenceMonth}
              onChange={(event) => setForm((current) => ({ ...current, competenceMonth: event.target.value }))}
              placeholder="2026-06"
            />
            <Input
              label="Valor do servico (R$)"
              type="number"
              required
              value={form.serviceAmount}
              onChange={(event) => setForm((current) => ({ ...current, serviceAmount: event.target.value }))}
            />
            <div className="md:col-span-2">
              <Input
                label="Descricao do servico"
                required
                value={form.serviceDescription}
                onChange={(event) => setForm((current) => ({ ...current, serviceDescription: event.target.value }))}
                placeholder="Ex: Prestacao de servico de transporte de colaboradores no mes de maio/26."
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createNfse.isPending || !form.companyId || !form.serviceAmount || !form.serviceDescription.trim()}
              className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {createNfse.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Criar NFS-e
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
