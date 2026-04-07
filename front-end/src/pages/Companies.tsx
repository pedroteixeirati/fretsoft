import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Building2, Edit2, FileBadge2, Filter, Loader2, Mail, MapPin, Phone, Plus, Search, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useFirebase } from '../context/FirebaseContext';
import { companiesApi } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { canAccess } from '../lib/permissions';
import { Company } from '../types';

const initialFormData = {
  corporateName: '',
  tradeName: '',
  cnpj: '',
  stateRegistration: '',
  municipalRegistration: '',
  legalRepresentative: '',
  representativeCpf: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  contractContact: '',
  notes: '',
  status: 'active' as const,
};

export default function Companies() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'companies', 'create');
  const canUpdate = canAccess(userProfile, 'companies', 'update');
  const canDelete = canAccess(userProfile, 'companies', 'delete');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState(initialFormData);

  const loadCompanies = async () => {
    setLoading(true);
    setLoadError('');
    try {
      setCompanies(await companiesApi.list());
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Nao foi possivel carregar as empresas.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCompanies();
  }, []);

  const filteredCompanies = useMemo(
    () =>
      companies.filter((company) =>
        (company.corporateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.cnpj.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === 'all' || company.status === statusFilter)
      ),
    [companies, searchTerm, statusFilter]
  );

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingCompany(null);
    setSubmitError('');
    setIsModalOpen(false);
  };

  const handleOpenCreate = () => {
    setSubmitError('');
    setSubmitSuccess('');
    setFormData(initialFormData);
    setEditingCompany(null);
    setIsModalOpen(true);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      corporateName: company.corporateName,
      tradeName: company.tradeName,
      cnpj: company.cnpj,
      stateRegistration: company.stateRegistration,
      municipalRegistration: company.municipalRegistration,
      legalRepresentative: company.legalRepresentative,
      representativeCpf: company.representativeCpf,
      email: company.email,
      phone: company.phone,
      address: company.address,
      city: company.city,
      state: company.state,
      zipCode: company.zipCode,
      contractContact: company.contractContact || '',
      notes: company.notes || '',
      status: company.status,
    });
    setSubmitError('');
    setSubmitSuccess('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        corporateName: formData.corporateName.trim(),
        tradeName: formData.tradeName.trim(),
        legalRepresentative: formData.legalRepresentative.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
      };
      if (editingCompany) {
        await companiesApi.update(editingCompany.id, payload);
      } else {
        await companiesApi.create(payload as Omit<Company, 'id'>);
      }
      await loadCompanies();
      setSubmitSuccess(editingCompany ? 'Empresa atualizada com sucesso.' : 'Empresa cadastrada com sucesso.');
      resetForm();
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar a empresa.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja excluir esta empresa?')) return;
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await companiesApi.remove(id);
      await loadCompanies();
      setSubmitSuccess('Empresa excluida com sucesso.');
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel excluir a empresa.'));
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Empresas contratantes</h1>
          <p className="text-on-secondary-container mt-2">Centralize os dados legais e comerciais das empresas atendidas.</p>
        </div>
        {canCreate && (
          <button onClick={handleOpenCreate} className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" />
            NOVA EMPRESA
          </button>
        )}
      </div>

      {(submitSuccess || submitError || loadError) && (
        <div className={`rounded-2xl border px-5 py-4 text-sm font-medium ${submitError || loadError ? 'border-error/20 bg-error/5 text-error' : 'border-primary/20 bg-primary/5 text-primary'}`}>
          {submitError || loadError || submitSuccess}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Empresas cadastradas" value={companies.length.toString()} />
        <StatCard label="Empresas ativas" value={companies.filter((company) => company.status === 'active').length.toString()} />
        <StatCard label="Com contato contratual" value={companies.filter((company) => company.contractContact).length.toString()} />
        <StatCard label="UFs atendidas" value={new Set(companies.map((company) => company.state).filter(Boolean)).size.toString()} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-surface-container-lowest rounded-xl p-2 flex items-center shadow-sm focus-within:shadow-md transition-shadow">
            <Search className="w-5 h-5 text-outline ml-3" />
            <input type="text" placeholder="Buscar por razao social, fantasia ou CNPJ..." className="w-full border-none focus:ring-0 bg-transparent text-on-surface text-sm py-2 px-4 placeholder:text-outline/60" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="h-6 w-px bg-outline/20 mx-2" />
            <div className="flex items-center gap-2 px-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent text-primary text-sm font-semibold appearance-none cursor-pointer focus:outline-none">
                <option value="all">Todos os Status</option>
                <option value="active">Ativa</option>
                <option value="inactive">Inativa</option>
              </select>
              <Filter className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 bg-surface-container-low rounded-xl p-1">
          <div className="bg-surface-container-lowest rounded-lg p-6 h-full min-h-[420px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-lg text-on-surface">Lista de Empresas</h3>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-on-surface-variant font-medium">Carregando empresas...</p>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center text-outline/40 mb-4">
                  <Building2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-on-surface">Nenhuma empresa encontrada</h4>
                <p className="text-on-surface-variant max-w-xs mt-2">Cadastre uma empresa ou ajuste os filtros para visualizar os registros.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCompanies.map((company) => (
                  <div key={company.id} className="group flex items-center p-3 rounded-xl hover:bg-primary-fixed-dim/10 transition-all">
                    <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center text-primary">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold font-headline text-on-surface">{company.corporateName}</span>
                        <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded uppercase tracking-wider font-bold">{company.status === 'active' ? 'Ativa' : 'Inativa'}</span>
                      </div>
                      <p className="text-xs text-on-secondary-container flex items-center gap-1 mt-1"><BriefcaseBusiness className="w-3.5 h-3.5" />{company.tradeName || company.corporateName}</p>
                      <p className="text-[11px] text-on-surface-variant mt-1 flex flex-wrap gap-3">
                        <span className="inline-flex items-center gap-1"><FileBadge2 className="w-3.5 h-3.5" />{company.cnpj}</span>
                        <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{company.phone}</span>
                        <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{company.email}</span>
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-1 inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{company.address}, {company.city} - {company.state}</p>
                    </div>
                    <div className="hidden sm:block text-right mr-6">
                      <span className="text-sm font-bold text-on-surface">{company.legalRepresentative}</span>
                      <p className="text-[10px] text-on-secondary-container uppercase">contato contratual {company.contractContact ? 'ok' : 'nao'}</p>
                    </div>
                    {(canUpdate || canDelete) && (
                      <div className="flex items-center gap-2">
                        {canUpdate && (
                          <button onClick={() => handleEdit(company)} className="p-2 text-outline hover:text-on-surface transition-colors">
                            <Edit2 className="w-5 h-5" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(company.id)} className="p-2 text-outline hover:text-error transition-colors">
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

      <Modal isOpen={isModalOpen} onClose={resetForm} title={editingCompany ? 'Editar empresa' : 'Nova empresa'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
              {submitError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Razao social" value={formData.corporateName} onChange={(value) => setFormData({ ...formData, corporateName: value })} />
            <Field label="Nome fantasia" value={formData.tradeName} onChange={(value) => setFormData({ ...formData, tradeName: value })} />
            <Field label="CNPJ" value={formData.cnpj} onChange={(value) => setFormData({ ...formData, cnpj: value })} />
            <Field label="Inscricao estadual" value={formData.stateRegistration} onChange={(value) => setFormData({ ...formData, stateRegistration: value })} required={false} />
            <Field label="Inscricao municipal" value={formData.municipalRegistration} onChange={(value) => setFormData({ ...formData, municipalRegistration: value })} required={false} />
            <Field label="Representante legal" value={formData.legalRepresentative} onChange={(value) => setFormData({ ...formData, legalRepresentative: value })} />
            <Field label="CPF do representante" value={formData.representativeCpf} onChange={(value) => setFormData({ ...formData, representativeCpf: value })} />
            <Field label="Contato contratual" value={formData.contractContact} onChange={(value) => setFormData({ ...formData, contractContact: value })} required={false} />
            <Field label="E-mail" type="email" value={formData.email} onChange={(value) => setFormData({ ...formData, email: value })} />
            <Field label="Telefone" value={formData.phone} onChange={(value) => setFormData({ ...formData, phone: value })} />
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Endereco</label>
              <input required type="text" className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <Field label="Cidade" value={formData.city} onChange={(value) => setFormData({ ...formData, city: value })} />
            <Field label="UF" value={formData.state} onChange={(value) => setFormData({ ...formData, state: value.toUpperCase() })} />
            <Field label="CEP" value={formData.zipCode} onChange={(value) => setFormData({ ...formData, zipCode: value })} />
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</label>
              <select className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}>
                <option value="active">Ativa</option>
                <option value="inactive">Inativa</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Observacoes</label>
            <textarea rows={4} className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
          <div className="pt-6 flex justify-end gap-4">
            <button type="button" onClick={resetForm} className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Cancelar</button>
            <button disabled={isSubmitting} type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {editingCompany ? 'Salvar alteracoes' : 'Cadastrar empresa'}
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

function Field({ label, value, onChange, type = 'text', required = true }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
      <input required={required} type={type} className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
