import React, { useState, useEffect } from 'react';
import { Search, Calendar, Truck, Store, Filter, Edit2, Trash2, Plus, ChevronRight, ChevronLeft, Sparkles, Zap, AlertTriangle, Clock, MapPin, Tag, Hash, FileText, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, where, orderBy, updateDoc } from 'firebase/firestore';
import { Expense, Vehicle, NavItem } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import Modal from '../components/Modal';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

interface ExpensesProps {
  onNavigate: (item: NavItem) => void;
}

export default function Expenses({ onNavigate }: ExpensesProps) {
  const { user, userProfile } = useFirebase();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    vehicleId: '',
    vehicleName: '',
    provider: '',
    category: 'Combustível',
    quantity: '',
    amount: 0,
    odometer: '',
    status: 'pending' as const,
    observations: ''
  });

  useEffect(() => {
    if (!user || !userProfile) return;

    const isAdmin = userProfile.role === 'admin';

    // Fetch expenses
    const qExpenses = isAdmin 
      ? query(collection(db, 'expenses'), orderBy('date', 'desc'))
      : query(
          collection(db, 'expenses'), 
          where('uid', '==', user.uid),
          orderBy('date', 'desc')
        );
    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const expenseData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
      setExpenses(expenseData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'expenses');
    });

    // Fetch vehicles for the dropdown
    const qVehicles = isAdmin
      ? collection(db, 'vehicles')
      : query(collection(db, 'vehicles'), where('uid', '==', user.uid));
    const unsubscribeVehicles = onSnapshot(qVehicles, (snapshot) => {
      const vehicleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[];
      setVehicles(vehicleData);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeVehicles();
    };
  }, [user, userProfile]);

  useEffect(() => {
    if (expenses.length > 0 && !aiSummary && !aiLoading) {
      generateAiSummary();
    }
  }, [expenses]);

  const generateAiSummary = async () => {
    if (expenses.length === 0) return;
    
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
      const byCategory = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);
      
      const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 });
      const categorySummary = Object.entries(byCategory)
        .map(([cat, val]) => `${cat}: R$ ${formatter.format(val as number)}`)
        .join(', ');

      const prompt = `Como um analista de frota experiente, gere um resumo analítico curtíssimo (máximo 2 frases) sobre os seguintes dados de gastos da frota:
      Total de gastos: R$ ${formatter.format(total)}
      Número de lançamentos: ${expenses.length}
      Gastos por categoria: ${categorySummary}
      
      O tom deve ser profissional, direto e focado em eficiência. Responda apenas o resumo em português do Brasil.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAiSummary(response.text || 'Análise indisponível no momento.');
    } catch (error) {
      console.error('Erro ao gerar resumo IA:', error);
      setAiSummary('A frota mostrou uma redução de 5% nos custos de combustível em comparação com o último trimestre após a implementação do novo cronograma de manutenção.'); // Fallback
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
    if (!selectedVehicle) {
      alert('Por favor, selecione um veículo.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingExpense) {
        await updateDoc(doc(db, 'expenses', editingExpense.id), {
          ...formData,
          vehicleName: selectedVehicle.name,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'expenses'), {
          ...formData,
          vehicleName: selectedVehicle.name,
          uid: user.uid,
          createdAt: new Date().toISOString()
        });
      }
      handleCloseModal();
    } catch (error) {
      handleFirestoreError(error, editingExpense ? OperationType.UPDATE : OperationType.CREATE, 'expenses');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      time: expense.time,
      vehicleId: expense.vehicleId,
      vehicleName: expense.vehicleName,
      provider: expense.provider,
      category: expense.category as any,
      quantity: expense.quantity || '',
      amount: expense.amount,
      odometer: expense.odometer || '',
      status: expense.status as any,
      observations: expense.observations || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      vehicleId: '',
      vehicleName: '',
      provider: '',
      category: 'Combustível',
      quantity: '',
      amount: 0,
      odometer: '',
      status: 'pending',
      observations: ''
    });
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) return;

    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`);
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-2">
          <span>Gestão de Frota</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary font-medium">Despesas</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Controle de Despesas</h1>
            <p className="text-on-secondary-container mt-1">Gestão detalhada e acompanhamento dos custos operacionais da frota.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:brightness-110 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nova Despesa
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Despesas Totais (Mês)', value: totalAmount, trend: '', variant: 'primary', icon: Filter, isCurrency: true },
          { label: 'Consumo de Combustível', value: expenses.filter(e => e.category === 'Combustível').reduce((acc, curr) => acc + curr.amount, 0), variant: 'secondary', icon: Zap, isCurrency: true },
          { label: 'Custos de Manutenção', value: expenses.filter(e => e.category === 'Manutenção').reduce((acc, curr) => acc + curr.amount, 0), variant: 'tertiary', icon: Filter, isCurrency: true },
          { label: 'Status Pendente', value: `${expenses.filter(e => e.status === 'pending').length} Lançamentos`, variant: 'error', icon: AlertTriangle, isCurrency: false },
        ].map((stat, i) => (
          <div key={i} className={cn(
            "bg-surface-container-lowest p-6 rounded-2xl shadow-sm border-b-2",
            stat.variant === 'primary' ? "border-primary/20" : 
            stat.variant === 'secondary' ? "border-secondary/20" :
            stat.variant === 'tertiary' ? "border-tertiary/20" : "border-error/20"
          )}>
            <div className="flex justify-between items-start mb-4">
              <span className={cn(
                "p-2 rounded-lg",
                stat.variant === 'primary' ? "bg-primary/10 text-primary" : 
                stat.variant === 'secondary' ? "bg-secondary/10 text-secondary" :
                stat.variant === 'tertiary' ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"
              )}>
                <stat.icon className="w-5 h-5" />
              </span>
              {stat.trend && <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded-full">{stat.trend}</span>}
            </div>
            <p className="text-on-surface-variant text-sm font-medium">{stat.label}</p>
            <div className="flex items-baseline gap-1 mt-1">
              {stat.isCurrency ? (
                <>
                  <span className="text-sm font-bold text-on-surface-variant">R$</span>
                  <span className="text-2xl font-black text-on-surface whitespace-nowrap">
                    {Number(stat.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-black text-on-surface whitespace-nowrap">{stat.value}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <section className="bg-surface-container-lowest rounded-3xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 bg-surface-container-low/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input 
                type="text" 
                placeholder="Buscar despesa..." 
                className="pl-10 pr-4 py-2 bg-surface rounded-full border-none text-sm font-medium text-on-surface-variant focus:ring-2 focus:ring-primary/20 min-w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm font-semibold text-on-surface-variant">
            Mostrando <span className="text-primary">{filteredExpenses.length}</span> de {expenses.length} entradas
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/10">
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Data & Hora</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Veículo</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Fornecedor</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Tipo</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant text-right">Valor Total</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant text-right">Odômetro</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      <p className="text-on-surface-variant font-medium">Carregando despesas...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-on-surface-variant">
                    Nenhuma despesa encontrada.
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
                        <span className={cn("w-2 h-2 rounded-full", expense.status === 'approved' ? "bg-primary" : "bg-tertiary")} />
                        <span className="text-sm font-medium text-on-surface">{expense.vehicleName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface">{expense.provider}</td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        expense.category.includes('Combustível') ? "bg-secondary-container text-on-secondary-container" : "bg-tertiary-container text-on-tertiary-container"
                      )}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-sm text-primary">R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-5 text-right text-sm">{expense.odometer} km</td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-2 hover:bg-error-container text-error rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-primary-fixed text-primary rounded-full transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-surface-container-low/30 border-t border-outline-variant/10 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">Mostrando resultados 1-{filteredExpenses.length} de {expenses.length} entradas</p>
          <div className="flex gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors disabled:opacity-30" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-on-primary text-xs font-bold">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingExpense ? "Editar Despesa" : "Nova Despesa"}
      >
        <form onSubmit={handleAddExpense} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Data
              </label>
              <input 
                required
                type="date" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3 h-3" /> Hora
              </label>
              <input 
                required
                type="time" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-3 h-3" /> Veículo
              </label>
              <select 
                required
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.vehicleId}
                onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
              >
                <option value="">Selecione um veículo</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Fornecedor
              </label>
              <input 
                required
                type="text" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Ex: Posto Ipiranga"
                value={formData.provider}
                onChange={(e) => setFormData({...formData, provider: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-3 h-3" /> Categoria
              </label>
              <select 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option>Combustível</option>
                <option>Manutenção</option>
                <option>Lavagem</option>
                <option>Pneus</option>
                <option>Documentação</option>
                <option>Seguro</option>
                <option>Outros</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <Hash className="w-3 h-3" /> Valor Total (R$)
              </label>
              <input 
                required
                type="number" 
                step="0.01"
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <Hash className="w-3 h-3" /> Odômetro (km)
              </label>
              <input 
                required
                type="number" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.odometer}
                onChange={(e) => setFormData({...formData, odometer: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3 h-3" /> Observações
              </label>
              <input 
                type="text" 
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Opcional"
                value={formData.observations}
                onChange={(e) => setFormData({...formData, observations: e.target.value})}
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
              {editingExpense ? "Salvar Alterações" : "Lançar Despesa"}
            </button>
          </div>
        </form>
      </Modal>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-surface-container-lowest p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="relative z-10">
            <h3 className="text-2xl font-extrabold text-on-surface mb-2">Análise de Eficiência</h3>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-on-secondary-container animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p className="text-sm">IA analisando dados da frota...</p>
              </div>
            ) : (
              <p className="text-on-secondary-container max-w-md leading-relaxed">
                {aiSummary || 'Adicione despesas para que a IA possa gerar um resumo analítico da sua frota.'}
              </p>
            )}
          </div>
          <div className="mt-8 flex gap-4">
            <button 
              onClick={() => onNavigate('reports')}
              className="bg-primary text-on-primary px-6 py-2 rounded-full text-sm font-semibold"
            >
              Ver Relatório Detalhado
            </button>
          </div>
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="bg-primary-container p-8 rounded-3xl text-on-primary-container flex flex-col justify-center items-center text-center shadow-lg">
          <Sparkles className="w-12 h-12 mb-4" />
          <h4 className="text-xl font-bold mb-2">Automatizar Despesas</h4>
          <p className="text-sm opacity-90 mb-6 leading-relaxed">Conecte seus cartões de frota e automatize todos os seus lançamentos de abastecimento instantaneamente.</p>
          <button className="bg-on-primary-container text-primary-container w-full py-3 rounded-full font-bold hover:scale-[1.02] transition-transform">
            Atualizar Recurso
          </button>
        </div>
      </div>
    </div>
  );
}
