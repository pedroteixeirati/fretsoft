import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Phone, Mail, MapPin, ExternalLink, MoreVertical, Star, Trash2, Loader2, Edit2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, where, updateDoc } from 'firebase/firestore';
import { Provider } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import Modal from '../components/Modal';
import { cn } from '../lib/utils';

export default function Suppliers() {
  const { user, userProfile } = useFirebase();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'Oficina',
    rating: 5,
    status: 'Ativo',
    contact: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    if (!user || !userProfile) return;

    const isAdmin = userProfile.role === 'admin';
    const q = isAdmin 
      ? collection(db, 'providers') 
      : query(collection(db, 'providers'), where('uid', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const providerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Provider[];
      setProviders(providerData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'providers');
    });

    return unsubscribe;
  }, [user, userProfile]);

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      if (editingProvider) {
        await updateDoc(doc(db, 'providers', editingProvider.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'providers'), {
          ...formData,
          uid: user.uid,
          createdAt: new Date().toISOString()
        });
      }
      handleCloseModal();
    } catch (error) {
      handleFirestoreError(error, editingProvider ? OperationType.UPDATE : OperationType.CREATE, 'providers');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProvider = (provider: Provider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      type: provider.type as any,
      rating: provider.rating,
      status: provider.status as any,
      contact: provider.contact,
      email: provider.email || '',
      address: provider.address || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProvider(null);
    setFormData({
      name: '',
      type: 'Oficina',
      rating: 5,
      status: 'Ativo',
      contact: '',
      email: '',
      address: ''
    });
  };

  const handleDeleteProvider = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) return;

    try {
      await deleteDoc(doc(db, 'providers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `providers/${id}`);
    }
  };

  const filteredProviders = providers.filter(p => 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.type.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (typeFilter === 'all' || p.type === typeFilter)
  );

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Fornecedores e Parceiros</h1>
          <p className="text-on-surface-variant mt-1">Gerencie sua rede de serviços e relacionamentos com fornecedores</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Adicionar Novo Fornecedor
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant shadow-sm">
          <p className="text-sm font-medium text-on-surface-variant mb-1">Total de Fornecedores</p>
          <p className="text-3xl font-black text-on-surface">{providers.length}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant shadow-sm">
          <p className="text-sm font-medium text-on-surface-variant mb-1">Contratos Ativos</p>
          <p className="text-3xl font-black text-on-surface">{providers.filter(p => p.status === 'Ativo').length}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant shadow-sm">
          <p className="text-sm font-medium text-on-surface-variant mb-1">Oficinas Parceiras</p>
          <p className="text-3xl font-black text-secondary">{providers.filter(p => p.type === 'Oficina').length}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant shadow-sm">
          <p className="text-sm font-medium text-on-surface-variant mb-1">Avaliação Média</p>
          <div className="flex items-center gap-1">
            <p className="text-3xl font-black text-on-surface">
              {providers.length ? (providers.reduce((acc, curr) => acc + curr.rating, 0) / providers.length).toFixed(1) : '0.0'}
            </p>
            <Star className="w-5 h-5 fill-tertiary text-tertiary" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="Buscar fornecedores por nome, serviço ou localização..." 
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant px-6 py-3 rounded-2xl font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-12"
          >
            <option value="all">Todos os Tipos</option>
            <option value="Oficina">Oficina</option>
            <option value="Posto de Combustível">Posto de Combustível</option>
            <option value="Seguradora">Seguradora</option>
            <option value="Concessionária">Concessionária</option>
            <option value="Outros">Outros</option>
          </select>
          <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-on-surface-variant font-medium">Carregando fornecedores...</p>
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-outline-variant">
          <p className="text-on-surface-variant font-medium">Nenhum fornecedor encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <div key={provider.id} className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden hover:shadow-md transition-shadow group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center text-2xl font-black text-primary">
                    {provider.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditProvider(provider)}
                      className="p-2 text-outline hover:text-primary transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProvider(provider.id)}
                      className="p-2 text-outline hover:text-error transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-on-surface mb-1">{provider.name}</h3>
                <span className="inline-block px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold mb-4 uppercase tracking-wider">
                  {provider.type}
                </span>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-on-surface-variant text-sm">
                    <Phone className="w-4 h-4" />
                    {provider.contact}
                  </div>
                  <div className="flex items-center gap-3 text-on-surface-variant text-sm">
                    <Mail className="w-4 h-4" />
                    {provider.email || `contato@${provider.name.toLowerCase().replace(/\s/g, '')}.com`}
                  </div>
                  <div className="flex items-center gap-3 text-on-surface-variant text-sm">
                    <MapPin className="w-4 h-4" />
                    {provider.address || 'Endereço não informado'}
                  </div>
                </div>

                <div className="pt-6 border-t border-outline-variant flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-tertiary text-tertiary" />
                    <span className="text-sm font-bold text-on-surface">{provider.rating.toFixed(1)}</span>
                    <span className="text-xs text-on-surface-variant">(Avaliação)</span>
                  </div>
                  <button className="text-primary text-sm font-bold flex items-center gap-1 group-hover:underline">
                    Ver Perfil
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingProvider ? "Editar Fornecedor" : "Novo Fornecedor"}
      >
        <form onSubmit={handleAddProvider} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nome do Fornecedor</label>
              <input 
                required
                type="text" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Ex: Posto Central"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tipo</label>
                <select 
                  className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option>Oficina</option>
                  <option>Posto de Combustível</option>
                  <option>Seguradora</option>
                  <option>Concessionária</option>
                  <option>Outros</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Avaliação (1-5)</label>
                <input 
                  required
                  type="number" 
                  min="1"
                  max="5"
                  className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: Number(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">E-mail</label>
              <input 
                required
                type="email" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="exemplo@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Endereço</label>
              <input 
                required
                type="text" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Rua, Número, Bairro, Cidade - UF"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Contato (Telefone)</label>
              <input 
                required
                type="text" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="(11) 99999-9999"
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
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
              {editingProvider ? "Salvar Alterações" : "Cadastrar Fornecedor"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
