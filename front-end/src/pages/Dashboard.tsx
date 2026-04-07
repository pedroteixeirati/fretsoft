import React, { useEffect, useMemo, useState } from 'react';
import MetricCard from '../components/MetricCard';
import { AlertTriangle, ArrowRight, CheckCircle, Loader2, Shield, TrendingUp, Zap } from 'lucide-react';
import ExpendituresChart from '../components/ExpendituresChart';
import { expensesApi, providersApi, vehiclesApi } from '../lib/api';
import { useFirebase } from '../context/FirebaseContext';
import { canAccess } from '../lib/permissions';
import { Expense, NavItem, Provider, Vehicle } from '../types';

interface DashboardProps {
  onNavigate: (item: NavItem) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { userProfile } = useFirebase();
  const canReadExpenses = canAccess(userProfile, 'expenses', 'read');
  const canReadVehicles = canAccess(userProfile, 'vehicles', 'read');
  const canReadProviders = canAccess(userProfile, 'providers', 'read');
  const canReadReports = canAccess(userProfile, 'reports', 'read');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [expensesData, vehiclesData, providersData] = await Promise.all([
          canReadExpenses ? expensesApi.list() : Promise.resolve([]),
          canReadVehicles ? vehiclesApi.list() : Promise.resolve([]),
          canReadProviders ? providersApi.list() : Promise.resolve([]),
        ]);
        setExpenses(expensesData);
        setVehicles(vehiclesData);
        setProviders(providersData);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [canReadExpenses, canReadVehicles, canReadProviders]);

  const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const activeVehicles = vehicles.filter((vehicle) => vehicle.status === 'active').length;
  const mostExpensiveExpense = expenses.length > 0 ? [...expenses].sort((a, b) => b.amount - a.amount)[0] : null;
  const expensesByType = useMemo(
    () =>
      expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>),
    [expenses]
  );

  const expenseCategories = [
    { label: 'Combustivel', value: expensesByType.Combustivel || 0, color: 'bg-primary' },
    { label: 'Manutencao', value: expensesByType.Manutencao || 0, color: 'bg-primary-container' },
    { label: 'Seguro', value: expensesByType.Seguro || 0, color: 'bg-secondary-container' },
    { label: 'Outros', value: expensesByType.Outros || 0, color: 'bg-tertiary-container' },
  ];
  const maxCategoryValue = Math.max(...expenseCategories.map((category) => category.value), 1);

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
        <p className="text-on-surface-variant">Visao consolidada da operacao e dos custos da frota em tempo real.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          label="Custos Operacionais"
          value={`R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          trend={`${expenses.length} registros no sistema`}
          variant="primary"
        />
        <MetricCard
          label="Veiculos Ativos"
          value={activeVehicles.toString()}
          icon={CheckCircle}
          trend={`${vehicles.length} veiculos cadastrados`}
          variant="secondary"
        />
        <MetricCard
          label="Servico Mais Caro"
          value={mostExpensiveExpense ? mostExpensiveExpense.category : 'Nenhum'}
          subValue={mostExpensiveExpense ? `R$ ${mostExpensiveExpense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
          icon={AlertTriangle}
          trend="Atencao necessaria"
          variant="tertiary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-surface-container-low p-8 rounded-xl">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h4 className="text-xl font-bold">Custos operacionais por categoria</h4>
              <p className="text-sm text-on-surface-variant mt-1">Detalhamento dos custos operacionais por categoria</p>
            </div>
            {canReadReports && (
              <button onClick={() => onNavigate('reports')} className="text-primary font-bold text-xs flex items-center gap-1 hover:underline">
                VER RELATORIO <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-6">
            {expenseCategories.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                  <span>{item.label}</span>
                  <span>R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="h-10 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className={`${item.color} h-full rounded-full transition-all duration-1000`} style={{ width: `${(item.value / maxCategoryValue) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface-container p-8 rounded-xl flex flex-col">
          <div className="mb-10">
            <h4 className="text-xl font-bold">Maiores custos da frota</h4>
            <p className="text-sm text-on-surface-variant mt-1">Analise de alocacao de recursos por unidade especifica</p>
          </div>

          <ExpendituresChart />

          <div className="mt-8 pt-8 border-t border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <LegendDot color="bg-primary" label="Carga Pesada" />
              <LegendDot color="bg-primary-container" label="Logistica" />
              <LegendDot color="bg-tertiary-container" label="Nao Programado" />
            </div>
            <div className="text-xs italic text-on-surface-variant/60 font-medium">Dados carregados na abertura da pagina</div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-4 space-y-4">
          <h5 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4">Pulso Operacional</h5>

          {canReadExpenses && (
            <PulseCard
              onClick={() => onNavigate('expenses')}
              icon={AlertTriangle}
              title="Pendencias operacionais"
              description={`${expenses.filter((expense) => expense.status === 'pending').length} custos operacionais pendentes de aprovacao.`}
              tone="error"
            />
          )}
          {canReadReports && (
            <PulseCard
              onClick={() => onNavigate('reports')}
              icon={Zap}
              title="Meta de Eficiencia"
              description="Monitoramento continuo de consumo de combustivel."
              tone="primary"
            />
          )}
          {canReadProviders && (
            <PulseCard
              onClick={() => onNavigate('suppliers')}
              icon={Shield}
              title="Auditoria de Fornecedor"
              description={`${providers.length} fornecedores parceiros cadastrados.`}
              tone="secondary"
            />
          )}
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
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Perspectiva Sustentavel</p>
              <h4 className="text-3xl font-headline font-extrabold tracking-tight">O futuro da eficiencia da frota e oliva.</h4>
              <p className="mt-4 max-w-md text-sm opacity-90 leading-relaxed">
                Nossa transicao para logistica sustentavel resultou em uma reducao significativa nos custos de manutencao. Precisao encontra ecologia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 ${color} rounded-full`} />
      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">{label}</span>
    </div>
  );
}

function PulseCard({
  onClick,
  icon: Icon,
  title,
  description,
  tone,
}: {
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  description: string;
  tone: 'error' | 'primary' | 'secondary';
}) {
  const toneClass = tone === 'error' ? 'bg-error-container text-error' : tone === 'primary' ? 'bg-primary-fixed text-primary' : 'bg-secondary-fixed text-secondary';
  return (
    <div onClick={onClick} className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4 transition-all hover:bg-surface-container-high cursor-pointer group">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${toneClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold">{title}</p>
        <p className="text-[10px] text-on-surface-variant">{description}</p>
      </div>
    </div>
  );
}
