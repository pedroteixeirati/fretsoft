import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Edit2, Loader2, MapPinned, Plus, Route, Trash2, Wallet } from 'lucide-react';
import Modal from '../components/Modal';
import { useFirebase } from '../context/FirebaseContext';
import { freightsApi, vehiclesApi } from '../lib/api';
import { canAccess } from '../lib/permissions';
import { Freight, Vehicle } from '../types';

const initialFormData = {
  vehicleId: '',
  plate: '',
  date: '',
  route: '',
  amount: '',
};

export default function Freights() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'freights', 'create');
  const canUpdate = canAccess(userProfile, 'freights', 'update');
  const canDelete = canAccess(userProfile, 'freights', 'delete');
  const [freights, setFreights] = useState<Freight[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFreight, setEditingFreight] = useState<Freight | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const loadData = async () => {
    setLoading(true);
    try {
      const [freightsData, vehiclesData] = await Promise.all([freightsApi.list(), vehiclesApi.list()]);
      setFreights(freightsData);
      setVehicles(vehiclesData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRevenue = useMemo(() => freights.reduce((acc, freight) => acc + Number(freight.amount || 0), 0), [freights]);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingFreight(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === formData.vehicleId);
    const payload = {
      vehicleId: formData.vehicleId,
      plate: selectedVehicle?.plate || formData.plate,
      date: formData.date,
      route: formData.route.trim(),
      amount: Number(formData.amount),
    };

    setIsSubmitting(true);
    try {
      if (editingFreight) {
        await freightsApi.update(editingFreight.id, payload);
      } else {
        await freightsApi.create(payload as Omit<Freight, 'id'>);
      }
      await loadData();
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (freight: Freight) => {
    const linkedVehicle = vehicles.find((vehicle) => vehicle.plate === freight.plate);
    setEditingFreight(freight);
    setFormData({
      vehicleId: linkedVehicle?.id || freight.vehicleId,
      plate: freight.plate,
      date: freight.date,
      route: freight.route,
      amount: String(freight.amount),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja excluir este frete?')) return;
    await freightsApi.remove(id);
    await loadData();
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Operação avulsa</p>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mt-2">Fretes</h1>
          <p className="text-on-surface-variant mt-2 max-w-3xl">Registre viagens independentes de contrato com placa, data, rota e valor do frete realizado por cada caminhão.</p>
        </div>
          {canCreate && (
            <button onClick={() => setIsModalOpen(true)} className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5" />
              Novo frete
            </button>
          )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        <Card label="Fretes lançados" value={freights.length.toString()} />
        <Card label="Receita total de fretes" value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
        <Card label="Caminhões com viagens" value={new Set(freights.map((freight) => freight.plate)).size.toString()} />
        <Card label="Último frete" value={freights[0]?.date ? new Date(freights[0].date).toLocaleDateString('pt-BR') : '-'} />
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-on-surface-variant font-medium">Carregando fretes...</p>
        </div>
      ) : freights.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-12 text-center">
          <Route className="w-14 h-14 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-on-surface">Nenhum frete cadastrado</h3>
          <p className="text-on-surface-variant mt-2 max-w-xl mx-auto">Lance aqui os fretes avulsos realizados pela transportadora, mesmo quando não houver contrato vinculado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {freights.map((freight) => (
            <article key={freight.id} className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-7 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-2">Placa {freight.plate}</p>
                  <h2 className="text-2xl font-bold text-on-surface">{freight.route}</h2>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-container text-on-primary-container">Frete</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Box label="Data" value={new Date(freight.date).toLocaleDateString('pt-BR')} />
                <Box label="Placa" value={freight.plate} />
                <Box label="Valor" value={`R$ ${Number(freight.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </div>

              <div className="space-y-3 text-sm text-on-surface-variant mb-6">
                <p className="flex items-center gap-2"><MapPinned className="w-4 h-4 text-primary" /> Rota: {freight.route}</p>
                <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /> Viagem em {new Date(freight.date).toLocaleDateString('pt-BR')}</p>
                <p className="flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" /> Receita do frete: R$ {Number(freight.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>

                {(canUpdate || canDelete) && (
                  <div className="pt-5 border-t border-outline-variant flex items-center justify-end gap-3">
                    {canUpdate && (
                      <button onClick={() => handleEdit(freight)} className="px-4 py-2 rounded-full text-sm font-bold text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"><Edit2 className="w-4 h-4" />Editar</button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(freight.id)} className="px-4 py-2 rounded-full text-sm font-bold text-error hover:bg-error/10 transition-colors flex items-center gap-2"><Trash2 className="w-4 h-4" />Excluir</button>
                    )}
                  </div>
                )}
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={resetForm} title={editingFreight ? 'Editar frete' : 'Novo frete'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Placa</label>
              <select required className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" value={formData.vehicleId} onChange={(e) => {
                const selectedVehicle = vehicles.find((vehicle) => vehicle.id === e.target.value);
                setFormData({ ...formData, vehicleId: e.target.value, plate: selectedVehicle?.plate || '' });
              }}>
                <option value="">Selecione um caminhão</option>
                {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} - {vehicle.name}</option>)}
              </select>
            </div>
            <Field label="Data" type="date" value={formData.date} onChange={(value) => setFormData({ ...formData, date: value })} />
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Rota</label>
              <input required type="text" className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Ex: Campinas/SP x Belo Horizonte/MG" value={formData.route} onChange={(e) => setFormData({ ...formData, route: e.target.value })} />
            </div>
            <Field label="Valor do frete" type="number" value={formData.amount} onChange={(value) => setFormData({ ...formData, amount: value })} />
          </div>
          {vehicles.length === 0 && <div className="bg-tertiary-container/20 text-on-surface rounded-2xl p-4 text-sm">Cadastre ao menos um caminhão em Veículos para lançar um frete com placa vinculada.</div>}
          <div className="pt-6 flex justify-end gap-4">
            <button type="button" onClick={resetForm} className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Cancelar</button>
            <button disabled={isSubmitting || vehicles.length === 0 || !formData.vehicleId} type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {editingFreight ? 'Salvar alterações' : 'Cadastrar frete'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant shadow-sm"><p className="text-sm font-medium text-on-surface-variant mb-2">{label}</p><p className="text-3xl font-black text-on-surface">{value}</p></div>;
}

function Box({ label, value }: { label: string; value: string }) {
  return <div className="bg-surface-container rounded-2xl p-4"><p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">{label}</p><p className="text-base font-black text-on-surface">{value}</p></div>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
      <input required min={type === 'number' ? 0 : undefined} step={type === 'number' ? '0.01' : undefined} type={type} className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
