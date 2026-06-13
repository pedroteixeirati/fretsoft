import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bus, Clock, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { getErrorMessage } from '../../../lib/errors';
import { canAccess } from '../../../lib/permissions';
import { useFirebase } from '../../../context/FirebaseContext';

function isValidTimeInput(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
}
import Alert from '../../../shared/ui/Alert';
import Modal from '../../../components/Modal';
import CustomSelect from '../../../components/CustomSelect';
import Input from '../../../shared/ui/Input';
import { FieldLabel } from '../../../shared/forms';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import { queryKeys } from '../../../shared/lib/query-keys';
import { companiesApi } from '../../companies/services/companies.api';
import { vehiclesApi } from '../../vehicles/services/vehicles.api';
import { driversApi } from '../../drivers/services/drivers.api';
import { TransportLinePayload, useTransportLines } from '../hooks/useTransportLines';
import { TransportLine, TransportLineShift, shiftLabels } from '../types/transport-line.types';

const emptyForm: TransportLinePayload = {
  lineCode: '', clientName: '', companyId: '', vehicleId: '', driverId: '',
  shift: 'manha', departureTime: '', origin: '', destination: '', side: '', seats: null, status: 'active', notes: '',
};

export default function TransportLinesPage() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'transportLines', 'create');
  const canUpdate = canAccess(userProfile, 'transportLines', 'update');
  const canDelete = canAccess(userProfile, 'transportLines', 'delete');
  const enabled = Boolean(userProfile);

  const { lines, isLoading, error, createLine, updateLine, deleteLine } = useTransportLines(enabled);
  const companiesQuery = useQuery({ queryKey: queryKeys.companies.list(), queryFn: companiesApi.list, enabled });
  const vehiclesQuery = useQuery({ queryKey: queryKeys.vehicles.list(), queryFn: vehiclesApi.list, enabled });
  const driversQuery = useQuery({ queryKey: ['drivers', 'list'], queryFn: driversApi.list, enabled });

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TransportLine | null>(null);
  const [form, setForm] = useState<TransportLinePayload>(emptyForm);
  const [shiftFilter, setShiftFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<TransportLine | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);

  const companies = companiesQuery.data ?? [];
  const vehicles = vehiclesQuery.data ?? [];
  const drivers = driversQuery.data ?? [];

  const filtered = useMemo(
    () => lines.filter((l) => {
      const s = search.toLowerCase();
      const matchesSearch = !s || l.lineCode.toLowerCase().includes(s) || (l.companyName || l.clientName).toLowerCase().includes(s) || l.vehiclePlate.toLowerCase().includes(s) || l.driverName.toLowerCase().includes(s);
      const matchesShift = shiftFilter === 'all' || l.shift === shiftFilter;
      return matchesSearch && matchesShift;
    }),
    [lines, search, shiftFilter],
  );

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFeedback(null); setIsOpen(true); };
  const openEdit = (line: TransportLine) => {
    setEditing(line);
    setForm({ lineCode: line.lineCode, clientName: line.clientName, companyId: line.companyId, vehicleId: line.vehicleId, driverId: line.driverId, shift: line.shift, departureTime: line.departureTime, origin: line.origin, destination: line.destination, side: line.side, seats: line.seats, status: line.status, notes: line.notes });
    setFeedback(null);
    setIsOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.departureTime && !isValidTimeInput(form.departureTime)) {
      setFeedback({ tone: 'danger', message: 'Informe um horario valido (HH:MM).' });
      return;
    }
    if (!form.companyId && !form.clientName.trim()) {
      setFeedback({ tone: 'danger', message: 'Selecione o cliente cadastrado ou informe o nome.' });
      return;
    }
    try {
      if (editing) await updateLine.mutateAsync({ id: editing.id, payload: form });
      else await createLine.mutateAsync(form);
      setIsOpen(false);
      setFeedback({ tone: 'success', message: editing ? 'Linha atualizada.' : 'Linha criada.' });
    } catch (submitError) {
      setFeedback({ tone: 'danger', message: getErrorMessage(submitError, 'Nao foi possivel salvar a linha.') });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteLine.mutateAsync(deleting.id);
      setDeleting(null);
      setFeedback({ tone: 'success', message: 'Linha excluida.' });
    } catch (deleteError) {
      setDeleting(null);
      setFeedback({ tone: 'danger', message: getErrorMessage(deleteError, 'Nao foi possivel excluir.') });
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Escala de Linhas</h1>
          <p className="mt-2 text-on-secondary-container">Organize as linhas de fretamento: onibus, motorista, cliente, turno e horario.</p>
        </div>
        {canCreate ? (
          <button type="button" onClick={openCreate} className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-all hover:shadow-md">
            <Plus className="h-5 w-5" /> NOVA LINHA
          </button>
        ) : null}
      </div>

      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}
      {error ? <Alert tone="danger">{getErrorMessage(error, 'Nao foi possivel carregar a escala.')}</Alert> : null}

      <div className="flex flex-1 flex-col md:flex-row gap-4">
        <div className="flex-1 bg-surface-container-lowest rounded-xl p-2 flex items-center shadow-sm">
          <input type="text" placeholder="Buscar por linha, cliente, placa ou motorista..." className="w-full border-none focus:ring-0 bg-transparent text-on-surface text-sm py-2 px-4 placeholder:text-outline/60" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="px-2">
            <CustomSelect value={shiftFilter} onChange={setShiftFilter} variant="inline" options={[{ value: 'all', label: 'Todos os turnos' }, { value: 'manha', label: 'Manha' }, { value: 'tarde', label: 'Tarde' }, { value: 'noite', label: 'Noite' }, { value: 'integral', label: 'Integral' }]} />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-surface-container-low p-1">
        <div className="min-h-[300px] rounded-lg bg-surface-container-lowest p-4 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-outline/40"><Bus className="h-10 w-10" /></div>
              <h4 className="text-xl font-bold text-on-surface">Nenhuma linha na escala</h4>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((line) => (
                <div key={line.id} className="group flex flex-col gap-3 rounded-xl p-3 transition-all hover:bg-primary-fixed-dim/10 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3 sm:flex-1 sm:items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary"><Bus className="h-6 w-6" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {line.lineCode ? <span className="text-sm font-bold font-headline text-on-surface">{line.lineCode}</span> : null}
                        <span className="text-sm font-bold text-on-surface">{line.companyName || line.clientName || 'Cliente'}</span>
                        <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">{shiftLabels[line.shift]}</span>
                        {line.status === 'inactive' ? <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase text-on-surface-variant">Inativa</span> : null}
                      </div>
                      <p className="mt-1 text-xs text-on-secondary-container">
                        {line.vehiclePlate ? `${line.vehiclePlate} • ` : ''}{line.driverName ? `${line.driverName} • ` : ''}
                        {line.destination || line.origin || ''}{line.side ? ` (${line.side})` : ''}
                        {line.seats !== null ? ` • ${line.seats} lugares` : ''}
                      </p>
                    </div>
                  </div>
                  {line.departureTime ? (
                    <div className="flex items-center gap-1 text-sm font-bold text-on-surface sm:mr-4"><Clock className="h-4 w-4 text-primary" /> {line.departureTime}</div>
                  ) : null}
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    {canUpdate ? <button type="button" aria-label="Editar" onClick={() => openEdit(line)} className="p-2 text-outline hover:text-on-surface"><Pencil className="h-5 w-5" /></button> : null}
                    {canDelete ? <button type="button" aria-label="Excluir" onClick={() => setDeleting(line)} className="p-2 text-outline hover:text-error"><Trash2 className="h-5 w-5" /></button> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Editar linha' : 'Nova linha'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Codigo / identificacao da linha" value={form.lineCode} onChange={(e) => setForm((c) => ({ ...c, lineCode: e.target.value }))} placeholder="Ex: 1 17/22" />
            <div className="space-y-2">
              <FieldLabel>Turno</FieldLabel>
              <CustomSelect value={form.shift} onChange={(value) => setForm((c) => ({ ...c, shift: value as TransportLineShift }))} options={[{ value: 'manha', label: 'Manha' }, { value: 'tarde', label: 'Tarde' }, { value: 'noite', label: 'Noite' }, { value: 'integral', label: 'Integral' }]} />
            </div>
            <div className="space-y-2">
              <FieldLabel>Cliente cadastrado</FieldLabel>
              <CustomSelect value={form.companyId} onChange={(value) => setForm((c) => ({ ...c, companyId: value }))} options={[{ value: '', label: 'Nao vincular (usar nome abaixo)' }, ...companies.map((co) => ({ value: co.id, label: co.corporateName }))]} />
            </div>
            <Input label="Cliente (nome livre)" value={form.clientName} onChange={(e) => setForm((c) => ({ ...c, clientName: e.target.value }))} placeholder="Se nao cadastrado" />
            <div className="space-y-2">
              <FieldLabel>Veiculo</FieldLabel>
              <CustomSelect value={form.vehicleId} onChange={(value) => setForm((c) => ({ ...c, vehicleId: value }))} options={[{ value: '', label: 'Sem veiculo' }, ...vehicles.map((v) => ({ value: v.id, label: `${v.plate} — ${v.name}` }))]} />
            </div>
            <div className="space-y-2">
              <FieldLabel>Motorista</FieldLabel>
              <CustomSelect value={form.driverId} onChange={(value) => setForm((c) => ({ ...c, driverId: value }))} options={[{ value: '', label: 'Sem motorista' }, ...drivers.map((d) => ({ value: d.id, label: d.name }))]} />
            </div>
            <Input label="Horario de saida (HH:MM)" value={form.departureTime} onChange={(e) => setForm((c) => ({ ...c, departureTime: e.target.value }))} placeholder="05:30" />
            <Input label="Lugares" type="number" value={form.seats !== null ? String(form.seats) : ''} onChange={(e) => setForm((c) => ({ ...c, seats: e.target.value.trim() === '' ? null : Number(e.target.value) }))} />
            <Input label="Origem / ponto" value={form.origin} onChange={(e) => setForm((c) => ({ ...c, origin: e.target.value }))} placeholder="Opcional" />
            <Input label="Destino" value={form.destination} onChange={(e) => setForm((c) => ({ ...c, destination: e.target.value }))} placeholder="Opcional" />
            <Input label="Lado / regiao" value={form.side} onChange={(e) => setForm((c) => ({ ...c, side: e.target.value }))} placeholder="Ex: JK / Itapua" />
            <div className="space-y-2">
              <FieldLabel>Status</FieldLabel>
              <CustomSelect value={form.status} onChange={(value) => setForm((c) => ({ ...c, status: value as TransportLine['status'] }))} options={[{ value: 'active', label: 'Ativa' }, { value: 'inactive', label: 'Inativa' }]} />
            </div>
            <div className="md:col-span-2">
              <Input label="Observacoes" value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Cancelar</button>
            <button type="submit" disabled={createLine.isPending || updateLine.isPending} className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 disabled:opacity-50">
              {createLine.isPending || updateLine.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {editing ? 'Salvar' : 'Criar linha'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleting)} title="Excluir linha" message={deleting ? `Excluir a linha "${deleting.lineCode || deleting.companyName || deleting.clientName}"?` : ''} confirmLabel="Excluir" variant="danger" isLoading={deleteLine.isPending} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
