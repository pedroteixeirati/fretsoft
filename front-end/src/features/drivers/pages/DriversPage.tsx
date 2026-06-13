import React, { useMemo, useState } from 'react';
import { IdCard, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { getErrorMessage } from '../../../lib/errors';
import { canAccess } from '../../../lib/permissions';
import { isValidDateInput } from '../../../lib/validation';
import { useFirebase } from '../../../context/FirebaseContext';
import Alert from '../../../shared/ui/Alert';
import Modal from '../../../components/Modal';
import CustomSelect from '../../../components/CustomSelect';
import Input from '../../../shared/ui/Input';
import { FieldLabel, FormDatePicker } from '../../../shared/forms';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import { DriverPayload, useDrivers } from '../hooks/useDrivers';
import { Driver } from '../types/driver.types';

const emptyForm: DriverPayload = { name: '', cpf: '', cnhNumber: '', cnhCategory: '', cnhExpiresOn: '', phone: '', status: 'active', notes: '' };

export default function DriversPage() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'drivers', 'create');
  const canUpdate = canAccess(userProfile, 'drivers', 'update');
  const canDelete = canAccess(userProfile, 'drivers', 'delete');

  const { drivers, isLoading, error, createDriver, updateDriver, deleteDriver } = useDrivers(Boolean(userProfile));
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState<DriverPayload>(emptyForm);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<Driver | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);

  const filtered = useMemo(
    () => drivers.filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.cpf.includes(search)),
    [drivers, search],
  );

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFeedback(null); setIsOpen(true); };
  const openEdit = (driver: Driver) => {
    setEditing(driver);
    setForm({ name: driver.name, cpf: driver.cpf, cnhNumber: driver.cnhNumber, cnhCategory: driver.cnhCategory, cnhExpiresOn: driver.cnhExpiresOn, phone: driver.phone, status: driver.status, notes: driver.notes });
    setFeedback(null);
    setIsOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.cnhExpiresOn && !isValidDateInput(form.cnhExpiresOn)) {
      setFeedback({ tone: 'danger', message: 'Informe uma validade de CNH valida.' });
      return;
    }
    try {
      if (editing) await updateDriver.mutateAsync({ id: editing.id, payload: form });
      else await createDriver.mutateAsync(form);
      setIsOpen(false);
      setFeedback({ tone: 'success', message: editing ? 'Motorista atualizado.' : 'Motorista cadastrado.' });
    } catch (submitError) {
      setFeedback({ tone: 'danger', message: getErrorMessage(submitError, 'Nao foi possivel salvar o motorista.') });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteDriver.mutateAsync(deleting.id);
      setDeleting(null);
      setFeedback({ tone: 'success', message: 'Motorista excluido.' });
    } catch (deleteError) {
      setDeleting(null);
      setFeedback({ tone: 'danger', message: getErrorMessage(deleteError, 'Nao foi possivel excluir.') });
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Motoristas</h1>
          <p className="mt-2 text-on-secondary-container">Cadastro de motoristas da frota, com CNH e contato, para uso na escala de fretamento.</p>
        </div>
        {canCreate ? (
          <button type="button" onClick={openCreate} className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-all hover:shadow-md">
            <Plus className="h-5 w-5" /> NOVO MOTORISTA
          </button>
        ) : null}
      </div>

      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}
      {error ? <Alert tone="danger">{getErrorMessage(error, 'Nao foi possivel carregar os motoristas.')}</Alert> : null}

      <div className="bg-surface-container-lowest rounded-xl p-2 flex items-center shadow-sm">
        <input type="text" placeholder="Buscar por nome ou CPF..." className="w-full border-none focus:ring-0 bg-transparent text-on-surface text-sm py-2 px-4 placeholder:text-outline/60" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-xl bg-surface-container-low p-1">
        <div className="min-h-[300px] rounded-lg bg-surface-container-lowest p-4 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-outline/40"><IdCard className="h-10 w-10" /></div>
              <h4 className="text-xl font-bold text-on-surface">Nenhum motorista cadastrado</h4>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((driver) => (
                <div key={driver.id} className="group flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-primary-fixed-dim/10">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary"><IdCard className="h-6 w-6" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold font-headline text-on-surface">{driver.name}</span>
                      {driver.status === 'inactive' ? <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase text-on-surface-variant">Inativo</span> : null}
                    </div>
                    <p className="mt-1 text-xs text-on-secondary-container">
                      {driver.cnhNumber ? `CNH ${driver.cnhNumber}${driver.cnhCategory ? ` (${driver.cnhCategory})` : ''}` : 'Sem CNH'}
                      {driver.cnhExpiresOn ? ` • vence ${driver.cnhExpiresOn.split('-').reverse().join('/')}` : ''}
                      {driver.phone ? ` • ${driver.phone}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {canUpdate ? <button type="button" aria-label="Editar" onClick={() => openEdit(driver)} className="p-2 text-outline hover:text-on-surface"><Pencil className="h-5 w-5" /></button> : null}
                    {canDelete ? <button type="button" aria-label="Excluir" onClick={() => setDeleting(driver)} className="p-2 text-outline hover:text-error"><Trash2 className="h-5 w-5" /></button> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Editar motorista' : 'Novo motorista'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input label="Nome" required value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} />
            </div>
            <Input label="CPF" value={form.cpf} onChange={(e) => setForm((c) => ({ ...c, cpf: e.target.value }))} placeholder="Opcional" />
            <Input label="Telefone" value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} placeholder="Opcional" />
            <Input label="Numero da CNH" value={form.cnhNumber} onChange={(e) => setForm((c) => ({ ...c, cnhNumber: e.target.value }))} placeholder="Opcional" />
            <Input label="Categoria CNH" value={form.cnhCategory} onChange={(e) => setForm((c) => ({ ...c, cnhCategory: e.target.value }))} placeholder="Ex: D" />
            <FormDatePicker label="Validade da CNH" value={form.cnhExpiresOn} onChange={(value) => setForm((c) => ({ ...c, cnhExpiresOn: value }))} />
            <div className="space-y-2">
              <FieldLabel>Status</FieldLabel>
              <CustomSelect value={form.status} onChange={(value) => setForm((c) => ({ ...c, status: value as Driver['status'] }))} options={[{ value: 'active', label: 'Ativo' }, { value: 'inactive', label: 'Inativo' }]} />
            </div>
            <div className="md:col-span-2">
              <Input label="Observacoes" value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Cancelar</button>
            <button type="submit" disabled={createDriver.isPending || updateDriver.isPending || !form.name.trim()} className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 disabled:opacity-50">
              {createDriver.isPending || updateDriver.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {editing ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleting)} title="Excluir motorista" message={deleting ? `Excluir "${deleting.name}"?` : ''} confirmLabel="Excluir" variant="danger" isLoading={deleteDriver.isPending} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
