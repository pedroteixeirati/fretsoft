import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Truck, Car, Trash2, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, where, updateDoc } from 'firebase/firestore';
import { Vehicle } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import Modal from '../components/Modal';
import { cn } from '../lib/utils';

export default function Vehicles() {
  const { user, userProfile } = useFirebase();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    plate: '',
    driver: '',
    type: 'Carga Pesada',
    km: 0,
    nextMaintenance: '',
    status: 'active' as const
  });

  useEffect(() => {
    if (!user || !userProfile) return;

    const isAdmin = userProfile.role === 'admin';
    const q = isAdmin 
      ? collection(db, 'vehicles') 
      : query(collection(db, 'vehicles'), where('uid', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vehicleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[];
      setVehicles(vehicleData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'vehicles');
    });

    return unsubscribe;
  }, [user, userProfile]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      if (editingVehicle) {
        await updateDoc(doc(db, 'vehicles', editingVehicle.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'vehicles'), {
          ...formData,
          uid: user.uid,
          createdAt: new Date().toISOString()
        });
      }
      handleCloseModal();
    } catch (error) {
      handleFirestoreError(error, editingVehicle ? OperationType.UPDATE : OperationType.CREATE, 'vehicles');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      plate: vehicle.plate,
      driver: vehicle.driver,
      type: vehicle.type as any,
      km: vehicle.km,
      nextMaintenance: vehicle.nextMaintenance || '',
      status: vehicle.status as any
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
    setFormData({
      name: '',
      plate: '',
      driver: '',
      type: 'Carga Pesada',
      km: 0,
      nextMaintenance: '',
      status: 'active'
    });
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este veículo?')) return;

    try {
      await deleteDoc(doc(db, 'vehicles', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vehicles/${id}`);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    (v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
     v.driver.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (typeFilter === 'all' || v.type === typeFilter) &&
    (statusFilter === 'all' || v.status === statusFilter)
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Gestão de Cadastros</h1>
          <p className="text-on-secondary-container mt-2">Gerencie suas entidades de frota, fornecedores e categorias de despesas em um só lugar.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          NOVO CADASTRO
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-4 no-scrollbar">
        <button className="flex-none px-6 py-2 rounded-full bg-primary-fixed text-on-surface font-bold text-sm transition-all">
          Veículos ({vehicles.length})
        </button>
        <button className="flex-none px-6 py-2 rounded-full hover:bg-surface-container text-on-surface-variant font-medium text-sm transition-all">
          Fornecedores (48)
        </button>
        <button className="flex-none px-6 py-2 rounded-full hover:bg-surface-container text-on-surface-variant font-medium text-sm transition-all">
          Tipos de Despesa (8)
        </button>
      </div>

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
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-primary text-sm font-semibold appearance-none cursor-pointer focus:outline-none"
              >
                <option value="all">Todos os Tipos</option>
                <option value="Carga Pesada">Carga Pesada</option>
                <option value="Longo Percurso">Longo Percurso</option>
                <option value="Utilitário">Utilitário</option>
                <option value="Executivo">Executivo</option>
              </select>
              <div className="h-6 w-px bg-outline/20 mx-2" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-primary text-sm font-semibold appearance-none cursor-pointer focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativo</option>
                <option value="maintenance">Manutenção</option>
                <option value="alert">Alerta</option>
              </select>
              <Filter className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 bg-surface-container-low rounded-xl p-1">
          <div className="bg-surface-container-lowest rounded-lg p-6 h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-lg text-on-surface">Ativos da Frota</h3>
              <button className="text-primary text-sm font-medium hover:underline">Ver Todos</button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-on-surface-variant font-medium">Carregando veículos...</p>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center text-outline/40 mb-4">
                  <Truck className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-on-surface">Nenhum veículo encontrado</h4>
                <p className="text-on-surface-variant max-w-xs mt-2">Comece adicionando seu primeiro veículo à frota.</p>
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
                      <p className="text-xs text-on-secondary-container">Motorista: {vehicle.driver} · {vehicle.type}</p>
                    </div>
                    <div className="hidden sm:block text-right mr-6">
                      <span className="text-sm font-bold text-on-surface">{vehicle.km.toLocaleString()} km</span>
                      <p className="text-[10px] text-on-secondary-container uppercase">Próxima Manutenção: {vehicle.nextMaintenance || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="p-2 text-outline hover:text-error transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleEditVehicle(vehicle)}
                        className="p-2 text-outline hover:text-on-surface transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingVehicle ? "Editar Veículo" : "Novo Veículo"}
      >
        <form onSubmit={handleAddVehicle} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nome do Veículo</label>
              <input 
                required
                type="text" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Ex: Volvo FH 540"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Placa</label>
              <input 
                required
                type="text" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="ABC-1234"
                value={formData.plate}
                onChange={(e) => setFormData({...formData, plate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Motorista</label>
              <input 
                required
                type="text" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Nome do motorista"
                value={formData.driver}
                onChange={(e) => setFormData({...formData, driver: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tipo</label>
              <select 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option>Carga Pesada</option>
                <option>Longo Percurso</option>
                <option>Utilitário</option>
                <option>Executivo</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Quilometragem</label>
              <input 
                required
                type="number" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.km}
                onChange={(e) => setFormData({...formData, km: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Próxima Manutenção</label>
              <input 
                type="date" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.nextMaintenance}
                onChange={(e) => setFormData({...formData, nextMaintenance: e.target.value})}
              />
            </div>
          </div>
          <div className="pt-6 flex justify-end gap-4">
            <button 
              type="button"
              onClick={handleCloseModal}
              className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancelar
            </button>
            <button 
              disabled={isSubmitting}
              type="submit"
              className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {editingVehicle ? "Salvar Alterações" : "Cadastrar Veículo"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
