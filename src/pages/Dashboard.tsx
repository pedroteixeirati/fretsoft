import React, { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import { TrendingUp, CheckCircle, AlertTriangle, ArrowRight, Zap, Shield, Loader2 } from 'lucide-react';
import ExpendituresChart from '../components/ExpendituresChart';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Expense, Vehicle, Provider, NavItem } from '../types';
import { useFirebase } from '../context/FirebaseContext';

interface DashboardProps {
  onNavigate: (item: NavItem) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user, userProfile } = useFirebase();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !userProfile) return;

    const isAdmin = userProfile.role === 'admin';

    const qExpenses = isAdmin 
      ? collection(db, 'expenses') 
      : query(collection(db, 'expenses'), where('uid', '==', user.uid));
      
    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const expenseData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
      setExpenses(expenseData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'expenses');
    });

    const qVehicles = isAdmin 
      ? collection(db, 'vehicles') 
      : query(collection(db, 'vehicles'), where('uid', '==', user.uid));

    const unsubscribeVehicles = onSnapshot(qVehicles, (snapshot) => {
      const vehicleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[];
      setVehicles(vehicleData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'vehicles');
    });

    const qProviders = isAdmin 
      ? collection(db, 'providers') 
      : query(collection(db, 'providers'), where('uid', '==', user.uid));

    const unsubscribeProviders = onSnapshot(qProviders, (snapshot) => {
      const providerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Provider[];
      setProviders(providerData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'providers');
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeVehicles();
      unsubscribeProviders();
    };
  }, [user, userProfile]);

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const activeVehicles = vehicles.filter(v => v.status === 'active' || v.status === 'Ativo').length;
  
  // Find most expensive service
  const mostExpensiveExpense = expenses.length > 0 
    ? [...expenses].sort((a, b) => b.amount - a.amount)[0]
    : null;

  // Group expenses by type
  const expensesByType = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const expenseCategories = [
    { label: 'Combustível', value: expensesByType['Combustível'] || 0, color: 'bg-primary' },
    { label: 'Manutenção', value: expensesByType['Manutenção'] || 0, color: 'bg-primary-container' },
    { label: 'Seguro', value: expensesByType['Seguro'] || 0, color: 'bg-secondary-container' },
    { label: 'Outros', value: expensesByType['Outros'] || 0, color: 'bg-tertiary-container' },
  ];

  const maxCategoryValue = Math.max(...expenseCategories.map(c => c.value), 1);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-on-surface-variant font-medium">Carregando painel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">Desempenho da Frota</h2>
        <p className="text-on-surface-variant">Resumo financeiro operacional em tempo real.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          label="Despesas Totais"
          value={`R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          trend={`${expenses.length} registros no sistema`}
          variant="primary"
        />
        <MetricCard 
          label="Veículos Ativos"
          value={activeVehicles.toString()}
          icon={CheckCircle}
          trend={`${vehicles.length} veículos cadastrados`}
          variant="secondary"
        />
        <MetricCard 
          label="Serviço Mais Caro"
          value={mostExpensiveExpense ? mostExpensiveExpense.category : 'Nenhum'}
          subValue={mostExpensiveExpense ? `R$ ${mostExpensiveExpense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
          icon={AlertTriangle}
          trend="Atenção necessária"
          variant="tertiary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-surface-container-low p-8 rounded-xl">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h4 className="text-xl font-bold">Despesas por Serviço</h4>
              <p className="text-sm text-on-surface-variant mt-1">Detalhamento dos custos operacionais por categoria</p>
            </div>
            <button 
              onClick={() => onNavigate('reports')}
              className="text-primary font-bold text-xs flex items-center gap-1 hover:underline"
            >
              VER RELATÓRIO <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-6">
            {expenseCategories.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                  <span>{item.label}</span>
                  <span>R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="h-10 bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className={`${item.color} h-full rounded-full transition-all duration-1000`} 
                    style={{ width: `${(item.value / maxCategoryValue) * 100}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface-container p-8 rounded-xl flex flex-col">
          <div className="mb-10">
            <h4 className="text-xl font-bold">Maiores Gastos da Frota</h4>
            <p className="text-sm text-on-surface-variant mt-1">Análise de alocação de recursos por unidade específica</p>
          </div>
          
          <ExpendituresChart />

          <div className="mt-8 pt-8 border-t border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-primary rounded-full" />
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Carga Pesada</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-primary-container rounded-full" />
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Logística</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-tertiary-container rounded-full" />
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Não Programado</span>
              </div>
            </div>
            <div className="text-xs italic text-on-surface-variant/60 font-medium">Dados atualizados em tempo real</div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-4 space-y-4">
          <h5 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4">Pulso Operacional</h5>
          
          <div 
            onClick={() => onNavigate('expenses')}
            className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4 transition-all hover:bg-surface-container-high cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-error group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold">Alertas Críticos</p>
              <p className="text-[10px] text-on-surface-variant">
                {expenses.filter(e => e.status === 'pending' || e.status === 'Pendente').length} despesas pendentes de aprovação.
              </p>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('reports')}
            className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4 transition-all hover:bg-surface-container-high cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold">Meta de Eficiência</p>
              <p className="text-[10px] text-on-surface-variant">Monitoramento contínuo de consumo de combustível.</p>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('suppliers')}
            className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4 transition-all hover:bg-surface-container-high cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold">Auditoria de Fornecedor</p>
              <p className="text-[10px] text-on-surface-variant">
                {providers.length} fornecedores parceiros cadastrados.
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 h-full min-h-[320px] rounded-2xl overflow-hidden relative group">
          <img 
            src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=1200" 
            alt="Frota" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-10">
            <div className="text-on-primary">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Perspectiva Sustentável</p>
              <h4 className="text-3xl font-headline font-extrabold tracking-tight">O futuro da eficiência da frota é Oliva.</h4>
              <p className="mt-4 max-w-md text-sm opacity-90 leading-relaxed">Nossa transição para logística sustentável resultou em uma redução significativa nos custos de manutenção. Precisão encontra ecologia.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
