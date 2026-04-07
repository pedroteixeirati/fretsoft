import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Filter, Loader2, Mail, MapPin, Phone, Plus, Search, Trash2, Users } from 'lucide-react';
import Modal from '../components/Modal';
import { useFirebase } from '../context/FirebaseContext';
import { providersApi } from '../lib/api';
import { canAccess } from '../lib/permissions';
import { Provider } from '../types';

export default function Suppliers() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'providers', 'create');
  const canUpdate = canAccess(userProfile, 'providers', 'update');
  const canDelete = canAccess(userProfile, 'providers', 'delete');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    type: 'Oficina',
    status: 'Ativo',
    contact: '',
    email: '',
    address: '',
  });

  const loadProviders = async () => {
    setLoading(true);
    try {
      setProviders(await providersApi.list());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProviders();
  }, []);

  const filteredProviders = useMemo(
    () =>
      providers.filter((provider) =>
        (provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.contact.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (typeFilter === 'all' || provider.type === typeFilter)
      ),
    [providers, searchTerm, typeFilter]
  );

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProvider(null);
    setFormData({
      name: '',
      type: 'Oficina',
      status: 'Ativo',
      contact: '',
      email: '',
      address: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingProvider) {
        await providersApi.update(editingProvider.id, formData);
      } else {
        await providersApi.create(formData as Omit<Provider, 'id'>);
      }
      await loadProviders();
      handleCloseModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      type: provider.type,
      status: provider.status,
      contact: provider.contact,
      email: provider.email,
      address: provider.address,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) return;
    await providersApi.remove(id);
    await loadProviders();
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Fornecedores e Parceiros</h1>
          <p className="text-on-secondary-container mt-2">Gerencie sua rede de servicos e relacoes com fornecedores.</p>
        </div>
        {canCreate && (
          <button onClick={() => setIsModalOpen(true)} className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" />
            NOVO FORNECEDOR
          </button>
        )}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Total de fornecedores" value={providers.length.toString()} />
        <StatCard label="Ativos" value={providers.filter((provider) => provider.status === 'Ativo').length.toString()} />
        <StatCard label="Oficinas" value={providers.filter((provider) => provider.type === 'Oficina').length.toString()} />
        <StatCard label="Com e-mail" value={providers.filter((provider) => provider.email.trim().length > 0).length.toString()} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-surface-container-lowest rounded-xl p-2 flex items-center shadow-sm focus-within:shadow-md transition-shadow">
            <Search className="w-5 h-5 text-outline ml-3" />
            <input type="text" placeholder="Buscar por nome, tipo ou contato..." className="w-full border-none focus:ring-0 bg-transparent text-on-surface text-sm py-2 px-4 placeholder:text-outline/60" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="h-6 w-px bg-outline/20 mx-2" />
            <div className="flex items-center gap-2 px-2">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-transparent text-primary text-sm font-semibold appearance-none cursor-pointer focus:outline-none">
                <option value="all">Todos os Tipos</option>
                <option value="Oficina">Oficina</option>
                <option value="Posto de Combustivel">Posto de Combustivel</option>
                <option value="Seguradora">Seguradora</option>
                <option value="Concessionaria">Concessionaria</option>
                <option value="Outros">Outros</option>
              </select>
              <Filter className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 bg-surface-container-low rounded-xl p-1">
          <div className="bg-surface-container-lowest rounded-lg p-6 h-full min-h-[420px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-lg text-on-surface">Lista de Fornecedores</h3>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-on-surface-variant font-medium">Carregando fornecedores...</p>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center text-outline/40 mb-4">
                  <Users className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-on-surface">Nenhum fornecedor encontrado</h4>
                <p className="text-on-surface-variant max-w-xs mt-2">Cadastre um novo fornecedor ou ajuste os filtros para visualizar os registros.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProviders.map((provider) => (
                  <div key={provider.id} className="group flex items-center p-3 rounded-xl hover:bg-primary-fixed-dim/10 transition-all">
                    <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center text-primary">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold font-headline text-on-surface">{provider.name}</span>
                        <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded uppercase tracking-wider font-bold">{provider.type}</span>
                      </div>
                      <p className="text-xs text-on-secondary-container flex items-center gap-1 mt-1"><Phone className="w-3.5 h-3.5" />{provider.contact}</p>
                      <p className="text-[11px] text-on-surface-variant mt-1 flex flex-wrap gap-3">
                        <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{provider.email}</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{provider.address || 'Endereco nao informado'}</span>
                      </p>
                    </div>
                    <div className="hidden sm:block text-right mr-6">
                      <span className="text-sm font-bold text-on-surface">{provider.type}</span>
                      <p className="text-[10px] text-on-secondary-container uppercase">{provider.status}</p>
                    </div>
                    {(canUpdate || canDelete) && (
                      <div className="flex items-center gap-2">
                        {canUpdate && (
                          <button onClick={() => handleEdit(provider)} className="p-2 text-outline hover:text-on-surface transition-colors">
                            <Edit2 className="w-5 h-5" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(provider.id)} className="p-2 text-outline hover:text-error transition-colors">
                            <Trash2 className="w-5 h-5" />
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

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProvider ? 'Editar Fornecedor' : 'Novo Fornecedor'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <TextInput label="Nome do Fornecedor" value={formData.name} onChange={(value) => setFormData({ ...formData, name: value })} placeholder="Ex: Posto Central" />
            <div className="grid grid-cols-2 gap-4">
              <SelectInput label="Tipo" value={formData.type} onChange={(value) => setFormData({ ...formData, type: value })} options={['Oficina', 'Posto de Combustivel', 'Seguradora', 'Concessionaria', 'Outros']} />
              <SelectInput label="Status" value={formData.status} onChange={(value) => setFormData({ ...formData, status: value })} options={['Ativo', 'Inativo']} />
            </div>
            <TextInput label="E-mail" type="email" value={formData.email} onChange={(value) => setFormData({ ...formData, email: value })} placeholder="exemplo@email.com" />
            <TextInput label="Endereco" value={formData.address} onChange={(value) => setFormData({ ...formData, address: value })} placeholder="Rua, Numero, Bairro, Cidade - UF" />
            <TextInput label="Contato (Telefone)" value={formData.contact} onChange={(value) => setFormData({ ...formData, contact: value })} placeholder="(11) 99999-9999" />
          </div>
          <div className="pt-6 flex justify-end gap-4">
            <button type="button" onClick={handleCloseModal} className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Cancelar</button>
            <button disabled={isSubmitting} type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {editingProvider ? 'Salvar Alteracoes' : 'Cadastrar Fornecedor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant shadow-sm"><p className="text-sm font-medium text-on-surface-variant mb-2">{label}</p><p className="text-3xl font-black text-on-surface">{value}</p></div>;
}

function TextInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
      <input required type={type} className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
      <select className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}
