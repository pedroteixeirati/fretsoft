import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileCheck2, FilePlus2, Lock, Pencil, RefreshCw, Search, Send, Trash2 } from 'lucide-react';
import { useFirebase } from '../../../context/FirebaseContext';
import { getErrorMessage } from '../../../lib/errors';
import { canAccess } from '../../../lib/permissions';
import { canUseFiscalThirdParty } from '../../../lib/features';
import { Alert, Button, ConfirmDialog, DataTable, Input, KpiCard, Modal, PageHeader, Select, type DataTableColumn } from '../../../shared/ui';
import { fiscalApi } from '../services/fiscal.api';
import { DEFAULT_ICMS_CST, suggestCfop } from '../utils/cfop';
import { useFiscalDocumentsQuery } from '../hooks/useFiscalDocumentsQuery';
import { useFiscalDocumentMutations } from '../hooks/useFiscalDocumentMutations';
import type { FiscalCteData, FiscalDocument, FiscalDocumentDraft, FiscalDocumentStatus, FiscalDocumentType, FiscalExecutionMode, FiscalParty, FiscalPayment } from '../types/fiscal.types';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const statusLabels: Record<FiscalDocumentStatus, string> = {
  draft: 'Rascunho',
  processing: 'Processando',
  authorized: 'Autorizado',
  rejected: 'Rejeitado',
  canceled: 'Cancelado',
  denied: 'Denegado',
  inutilized: 'Inutilizado',
  error: 'Erro',
};

const emptyDraft: FiscalDocumentDraft = {
  documentType: 'cte',
  model: '57',
  series: '',
  number: '',
  accessKey: '',
  status: 'draft',
  issueDate: '',
  dueDate: '',
  amount: 0,
  originName: '',
  destinationName: '',
  takerName: '',
  protocol: '',
  authorizedAt: '',
  xml: '',
  dacteUrl: '',
  provider: '',
  providerDocumentId: '',
  idempotencyKey: '',
  taxData: {},
  emitterSnapshot: {},
  notes: '',
  sourceFreightId: '',
  executionMode: 'own_fleet',
  ciot: '',
  rntrc: '',
  cteData: {},
  parties: [],
  payments: [],
};

const PARTY_ROLES = ['sender', 'recipient'] as const;

function blankParty(role: FiscalParty['role']): FiscalParty {
  return { role, name: '', documentNumber: '', stateRegistration: '', city: '', state: '', phone: '', street: '', number: '', district: '', zipCode: '', cityIbgeCode: '' };
}

function formatDate(value: string) {
  if (!value) return '-';
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function documentLabel(document: FiscalDocument) {
  return `${document.documentType.toUpperCase()} ${document.series}/${document.number}`;
}

export default function FiscalDocumentsPage() {
  const { user, userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'fiscal', 'create');
  const canUpdate = canAccess(userProfile, 'fiscal', 'update');
  const canDelete = canAccess(userProfile, 'fiscal', 'delete');
  const canUseTac = canUseFiscalThirdParty(userProfile);
  const { documents, isLoading, error } = useFiscalDocumentsQuery(Boolean(user));
  const { createDocument, updateDocument, emitDocument, syncDocument, deleteDocument, isSubmitting } = useFiscalDocumentMutations();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FiscalDocumentStatus>('all');
  const [editingDocument, setEditingDocument] = useState<FiscalDocument | null>(null);
  const [draft, setDraft] = useState<FiscalDocumentDraft>(emptyDraft);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [documentToDelete, setDocumentToDelete] = useState<FiscalDocument | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const filteredDocuments = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return documents.filter((document) => {
      const matchesSearch =
        documentLabel(document).toLowerCase().includes(term) ||
        document.accessKey.toLowerCase().includes(term) ||
        document.takerName.toLowerCase().includes(term) ||
        document.originName.toLowerCase().includes(term) ||
        document.destinationName.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || document.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [documents, searchTerm, statusFilter]);

  const totals = useMemo(() => {
    return filteredDocuments.reduce(
      (acc, document) => {
        acc.amount += Number(document.amount || 0);
        acc.authorized += document.status === 'authorized' ? 1 : 0;
        acc.open += ['draft', 'processing', 'error', 'rejected'].includes(document.status) ? 1 : 0;
        return acc;
      },
      { amount: 0, authorized: 0, open: 0 },
    );
  }, [filteredDocuments]);

  const openCreate = () => {
    setEditingDocument(null);
    setDraft(emptyDraft);
    setSubmitError('');
    setIsModalOpen(true);
  };

  const openEdit = (document: FiscalDocument) => {
    setEditingDocument(document);
    setDraft({
      documentType: document.documentType,
      model: document.model,
      series: document.series,
      number: document.number,
      accessKey: document.accessKey,
      status: document.status,
      issueDate: document.issueDate,
      dueDate: document.dueDate,
      amount: document.amount,
      originName: document.originName,
      destinationName: document.destinationName,
      takerName: document.takerName,
      protocol: document.protocol,
      authorizedAt: document.authorizedAt,
      xml: document.xml,
      dacteUrl: document.dacteUrl,
      provider: document.provider,
      providerDocumentId: document.providerDocumentId,
      idempotencyKey: document.idempotencyKey,
      taxData: document.taxData || {},
      emitterSnapshot: document.emitterSnapshot || {},
      notes: document.notes,
      sourceFreightId: document.sourceFreightId || '',
      executionMode: document.executionMode || 'own_fleet',
      ciot: document.ciot || '',
      rntrc: document.rntrc || '',
      cteData: document.cteData || {},
      parties: document.parties || [],
      payments: document.payments || [],
    });
    setSubmitError('');
    setIsModalOpen(true);
  };

  const updateDraft = <K extends keyof FiscalDocumentDraft>(key: K, value: FiscalDocumentDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const payment: FiscalPayment = draft.payments[0] || {
    payeeName: '', payeeDocument: '', componentType: '04', amount: 0, bankName: '', bankBranch: '', bankAccount: '', pixKey: '',
  };

  const updatePayment = <K extends keyof FiscalPayment>(key: K, value: FiscalPayment[K]) => {
    setDraft((current) => {
      const base = current.payments[0] || { payeeName: '', payeeDocument: '', componentType: '04' as const, amount: 0, bankName: '', bankBranch: '', bankAccount: '', pixKey: '' };
      return { ...current, payments: [{ ...base, [key]: value }] };
    });
  };

  const getParty = (role: FiscalParty['role']) => draft.parties.find((current) => current.role === role) || blankParty(role);

  const updateParty = (role: FiscalParty['role'], key: keyof FiscalParty, value: string) => {
    setDraft((current) => {
      const others = current.parties.filter((party) => party.role !== role);
      const existing = current.parties.find((party) => party.role === role) || blankParty(role);
      const nextParties = [...others, { ...existing, [key]: value }];

      // Ao definir a UF de remetente/destinatario, sugere CFOP/CST se ainda vazios.
      let cteData = current.cteData;
      if (key === 'state') {
        const ufOrigem = nextParties.find((party) => party.role === 'sender')?.state || '';
        const ufDestino = nextParties.find((party) => party.role === 'recipient')?.state || '';
        const cfop = suggestCfop(ufOrigem, ufDestino);
        const patch: Partial<FiscalCteData> = {};
        if (cfop && !current.cteData.cfop) patch.cfop = cfop;
        if (!current.cteData.icmsCst) patch.icmsCst = DEFAULT_ICMS_CST;
        if (Object.keys(patch).length) cteData = { ...current.cteData, ...patch };
      }

      return { ...current, parties: nextParties, cteData };
    });
  };

  const updateCteData = <K extends keyof FiscalCteData>(key: K, value: FiscalCteData[K]) => {
    setDraft((current) => ({ ...current, cteData: { ...current.cteData, [key]: value } }));
  };

  const nfeKeysText = (draft.cteData.nfeKeys || []).join('\n');
  const setNfeKeysText = (text: string) => {
    const keys = text.split(/[\s,;]+/).map((key) => key.replace(/\D/g, '')).filter((key) => key.length > 0);
    updateCteData('nfeKeys', keys);
  };

  const isCte = draft.documentType !== 'mdfe';

  const renderParty = (role: FiscalParty['role'], label: string) => {
    const party = getParty(role);
    return (
      <div className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container/40 p-4">
        <p className="text-sm font-bold text-on-surface">{label}</p>
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Nome" value={party.name} onChange={(event) => updateParty(role, 'name', event.target.value)} />
          <Input label="CNPJ / CPF" value={party.documentNumber} onChange={(event) => updateParty(role, 'documentNumber', event.target.value)} />
          <Input label="Inscricao estadual" value={party.stateRegistration} onChange={(event) => updateParty(role, 'stateRegistration', event.target.value)} />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Input label="Municipio" value={party.city} onChange={(event) => updateParty(role, 'city', event.target.value)} />
          <Input label="Codigo IBGE" value={party.cityIbgeCode} onChange={(event) => updateParty(role, 'cityIbgeCode', event.target.value)} placeholder="7 digitos" />
          <Input label="UF" value={party.state} onChange={(event) => updateParty(role, 'state', event.target.value)} maxLength={2} />
          <Input label="CEP" value={party.zipCode} onChange={(event) => updateParty(role, 'zipCode', event.target.value)} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Logradouro" value={party.street} onChange={(event) => updateParty(role, 'street', event.target.value)} />
          <Input label="Numero" value={party.number} onChange={(event) => updateParty(role, 'number', event.target.value)} />
          <Input label="Bairro" value={party.district} onChange={(event) => updateParty(role, 'district', event.target.value)} />
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fromFreight = searchParams.get('fromFreight');
    if (!fromFreight || isLoading) return;

    let cancelled = false;
    const clearParam = () => {
      searchParams.delete('fromFreight');
      setSearchParams(searchParams, { replace: true });
    };

    (async () => {
      try {
        const result = await fiscalApi.draftFromFreight(fromFreight);
        if (cancelled) return;
        if (result.existingDocumentId) {
          const existing = documents.find((current) => current.id === result.existingDocumentId);
          if (existing) {
            openEdit(existing);
            setSuccessMessage('Este frete ja possui um documento fiscal. Abrimos o registro existente.');
          }
        } else {
          setEditingDocument(null);
          setDraft({ ...emptyDraft, ...result.draft } as FiscalDocumentDraft);
          setSubmitError('');
          setIsModalOpen(true);
        }
      } catch (prefillError) {
        if (!cancelled) setSubmitError(getErrorMessage(prefillError, 'Nao foi possivel carregar os dados do frete.'));
      } finally {
        if (!cancelled) clearParam();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, isLoading, documents]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    if (!draft.series.trim() || !draft.number.trim() || !draft.issueDate || Number(draft.amount) <= 0) {
      setSubmitError('Informe serie, numero, emissao e valor do documento fiscal.');
      return;
    }

    try {
      const payload = {
        ...draft,
        amount: Number(draft.amount),
        model: draft.documentType === 'mdfe' && !draft.model ? '58' : draft.model || '57',
      };

      const saved = editingDocument
        ? await updateDocument.mutateAsync({ id: editingDocument.id, payload })
        : await createDocument.mutateAsync(payload);

      setWarningMessages(saved?.warnings ?? []);
      setSuccessMessage(editingDocument ? 'Documento fiscal atualizado com sucesso.' : 'Documento fiscal registrado com sucesso.');
      setIsModalOpen(false);
    } catch (submitError) {
      setSubmitError(getErrorMessage(submitError, 'Nao foi possivel salvar o documento fiscal.'));
    }
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      setSubmitError('');
      await deleteDocument.mutateAsync(documentToDelete.id);
      setSuccessMessage('Documento fiscal excluido com sucesso.');
      setDocumentToDelete(null);
    } catch (deleteError) {
      setDocumentToDelete(null);
      setSubmitError(getErrorMessage(deleteError, 'Nao foi possivel excluir o documento fiscal.'));
    }
  };

  const handleEmit = async (document: FiscalDocument) => {
    try {
      setSubmitError('');
      setSuccessMessage('');
      await emitDocument.mutateAsync(document.id);
      setSuccessMessage(`${documentLabel(document)} enviado para emissao fiscal.`);
    } catch (emitError) {
      setSubmitError(getErrorMessage(emitError, 'Nao foi possivel enviar o documento fiscal para emissao.'));
    }
  };

  const handleSync = async (document: FiscalDocument) => {
    try {
      setSubmitError('');
      setSuccessMessage('');
      await syncDocument.mutateAsync(document.id);
      setSuccessMessage(`${documentLabel(document)} sincronizado com a Focus NFe.`);
    } catch (syncError) {
      setSubmitError(getErrorMessage(syncError, 'Nao foi possivel sincronizar o documento fiscal.'));
    }
  };

  const columns: Array<DataTableColumn<FiscalDocument>> = [
    { id: 'document', header: 'Documento', cell: (document) => <span className="text-sm font-bold text-on-surface">{documentLabel(document)}</span> },
    { id: 'issueDate', header: 'Emissao', cell: (document) => <span className="text-sm text-on-surface">{formatDate(document.issueDate)}</span> },
    { id: 'taker', header: 'Tomador', cell: (document) => <span className="text-sm text-on-surface">{document.takerName || '-'}</span> },
    { id: 'route', header: 'Rota', cell: (document) => <span className="text-sm text-on-surface">{[document.originName, document.destinationName].filter(Boolean).join(' -> ') || '-'}</span> },
    { id: 'amount', header: 'Valor', className: 'text-right', headerClassName: 'text-right', cell: (document) => <span className="text-sm font-bold text-primary">{currency.format(document.amount)}</span> },
    { id: 'status', header: 'Status', cell: (document) => <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface">{statusLabels[document.status]}</span> },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (document) => (
        <div className="flex justify-end gap-2">
          {canUpdate && ['draft', 'rejected', 'error'].includes(document.status) ? (
            <button
              type="button"
              aria-label={`Emitir ${documentLabel(document)}`}
              onClick={() => handleEmit(document)}
              disabled={emitDocument.isPending}
              className="rounded-full p-2 text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          ) : null}
          {canUpdate && ['processing', 'authorized', 'rejected', 'error'].includes(document.status) ? (
            <button
              type="button"
              aria-label={`Sincronizar ${documentLabel(document)}`}
              onClick={() => handleSync(document)}
              disabled={syncDocument.isPending}
              className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          ) : null}
          {canUpdate ? (
            <button type="button" aria-label={`Editar ${documentLabel(document)}`} onClick={() => openEdit(document)} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container">
              <Pencil className="h-4 w-4" />
            </button>
          ) : null}
          {canDelete ? (
            <button type="button" aria-label={`Excluir ${documentLabel(document)}`} onClick={() => setDocumentToDelete(document)} className="rounded-full p-2 text-error hover:bg-error/10">
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documentos fiscais"
        description="Registre CT-es e prepare a base para emissao fiscal, eventos e integracoes com emissor externo."
        actions={canCreate ? <Button onClick={openCreate}><FilePlus2 className="h-4 w-4" /> Novo documento</Button> : null}
      />

      {error ? <Alert tone="danger">{getErrorMessage(error, 'Nao foi possivel carregar os documentos fiscais.')}</Alert> : null}
      {submitError ? <Alert tone="danger">{submitError}</Alert> : null}
      {successMessage ? <Alert tone="success">{successMessage}</Alert> : null}
      {warningMessages.length ? (
        <Alert tone="warning">
          <ul className="list-disc pl-4">
            {warningMessages.map((message, index) => <li key={index}>{message}</li>)}
          </ul>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Valor filtrado" value={currency.format(totals.amount)} icon={FileCheck2} tone="success" />
        <KpiCard label="Autorizados" value={totals.authorized} icon={FileCheck2} tone="neutral" />
        <KpiCard label="Pendentes" value={totals.open} icon={FileCheck2} tone="warning" />
      </div>

      <DataTable
        rows={filteredDocuments}
        columns={columns}
        getRowKey={(document) => document.id}
        loading={isLoading}
        emptyLabel="Nenhum documento fiscal encontrado."
        summary={`${filteredDocuments.length} documento(s) fiscal(is)`}
        toolbar={(
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar documento, chave, tomador ou rota" leftIcon={<Search className="h-4 w-4" />} />
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as 'all' | FiscalDocumentStatus)}
              options={[
                { value: 'all', label: 'Todos os status' },
                ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
              ]}
              placeholder="Status"
            />
          </div>
        )}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDocument ? `Editar ${documentLabel(editingDocument)}` : 'Novo documento fiscal'}
        subtitle="Registro fiscal inicial. A emissao SEFAZ entra em uma fase posterior."
        panelClassName="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

          <div className="grid gap-4 md:grid-cols-4">
            <Select
              value={draft.documentType}
              onChange={(value) => updateDraft('documentType', value as FiscalDocumentType)}
              options={[
                { value: 'cte', label: 'CT-e' },
                { value: 'cte_os', label: 'CT-e OS' },
                { value: 'mdfe', label: 'MDF-e' },
              ]}
              placeholder="Tipo"
            />
            <Input label="Modelo" value={draft.model} onChange={(event) => updateDraft('model', event.target.value)} placeholder="57" />
            <Input label="Serie" value={draft.series} onChange={(event) => updateDraft('series', event.target.value)} placeholder="1" required />
            <Input label="Numero" value={draft.number} onChange={(event) => updateDraft('number', event.target.value)} placeholder="1001" required />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Input label="Emissao" type="date" value={draft.issueDate} onChange={(event) => updateDraft('issueDate', event.target.value)} required />
            <Input label="Vencimento" type="date" value={draft.dueDate} onChange={(event) => updateDraft('dueDate', event.target.value)} />
            <Input label="Valor" type="number" step="0.01" min="0" value={draft.amount || ''} onChange={(event) => updateDraft('amount', Number(event.target.value))} required />
            <div>
              <span className="block text-sm font-medium text-on-surface-variant">Status</span>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-2 text-xs font-bold text-on-surface">
                <Lock className="h-3 w-3" /> {statusLabels[editingDocument ? editingDocument.status : 'draft']}
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Tomador" value={draft.takerName} onChange={(event) => updateDraft('takerName', event.target.value)} placeholder="Empresa tomadora" />
            <Input label="Origem" value={draft.originName} onChange={(event) => updateDraft('originName', event.target.value)} placeholder="Origem" />
            <Input label="Destino" value={draft.destinationName} onChange={(event) => updateDraft('destinationName', event.target.value)} placeholder="Destino" />
          </div>

          {isCte ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl bg-info/5 px-4 py-3">
                <FileCheck2 className="h-5 w-5 text-info" />
                <div className="flex-1 text-sm">
                  <span className="font-bold text-on-surface">Emitente: {userProfile?.tenantName || 'Transportadora'}</span>
                  <p className="text-xs text-on-surface-variant">CNPJ, IE, CRT e endereco preenchidos automaticamente do cadastro da Transportadora.</p>
                </div>
              </div>

              {renderParty('sender', 'Remetente')}
              {renderParty('recipient', 'Destinatario')}

              <div>
                <span className="mb-1 block text-sm font-medium text-on-surface-variant">Tomador do servico (quem paga o frete)</span>
                <div className="md:w-1/2">
                  <Select
                    value={draft.cteData.tomadorTipo || 'destinatario'}
                    onChange={(value) => updateCteData('tomadorTipo', value)}
                    options={[
                      { value: 'destinatario', label: 'Destinatario' },
                      { value: 'remetente', label: 'Remetente' },
                      { value: 'outros', label: 'Outro' },
                    ]}
                    placeholder="Tomador"
                  />
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">Ex.: a carga sai da mineradora (remetente) e a siderurgica (destinatario) paga o frete.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input label="IBGE municipio inicio" value={draft.cteData.municipioInicioIbge || ''} onChange={(event) => updateCteData('municipioInicioIbge', event.target.value)} placeholder="7 digitos" />
                <Input label="IBGE municipio fim" value={draft.cteData.municipioFimIbge || ''} onChange={(event) => updateCteData('municipioFimIbge', event.target.value)} placeholder="7 digitos" />
              </div>

              <div className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container/40 p-4">
                <p className="text-sm font-bold text-on-surface">Tributacao</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input label="CFOP" value={draft.cteData.cfop || ''} onChange={(event) => updateCteData('cfop', event.target.value)} placeholder="6352" />
                  <Input label="Natureza da operacao" value={draft.cteData.naturezaOperacao || ''} onChange={(event) => updateCteData('naturezaOperacao', event.target.value)} />
                  <Input label="Tipo de servico" value={draft.cteData.tipoServico || ''} onChange={(event) => updateCteData('tipoServico', event.target.value)} placeholder="0 - Normal" />
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <Input label="CST ICMS" value={draft.cteData.icmsCst || ''} onChange={(event) => updateCteData('icmsCst', event.target.value)} placeholder="00" />
                  <Input label="Base calculo" type="number" step="0.01" value={draft.cteData.icmsBaseCalculo ?? ''} onChange={(event) => updateCteData('icmsBaseCalculo', event.target.value === '' ? undefined : Number(event.target.value))} />
                  <Input label="Aliquota %" type="number" step="0.01" value={draft.cteData.icmsAliquota ?? ''} onChange={(event) => updateCteData('icmsAliquota', event.target.value === '' ? undefined : Number(event.target.value))} />
                  <Input label="Valor ICMS" type="number" step="0.01" value={draft.cteData.icmsValor ?? ''} onChange={(event) => updateCteData('icmsValor', event.target.value === '' ? undefined : Number(event.target.value))} />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container/40 p-4">
                <p className="text-sm font-bold text-on-surface">Carga e NF-e vinculada</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Produto predominante" value={draft.cteData.produtoPredominante || ''} onChange={(event) => updateCteData('produtoPredominante', event.target.value)} />
                  <Input label="Valor da carga" type="number" step="0.01" value={draft.cteData.valorCarga ?? ''} onChange={(event) => updateCteData('valorCarga', event.target.value === '' ? undefined : Number(event.target.value))} />
                </div>
                <div>
                  <span className="mb-1 block text-sm font-medium text-on-surface-variant">Chaves de NF-e (uma por linha)</span>
                  <textarea value={nfeKeysText} onChange={(event) => setNfeKeysText(event.target.value)} rows={2} className="w-full rounded-xl border border-outline-variant bg-surface p-3 text-sm text-on-surface" placeholder="44 digitos por NF-e" />
                </div>
              </div>
            </div>
          ) : null}

          {canUseTac ? (
            <div className="space-y-4">
              <div className="md:w-1/2">
                <span className="mb-1 block text-sm font-medium text-on-surface-variant">Execucao do transporte</span>
                <Select
                  value={draft.executionMode}
                  onChange={(value) => updateDraft('executionMode', value as FiscalExecutionMode)}
                  options={[
                    { value: 'own_fleet', label: 'Frota propria' },
                    { value: 'third_party', label: 'Terceiro (TAC)' },
                  ]}
                  placeholder="Execucao"
                />
              </div>

              {draft.executionMode === 'third_party' ? (
                <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-bold text-primary">Pagamento ao transportador (TAC) — obrigatorio para terceiro</p>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input label="CIOT" value={draft.ciot} onChange={(event) => updateDraft('ciot', event.target.value)} placeholder="Gerar na ANTT/IPEF" />
                    <Input label="RNTRC" value={draft.rntrc} onChange={(event) => updateDraft('rntrc', event.target.value)} placeholder="Registro ANTT" />
                    <Input label="Valor pago (frete)" type="number" step="0.01" min="0" value={payment.amount || ''} onChange={(event) => updatePayment('amount', Number(event.target.value))} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Beneficiario" value={payment.payeeName} onChange={(event) => updatePayment('payeeName', event.target.value)} placeholder="Nome do TAC" />
                    <Input label="CPF/CNPJ do beneficiario" value={payment.payeeDocument} onChange={(event) => updatePayment('payeeDocument', event.target.value)} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Input label="Banco" value={payment.bankName} onChange={(event) => updatePayment('bankName', event.target.value)} />
                    <Input label="Agencia" value={payment.bankBranch} onChange={(event) => updatePayment('bankBranch', event.target.value)} />
                    <Input label="Conta" value={payment.bankAccount} onChange={(event) => updatePayment('bankAccount', event.target.value)} />
                    <Input label="Chave PIX" value={payment.pixKey} onChange={(event) => updatePayment('pixKey', event.target.value)} />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <Input label="Chave de acesso" value={draft.accessKey} onChange={(event) => updateDraft('accessKey', event.target.value)} placeholder="44 digitos" maxLength={60} />

          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Protocolo" value={draft.protocol} onChange={(event) => updateDraft('protocol', event.target.value)} />
            <Input label="Provider" value={draft.provider} onChange={(event) => updateDraft('provider', event.target.value)} placeholder="Nuvem Fiscal, Focus..." />
            <Input label="ID externo" value={draft.providerDocumentId} onChange={(event) => updateDraft('providerDocumentId', event.target.value)} />
          </div>

          <Input label="Observacoes" value={draft.notes} onChange={(event) => updateDraft('notes', event.target.value)} placeholder="Observacoes fiscais ou operacionais" />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar documento'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(documentToDelete)}
        tone="danger"
        title="Excluir documento fiscal"
        message={documentToDelete ? `Excluir ${documentLabel(documentToDelete)}? Apenas rascunhos, rejeitados ou erros podem ser removidos.` : ''}
        confirmLabel="Excluir"
        isLoading={deleteDocument.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDocumentToDelete(null)}
      />
    </div>
  );
}
