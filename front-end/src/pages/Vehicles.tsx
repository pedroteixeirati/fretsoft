import React, { useEffect, useMemo, useState } from 'react';
import { Car, Filter, Loader2, MoreVertical, Plus, Search, Trash2, Truck } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import Modal from '../components/Modal';
import { useFirebase } from '../context/FirebaseContext';
import { vehiclesApi } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { canAccess } from '../lib/permissions';
import { Vehicle } from '../types';

const defaultFormData = {
  name: '',
  plate: '',
  driver: '',
  type: 'Carga Pesada',
  km: 0,
  nextMaintenance: '',
  status: 'active' as const,
};

export default function Vehicles() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'vehicles', 'create');
  const canUpdate = canAccess(userProfile, 'vehicles', 'update');
  const canDelete = canAccess(userProfile, 'vehicles', 'delete');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState(defaultFormData);

  const loadVehicles = async () => {
    setLoading(true);
    setLoadError('');
    try {
      setVehicles(await vehiclesApi.list());
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Nao foi possivel carregar os veiculos.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVehicles();
  }, []);

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter((vehicle) =>
        (vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (typeFilter === 'all' || vehicle.type === typeFilter) &&
        (statusFilter === 'all' || vehicle.status === statusFilter)
      ),
    [vehicles, searchTerm, typeFilter, statusFilter]
  );

  const resetForm = () => {
    setEditingVehicle(null);
    setFormData(defaultFormData);
    setSubmitError('');
    setIsModalOpen(false);
  };

  const handleOpenCreate = () => {
    setSubmitError('');
    setSubmitSuccess('');
    setEditingVehicle(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSubmitError('');
    setSubmitSuccess('');
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      plate: vehicle.plate,
      driver: vehicle.driver,
      type: vehicle.type,
      km: vehicle.km,
      nextMaintenance: vehicle.nextMaintenance || '',
      status: vehicle.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    const payload = {
      ...formData,
      name: formData.name.trim(),
      plate: formData.plate.toUpperCase().trim(),
      driver: formData.driver.trim(),
    };

    try {
      if (editingVehicle) {
        await vehiclesApi.update(editingVehicle.id, payload);
      } else {
        await vehiclesApi.create(payload as Omit<Vehicle, 'id'>);
      }

      await loadVehicles();
      setSubmitSuccess(editingVehicle ? 'Veiculo atualizado com sucesso.' : 'Veiculo cadastrado com sucesso.');
      resetForm();
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar o veiculo.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este veiculo?')) return;

    setSubmitError('');
    setSubmitSuccess('');
    try {
      await vehiclesApi.remove(id);
      await loadVehicles();
      setSubmitSuccess('Veiculo excluido com sucesso.');
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel excluir o veiculo.'));
    }
  };

  const feedbackMessage = submitError || loadError || submitSuccess;
  const feedbackIsError = Boolean(submitError || loadError);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Gestao de Cadastros</h1>
          <p className="text-on-secondary-container mt-2">Gerencie suas entidades de frota, fornecedores e categorias de custos operacionais em um so lugar.</p>
        </div>
        {canCreate && (
          <button onClick={handleOpenCreate} className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" />
            NOVO CADASTRO
          </button>
        )}
      </div>

      {feedbackMessage && (
        <div className={`rounded-2xl border px-5 py-4 text-sm font-medium ${feedbackIsError ? 'border-error/20 bg-error/5 text-error' : 'border-primary/20 bg-primary/5 text-primary'}`}>
          {feedbackMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-surface-container-lowest rounded-xl p-2 flex items-center shadow-sm focus-within:shadow-md transition-shadow">
            <Search className="w-5 h-5 text-outline ml-3" />
            <input
              type="text"
              placeholder="Buscar por placa, modelo ou motorista..."
              className="w-full border-none focus:ring-0 bg-transparent text-on-surface text-sm py-2 px-4 placeholder:text-outline/60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="h-6 w-px bg-outline/20 mx-2" />
            <div className="flex items-center gap-2 px-2">
              <CustomSelect
                value={typeFilter}
                onChange={setTypeFilter}
                variant="inline"
                options={[
                  { value: 'all', label: 'Todos os tipos' },
                  { value: 'Carga Pesada', label: 'Carga Pesada' },
                  { value: 'Longo Percurso', label: 'Longo Percurso' },
                  { value: 'Utilitario', label: 'Utilitario' },
                  { value: 'Executivo', label: 'Executivo' },
                ]}
              />
              <div className="h-6 w-px bg-outline/20 mx-2" />
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                variant="inline"
                options={[
                  { value: 'all', label: 'Todos os status' },
                  { value: 'active', label: 'Ativo' },
                  { value: 'maintenance', label: 'Manutencao' },
                  { value: 'alert', label: 'Alerta' },
                ]}
              />
              <Filter className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 bg-surface-container-low rounded-xl p-1">
          <div className="bg-surface-container-lowest rounded-lg p-6 h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-lg text-on-surface">Ativos da Frota</h3>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-on-surface-variant font-medium">Carregando veiculos...</p>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center text-outline/40 mb-4">
                  <Truck className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-on-surface">Nenhum veiculo encontrado</h4>
                <p className="text-on-surface-variant max-w-xs mt-2">Comece adicionando seu primeiro veiculo a frota.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="group flex items-center p-3 rounded-xl hover:bg-primary-fixed-dim/10 transition-all">
                    <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center text-primary">
                      {vehicle.type === 'Carga Pesada' || vehicle.type === 'Longo Percurso' ? <Truck className="w-6 h-6" /> : <Car className="w-6 h-6" />}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-headline text-on-surface">{vehicle.name}</span>
                        <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded uppercase tracking-wider font-bold">{vehicle.plate}</span>
                      </div>
                      <p className="text-xs text-on-secondary-container">Motorista: {vehicle.driver} • {vehicle.type}</p>
                    </div>
                    <div className="hidden sm:block text-right mr-6">
                      <span className="text-sm font-bold text-on-surface">{vehicle.km.toLocaleString()} km</span>
                      <p className="text-[10px] text-on-secondary-container uppercase">Proxima manutencao: {vehicle.nextMaintenance || 'N/A'}</p>
                    </div>
                    {(canDelete || canUpdate) && (
                      <div className="flex items-center gap-2">
                        {canDelete && (
                          <button onClick={() => handleDelete(vehicle.id)} className="p-2 text-outline hover:text-error transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                        {canUpdate && (
                          <button onClick={() => handleEdit(vehicle)} className="p-2 text-outline hover:text-on-surface transition-colors">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={resetForm} title={editingVehicle ? 'Editar veiculo' : 'Novo veiculo'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
              {submitError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nome do veiculo" value={formData.name} onChange={(value) => setFormData({ ...formData, name: value })} placeholder="Ex: Volvo FH 540" />
            <Input label="Placa" value={formData.plate} onChange={(value) => setFormData({ ...formData, plate: value.toUpperCase() })} placeholder="ABC-1234" />
            <Input label="Motorista" value={formData.driver} onChange={(value) => setFormData({ ...formData, driver: value })} placeholder="Nome do motorista" />
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tipo</label>
              <CustomSelect
                value={formData.type}
                onChange={(value) => setFormData({ ...formData, type: value })}
                options={['Carga Pesada', 'Longo Percurso', 'Utilitario', 'Executivo'].map((option) => ({ value: option, label: option }))}
              />
            </div>
            <Input label="Quilometragem" type="number" value={String(formData.km)} onChange={(value) => setFormData({ ...formData, km: Number(value) })} />
            <Input label="Proxima manutencao" type="date" value={formData.nextMaintenance} onChange={(value) => setFormData({ ...formData, nextMaintenance: value })} />
          </div>
          <div className="pt-6 flex justify-end gap-4">
            <button type="button" onClick={resetForm} className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Cancelar</button>
            <button disabled={isSubmitting} type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {editingVehicle ? 'Salvar alteracoes' : 'Cadastrar veiculo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
      <input required type={type} min={type === 'number' ? 0 : undefined} className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

