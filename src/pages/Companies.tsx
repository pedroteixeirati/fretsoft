import React, { useEffect, useState } from 'react';
import { BriefcaseBusiness, Building2, Edit2, FileBadge2, Loader2, MapPin, Phone, Plus, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useFirebase } from '../context/FirebaseContext';
import { companiesApi } from '../lib/api';
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
  const [formData, setFormData] = useState(initialFormData);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      setCompanies(await companiesApi.list());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingCompany(null);
    setIsModalOpen(false);
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
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingCompany) {
        await companiesApi.update(editingCompany.id, formData);
      } else {
        await companiesApi.create(formData as Omit<Company, 'id'>);
      }
      await loadCompanies();
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja excluir esta empresa?')) return;
    await companiesApi.remove(id);
    await loadCompanies();
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Cadastro empresarial</p>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mt-2">Empresas contratantes</h1>
          <p className="text-on-surface-variant mt-2 max-w-3xl">Centralize os dados legais das empresas atendidas, incluindo razão social, CNPJ, inscrições, representante legal e endereço completo.</p>
        </div>
          {canCreate && (
            <button onClick={() => setIsModalOpen(true)} className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5" />
              Nova empresa
            </button>
          )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <SimpleCard label="Empresas cadastradas" value={companies.length.toString()} />
        <SimpleCard label="Empresas ativas" value={companies.filter((company) => company.status === 'active').length.toString()} />
        <SimpleCard label="Com contato contratual" value={companies.filter((company) => company.contractContact).length.toString()} />
        <SimpleCard label="UFs atendidas" value={new Set(companies.map((company) => company.state).filter(Boolean)).size.toString()} />
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-on-surface-variant font-medium">Carregando empresas...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-12 text-center">
          <Building2 className="w-14 h-14 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-on-surface">Nenhuma empresa cadastrada</h3>
          <p className="text-on-surface-variant mt-2 max-w-xl mx-auto">Cadastre aqui os dados legais completos das empresas para usar esses registros depois nos contratos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {companies.map((company) => (
            <article key={company.id} className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-7 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-2">{company.tradeName || company.corporateName}</p>
                  <h2 className="text-2xl font-bold text-on-surface">{company.corporateName}</h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${company.status === 'active' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant'}`}>
                  {company.status === 'active' ? 'Ativa' : 'Inativa'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <InfoTile label="CNPJ" value={company.cnpj} />
                <InfoTile label="Representante legal" value={company.legalRepresentative} />
              </div>

              <div className="space-y-3 text-sm text-on-surface-variant mb-6">
                <p className="flex items-center gap-2"><FileBadge2 className="w-4 h-4 text-primary" /> IE: {company.stateRegistration || 'Não informada'} • IM: {company.municipalRegistration || 'Não informada'}</p>
                <p className="flex items-center gap-2"><BriefcaseBusiness className="w-4 h-4 text-primary" /> CPF do representante: {company.representativeCpf || 'Não informado'}</p>
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> {company.phone} • {company.email}</p>
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {company.address}, {company.city} - {company.state}, CEP {company.zipCode}</p>
                {company.contractContact && <p><span className="font-bold text-on-surface">Contato contratual:</span> {company.contractContact}</p>}
                {company.notes && <p><span className="font-bold text-on-surface">Observações:</span> {company.notes}</p>}
              </div>

                {(canUpdate || canDelete) && (
                  <div className="pt-5 border-t border-outline-variant flex items-center justify-end gap-3">
                    {canUpdate && (
                      <button onClick={() => handleEdit(company)} className="px-4 py-2 rounded-full text-sm font-bold text-primary hover:bg-primary/10 transition-colors flex items-center gap-2">
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(company.id)} className="px-4 py-2 rounded-full text-sm font-bold text-error hover:bg-error/10 transition-colors flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    )}
                  </div>
                )}
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={resetForm} title={editingCompany ? 'Editar empresa' : 'Nova empresa'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Razão social" value={formData.corporateName} onChange={(value) => setFormData({ ...formData, corporateName: value })} />
            <Field label="Nome fantasia" value={formData.tradeName} onChange={(value) => setFormData({ ...formData, tradeName: value })} />
            <Field label="CNPJ" value={formData.cnpj} onChange={(value) => setFormData({ ...formData, cnpj: value })} />
            <Field label="Inscrição estadual" value={formData.stateRegistration} onChange={(value) => setFormData({ ...formData, stateRegistration: value })} required={false} />
            <Field label="Inscrição municipal" value={formData.municipalRegistration} onChange={(value) => setFormData({ ...formData, municipalRegistration: value })} required={false} />
            <Field label="Representante legal" value={formData.legalRepresentative} onChange={(value) => setFormData({ ...formData, legalRepresentative: value })} />
            <Field label="CPF do representante" value={formData.representativeCpf} onChange={(value) => setFormData({ ...formData, representativeCpf: value })} />
            <Field label="Contato contratual" value={formData.contractContact} onChange={(value) => setFormData({ ...formData, contractContact: value })} required={false} />
            <Field label="E-mail" type="email" value={formData.email} onChange={(value) => setFormData({ ...formData, email: value })} />
            <Field label="Telefone" value={formData.phone} onChange={(value) => setFormData({ ...formData, phone: value })} />
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Endereço</label>
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
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Observações</label>
            <textarea rows={4} className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
          <div className="pt-6 flex justify-end gap-4">
            <button type="button" onClick={resetForm} className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Cancelar</button>
            <button disabled={isSubmitting} type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {editingCompany ? 'Salvar alterações' : 'Cadastrar empresa'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function SimpleCard({ label, value }: { label: string; value: string }) {
  return <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant shadow-sm"><p className="text-sm font-medium text-on-surface-variant mb-2">{label}</p><p className="text-3xl font-black text-on-surface">{value}</p></div>;
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return <div className="bg-surface-container rounded-2xl p-4"><p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">{label}</p><p className="text-base font-black text-on-surface">{value}</p></div>;
}

function Field({ label, value, onChange, type = 'text', required = true }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
      <input required={required} type={type} className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
