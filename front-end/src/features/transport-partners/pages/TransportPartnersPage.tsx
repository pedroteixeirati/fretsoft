import React, { useMemo, useState } from 'react';
import { Pencil, Search, Trash2, UserPlus } from 'lucide-react';
import { useFirebase } from '../../../context/FirebaseContext';
import { getErrorMessage } from '../../../lib/errors';
import { canAccess } from '../../../lib/permissions';
import { Alert, Button, ConfirmDialog, DataTable, Input, Modal, PageHeader, Select, type DataTableColumn } from '../../../shared/ui';
import { useTransportPartnersQuery } from '../hooks/useTransportPartnersQuery';
import { useTransportPartnerMutations } from '../hooks/useTransportPartnerMutations';
import type { TransportPartner, TransportPartnerDraft, TransportPartnerStatus, TransportPartnerType } from '../types/transport-partner.types';

const typeLabels: Record<TransportPartnerType, string> = {
  tac: 'TAC (autônomo)',
  agregado: 'Agregado',
};

const statusLabels: Record<TransportPartnerStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
};

const emptyDraft: TransportPartnerDraft = {
  name: '',
  documentNumber: '',
  partnerType: 'tac',
  rntrc: '',
  bankName: '',
  bankBranch: '',
  bankAccount: '',
  bankAccountType: '',
  pixKey: '',
  pixKeyType: '',
  status: 'active',
  notes: '',
};

export default function TransportPartnersPage() {
  const { user, userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'transportPartners', 'create');
  const canUpdate = canAccess(userProfile, 'transportPartners', 'update');
  const canDelete = canAccess(userProfile, 'transportPartners', 'delete');
  const { partners, isLoading, error } = useTransportPartnersQuery(Boolean(user));
  const { createPartner, updatePartner, deletePartner, isSubmitting } = useTransportPartnerMutations();

  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<TransportPartner | null>(null);
  const [draft, setDraft] = useState<TransportPartnerDraft>(emptyDraft);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [partnerToDelete, setPartnerToDelete] = useState<TransportPartner | null>(null);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return partners.filter((partner) =>
      partner.name.toLowerCase().includes(term) ||
      partner.documentNumber.toLowerCase().includes(term) ||
      partner.rntrc.toLowerCase().includes(term),
    );
  }, [partners, searchTerm]);

  const update = <K extends keyof TransportPartnerDraft>(key: K, value: TransportPartnerDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setSubmitError('');
    setIsModalOpen(true);
  };

  const openEdit = (partner: TransportPartner) => {
    setEditing(partner);
    setDraft({
      name: partner.name,
      documentNumber: partner.documentNumber,
      partnerType: partner.partnerType,
      rntrc: partner.rntrc,
      bankName: partner.bankName,
      bankBranch: partner.bankBranch,
      bankAccount: partner.bankAccount,
      bankAccountType: partner.bankAccountType,
      pixKey: partner.pixKey,
      pixKeyType: partner.pixKeyType,
      status: partner.status,
      notes: partner.notes,
    });
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    if (draft.name.trim().length < 2 || !draft.documentNumber.trim()) {
      setSubmitError('Informe nome e documento (CPF/CNPJ) do transportador.');
      return;
    }

    try {
      if (editing) {
        await updatePartner.mutateAsync({ id: editing.id, payload: draft });
      } else {
        await createPartner.mutateAsync(draft);
      }
      setSuccessMessage(editing ? 'Transportador atualizado com sucesso.' : 'Transportador cadastrado com sucesso.');
      setIsModalOpen(false);
    } catch (mutationError) {
      setSubmitError(getErrorMessage(mutationError, 'Nao foi possivel salvar o transportador.'));
    }
  };

  const confirmDelete = async () => {
    if (!partnerToDelete) return;
    try {
      setSubmitError('');
      await deletePartner.mutateAsync(partnerToDelete.id);
      setSuccessMessage('Transportador excluido com sucesso.');
      setPartnerToDelete(null);
    } catch (deleteError) {
      setPartnerToDelete(null);
      setSubmitError(getErrorMessage(deleteError, 'Nao foi possivel excluir o transportador.'));
    }
  };

  const columns: Array<DataTableColumn<TransportPartner>> = [
    { id: 'name', header: 'Nome', cell: (partner) => <span className="text-sm font-bold text-on-surface">{partner.name}</span> },
    { id: 'document', header: 'Documento', cell: (partner) => <span className="text-sm text-on-surface">{partner.documentNumber}</span> },
    { id: 'type', header: 'Tipo', cell: (partner) => <span className="text-sm text-on-surface">{typeLabels[partner.partnerType]}</span> },
    { id: 'rntrc', header: 'RNTRC', cell: (partner) => <span className="text-sm text-on-surface">{partner.rntrc || '-'}</span> },
    { id: 'status', header: 'Status', cell: (partner) => <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface">{statusLabels[partner.status]}</span> },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (partner) => (
        <div className="flex justify-end gap-2">
          {canUpdate ? (
            <button type="button" aria-label={`Editar ${partner.name}`} onClick={() => openEdit(partner)} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container">
              <Pencil className="h-4 w-4" />
            </button>
          ) : null}
          {canDelete ? (
            <button type="button" aria-label={`Excluir ${partner.name}`} onClick={() => setPartnerToDelete(partner)} className="rounded-full p-2 text-error hover:bg-error/10">
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
        title="Transportadores (TAC)"
        description="Cadastro de transportadores autonomos e agregados: documento, RNTRC e dados bancarios/PIX para CIOT e pagamento de frete."
        actions={canCreate ? <Button onClick={openCreate}><UserPlus className="h-4 w-4" /> Novo transportador</Button> : null}
      />

      {error ? <Alert tone="danger">{getErrorMessage(error, 'Nao foi possivel carregar os transportadores.')}</Alert> : null}
      {submitError && !isModalOpen ? <Alert tone="danger">{submitError}</Alert> : null}
      {successMessage ? <Alert tone="success">{successMessage}</Alert> : null}

      <DataTable
        rows={filtered}
        columns={columns}
        getRowKey={(partner) => partner.id}
        loading={isLoading}
        emptyLabel="Nenhum transportador cadastrado."
        summary={`${filtered.length} transportador(es)`}
        toolbar={(
          <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por nome, documento ou RNTRC" leftIcon={<Search className="h-4 w-4" />} />
        )}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? `Editar ${editing.name}` : 'Novo transportador'}
        subtitle="Dados usados na geracao de CIOT e no pagamento de frete ao transportador."
        panelClassName="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Nome" value={draft.name} onChange={(event) => update('name', event.target.value)} placeholder="Nome do transportador" required />
            <Input label="CPF / CNPJ" value={draft.documentNumber} onChange={(event) => update('documentNumber', event.target.value)} placeholder="Somente numeros (CNPJ aceita letras)" required />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <span className="mb-1 block text-sm font-medium text-on-surface-variant">Tipo</span>
              <Select
                value={draft.partnerType}
                onChange={(value) => update('partnerType', value as TransportPartnerType)}
                options={[
                  { value: 'tac', label: typeLabels.tac },
                  { value: 'agregado', label: typeLabels.agregado },
                ]}
                placeholder="Tipo"
              />
            </div>
            <Input label="RNTRC" value={draft.rntrc} onChange={(event) => update('rntrc', event.target.value)} placeholder="Registro ANTT" />
            <div>
              <span className="mb-1 block text-sm font-medium text-on-surface-variant">Status</span>
              <Select
                value={draft.status}
                onChange={(value) => update('status', value as TransportPartnerStatus)}
                options={[
                  { value: 'active', label: statusLabels.active },
                  { value: 'inactive', label: statusLabels.inactive },
                ]}
                placeholder="Status"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Input label="Banco" value={draft.bankName} onChange={(event) => update('bankName', event.target.value)} placeholder="Banco" />
            <Input label="Agencia" value={draft.bankBranch} onChange={(event) => update('bankBranch', event.target.value)} placeholder="0000" />
            <Input label="Conta" value={draft.bankAccount} onChange={(event) => update('bankAccount', event.target.value)} placeholder="00000-0" />
            <Input label="Tipo de conta" value={draft.bankAccountType} onChange={(event) => update('bankAccountType', event.target.value)} placeholder="Corrente" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Chave PIX" value={draft.pixKey} onChange={(event) => update('pixKey', event.target.value)} placeholder="Chave PIX" />
            <Input label="Tipo de chave PIX" value={draft.pixKeyType} onChange={(event) => update('pixKeyType', event.target.value)} placeholder="CPF, e-mail, telefone, aleatoria" />
          </div>

          <Input label="Observacoes" value={draft.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Observacoes" />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar transportador'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(partnerToDelete)}
        tone="danger"
        title="Excluir transportador"
        message={partnerToDelete ? `Excluir ${partnerToDelete.name}? Esta acao nao pode ser desfeita.` : ''}
        confirmLabel="Excluir"
        isLoading={deletePartner.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPartnerToDelete(null)}
      />
    </div>
  );
}
