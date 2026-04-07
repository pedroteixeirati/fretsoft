import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Calendar, ChevronLeft, ChevronRight, Clock, Edit2, Filter, Hash, Loader2, MapPin, Plus, Search, Sparkles, Tag, Trash2, Truck, Wallet, Wrench } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Modal from '../components/Modal';
import { useFirebase } from '../context/FirebaseContext';
import { expensesApi, vehiclesApi } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { canAccess } from '../lib/permissions';
import { cn } from '../lib/utils';
import { Expense, NavItem, Vehicle } from '../types';

interface ExpensesProps {
  onNavigate: (item: NavItem) => void;
}

const defaultFormData = () => ({
  date: new Date().toISOString().split('T')[0],
  time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  vehicleId: '',
  vehicleName: '',
  provider: '',
  category: 'Combustivel',
  quantity: '',
  amount: 0,
  odometer: '',
  status: 'pending' as const,
  observations: '',
});

function StatCard({
  label,
  value,
  icon: Icon,
  variant,
  currency = false,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  variant: 'primary' | 'secondary' | 'tertiary' | 'error';
  currency?: boolean;
}) {
  const borderClass = {
    primary: 'border-primary/20',
    secondary: 'border-secondary/20',
    tertiary: 'border-tertiary/20',
    error: 'border-error/20',
  }[variant];

  const badgeClass = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    tertiary: 'bg-tertiary/10 text-tertiary',
    error: 'bg-error/10 text-error',
  }[variant];

  return (
    <div className={cn('bg-surface-container-lowest p-6 rounded-2xl shadow-sm border-b-2', borderClass)}>
      <div className="flex justify-between items-start mb-4">
        <span className={cn('p-2 rounded-lg', badgeClass)}>
          <Icon className="w-5 h-5" />
        </span>
      </div>
      <p className="text-on-surface-variant text-sm font-medium">{label}</p>
      <div className="flex items-baseline gap-1 mt-1">
        {currency ? (
          <>
            <span className="text-sm font-bold text-on-surface-variant">R$</span>
            <span className="text-2xl font-black text-on-surface whitespace-nowrap">
              {Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </>
        ) : (
          <span className="text-2xl font-black text-on-surface whitespace-nowrap">{value}</span>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
  required = true,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  required?: boolean;
  icon: React.ElementType;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      <input
        required={required}
        type={type}
        step={step}
        className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      <select
        required
        className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Expenses({ onNavigate }: ExpensesProps) {
  const { user, userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'expenses', 'create');
  const canUpdate = canAccess(userProfile, 'expenses', 'update');
  const canDelete = canAccess(userProfile, 'expenses', 'delete');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setLoadError('');
    try {
      const [expenseData, vehicleData] = await Promise.all([
        expensesApi.list(),
        vehiclesApi.list(),
      ]);

      setExpenses(
        expenseData.sort((a, b) => {
          const left = `${a.date || ''}T${a.time || '00:00'}`;
          const right = `${b.date || ''}T${b.time || '00:00'}`;
          return right.localeCompare(left);
        })
      );
      setVehicles(vehicleData);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Nao foi possivel carregar os custos operacionais.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [user]);

  useEffect(() => {
    if (expenses.length > 0 && !aiSummary && !aiLoading) {
      void generateAiSummary();
    }
  }, [expenses]);

  const generateAiSummary = async () => {
    if (expenses.length === 0) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      setAiSummary('Os gastos ja podem ser analisados pelos relatorios. Se quiser um resumo automatico por IA, configure a chave do Gemini no ambiente.');
      return;
    }

    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const total = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
      const byCategory = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount || 0);
        return acc;
      }, {} as Record<string, number>);
      const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 });
      const categorySummary = Object.entries(byCategory)
        .map(([category, value]) => `${category}: R$ ${formatter.format(value as number)}`)
        .join(', ');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Resuma em no maximo 2 frases os gastos da frota. Total: R$ ${formatter.format(total)}. Lancamentos: ${expenses.length}. Categorias: ${categorySummary}. Tom profissional e direto, em portugues do Brasil.`,
      });

      setAiSummary(response.text || 'Analise indisponivel no momento.');
    } catch (error) {
      console.error('Erro ao gerar resumo de IA:', error);
      setAiSummary('Os gastos da frota ja estao organizados por categoria e veiculo. Use os relatorios para comparar custo operacional, recorrencia e impacto por caminhao.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
    setSubmitError('');
    setFormData(defaultFormData());
  };

  const handleOpenCreate = () => {
    setSubmitError('');
    setSubmitSuccess('');
    setEditingExpense(null);
    setFormData(defaultFormData());
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === formData.vehicleId);
    if (!selectedVehicle) {
      setSubmitError('Selecione um veiculo cadastrado para registrar o custo operacional.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const payload = { ...formData, vehicleName: selectedVehicle.name };
      if (editingExpense) {
        await expensesApi.update(editingExpense.id, payload);
      } else {
        await expensesApi.create(payload);
      }
      await loadData();
      setSubmitSuccess(editingExpense ? 'Custo operacional atualizado com sucesso.' : 'Custo operacional lancado com sucesso.');
      handleCloseModal();
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar o custo operacional.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      time: expense.time,
      vehicleId: expense.vehicleId,
      vehicleName: expense.vehicleName,
      provider: expense.provider,
      category: expense.category,
      quantity: expense.quantity || '',
      amount: Number(expense.amount || 0),
      odometer: expense.odometer || '',
      status: expense.status,
      observations: expense.observations || '',
    });
    setSubmitError('');
    setSubmitSuccess('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este custo operacional?')) return;
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await expensesApi.remove(id);
      await loadData();
      setSubmitSuccess('Custo operacional excluido com sucesso.');
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel excluir o custo operacional.'));
    }
  };

  const filteredExpenses = useMemo(() => (
    expenses.filter((expense) =>
      expense.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ), [expenses, searchTerm]);

  const totalAmount = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const fuelAmount = filteredExpenses.filter((expense) => expense.category.toLowerCase().includes('combust')).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const maintenanceAmount = filteredExpenses.filter((expense) => expense.category.toLowerCase().includes('manut')).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const pendingCount = filteredExpenses.filter((expense) => expense.status === 'pending').length;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-2">
          <span>Gestao de Frota</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary font-medium">Custos operacionais</span>
        </div>
        <div className="flex justify-between items-end gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Custos Operacionais</h1>
            <p className="text-on-secondary-container mt-1">Registre abastecimentos, manutencoes e custos operacionais por veiculo.</p>
          </div>
          {canCreate && (
            <button onClick={handleOpenCreate} className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:brightness-110 transition-all">
              <Plus className="w-4 h-4" />
              Novo custo
            </button>
          )}
        </div>
      </div>

      {(submitSuccess || submitError || loadError) && (
        <div className={`rounded-2xl border px-5 py-4 text-sm font-medium ${submitError || loadError ? 'border-error/20 bg-error/5 text-error' : 'border-primary/20 bg-primary/5 text-primary'}`}>
          {submitError || loadError || submitSuccess}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Custos filtrados" value={totalAmount} icon={Wallet} variant="primary" currency />
        <StatCard label="Combustivel" value={fuelAmount} icon={Truck} variant="secondary" currency />
        <StatCard label="Manutencao" value={maintenanceAmount} icon={Wrench} variant="tertiary" currency />
        <StatCard label="Pendentes" value={`${pendingCount} lancamento(s)`} icon={AlertTriangle} variant="error" />
      </div>

      <section className="bg-surface-container-lowest rounded-3xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 bg-surface-container-low/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Buscar custo operacional..."
                className="pl-10 pr-4 py-2 bg-surface rounded-full border-none text-sm font-medium text-on-surface-variant focus:ring-2 focus:ring-primary/20 min-w-[220px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm font-semibold text-on-surface-variant">
            Mostrando <span className="text-primary">{filteredExpenses.length}</span> de {expenses.length} custos operacionais
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/10">
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Data e Hora</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Veiculo</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Fornecedor</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Categoria</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant text-right">Valor</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant text-right">Odometro</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant text-center">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      <p className="text-on-surface-variant font-medium">Carregando custos operacionais...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-on-surface-variant">
                    Nenhum custo operacional encontrado.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-primary-fixed-dim/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="text-sm font-semibold text-on-surface">{new Date(expense.date).toLocaleDateString('pt-BR')}</div>
                      <div className="text-xs text-on-surface-variant">{expense.time}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', expense.status === 'approved' ? 'bg-primary' : expense.status === 'review' ? 'bg-tertiary' : 'bg-error')} />
                        <span className="text-sm font-medium text-on-surface">{expense.vehicleName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface">{expense.provider}</td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-sm text-primary">
                      R$ {Number(expense.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-5 text-right text-sm">{expense.odometer || '-'} km</td>
                    <td className="px-6 py-5">
                      {(canUpdate || canDelete) && (
                        <div className="flex justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canUpdate && (
                            <button onClick={() => handleEdit(expense)} className="p-2 hover:bg-primary-fixed text-primary rounded-full transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(expense.id)} className="p-2 hover:bg-error-container text-error rounded-full transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-surface-container-low/30 border-t border-outline-variant/10 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">Mostrando {filteredExpenses.length} resultado(s)</p>
          <div className="flex gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors disabled:opacity-30" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-on-primary text-xs font-bold">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingExpense ? 'Editar custo operacional' : 'Novo custo operacional'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
              {submitError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Data" type="date" value={formData.date} onChange={(value) => setFormData({ ...formData, date: value })} icon={Calendar} />
            <Input label="Hora" type="time" value={formData.time} onChange={(value) => setFormData({ ...formData, time: value })} icon={Clock} />
            <Select
              label="Veiculo"
              value={formData.vehicleId}
              onChange={(value) => setFormData({ ...formData, vehicleId: value })}
              icon={Truck}
              placeholder="Selecione um veiculo"
              options={vehicles.map((vehicle) => ({ value: vehicle.id, label: `${vehicle.name} (${vehicle.plate})` }))}
            />
            <Input label="Fornecedor" value={formData.provider} onChange={(value) => setFormData({ ...formData, provider: value })} icon={MapPin} placeholder="Ex: Posto Ipiranga" />
            <Select
              label="Categoria"
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              icon={Tag}
              options={[
                { value: 'Combustivel', label: 'Combustivel' },
                { value: 'Manutencao', label: 'Manutencao' },
                { value: 'Lavagem', label: 'Lavagem' },
                { value: 'Pneus', label: 'Pneus' },
                { value: 'Documentacao', label: 'Documentacao' },
                { value: 'Seguro', label: 'Seguro' },
                { value: 'Outros', label: 'Outros' },
              ]}
            />
            <Input label="Valor Total (R$)" type="number" value={String(formData.amount)} onChange={(value) => setFormData({ ...formData, amount: Number(value) })} icon={Hash} step="0.01" />
            <Input label="Odometro (km)" type="number" value={formData.odometer} onChange={(value) => setFormData({ ...formData, odometer: value })} icon={Hash} />
            <Select
              label="Status"
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value as Expense['status'] })}
              icon={AlertTriangle}
              options={[
                { value: 'pending', label: 'Pendente' },
                { value: 'review', label: 'Em revisao' },
                { value: 'approved', label: 'Aprovado' },
              ]}
            />
            <Input label="Quantidade" value={formData.quantity} onChange={(value) => setFormData({ ...formData, quantity: value })} icon={Hash} placeholder="Opcional" required={false} />
            <Input label="Observacoes" value={formData.observations} onChange={(value) => setFormData({ ...formData, observations: value })} icon={Sparkles} placeholder="Opcional" required={false} />
          </div>
          <div className="pt-6 flex justify-end gap-4">
            <button type="button" onClick={handleCloseModal} className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancelar
            </button>
            <button disabled={isSubmitting} type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {editingExpense ? 'Salvar Alteracoes' : 'Lancar custo'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-surface-container-lowest p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="relative z-10">
            <h3 className="text-2xl font-extrabold text-on-surface mb-2">Analise de Eficiencia</h3>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-on-secondary-container animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p className="text-sm">IA analisando dados da frota...</p>
              </div>
            ) : (
              <p className="text-on-secondary-container max-w-md leading-relaxed">
                {aiSummary || 'Adicione custos operacionais para que a IA possa gerar um resumo analitico da sua frota.'}
              </p>
            )}
          </div>
          <div className="mt-8 flex gap-4">
            <button onClick={() => onNavigate('reports')} className="bg-primary text-on-primary px-6 py-2 rounded-full text-sm font-semibold">
              Ver Relatorio Detalhado
            </button>
          </div>
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="bg-primary-container p-8 rounded-3xl text-on-primary-container flex flex-col justify-center items-center text-center shadow-lg">
          <Sparkles className="w-12 h-12 mb-4" />
          <h4 className="text-xl font-bold mb-2">Padrao de Lancamentos</h4>
          <p className="text-sm opacity-90 mb-6 leading-relaxed">Centralize os custos por veiculo para comparar combustivel, manutencao e recorrencia de gastos com muito mais clareza.</p>
          <button onClick={() => onNavigate('reports')} className="bg-on-primary-container text-primary-container w-full py-3 rounded-full font-bold hover:scale-[1.02] transition-transform">
            Abrir Relatorios
          </button>
        </div>
      </div>
    </div>
  );
}
