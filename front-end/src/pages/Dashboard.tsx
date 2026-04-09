import React, { useEffect, useMemo, useState } from 'react';
import MetricCard from '../components/MetricCard';
import { AlertTriangle, ArrowRight, CheckCircle, Loader2, TrendingUp } from 'lucide-react';
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
  const topVehicleCosts = useMemo(() => {
    const palette = ['#526600', '#8ca33e', '#a0b63f', '#dee2c9', '#c581ce'];
    const totalsByVehicle = new Map<
      string,
      { id: string; name: string; label: string; value: number }
    >();

    expenses.forEach((expense) => {
      const vehicle = vehicles.find((item) => item.id === expense.vehicleId);
      const id = expense.vehicleId || 'unlinked';
      const name = vehicle?.name || expense.vehicleName || 'Veiculo nao vinculado';
      const label = vehicle?.plate || expense.vehicleName || 'Sem vinculo';
      const current = totalsByVehicle.get(id);

      if (current) {
        current.value += Number(expense.amount || 0);
        return;
      }

      totalsByVehicle.set(id, {
        id,
        name,
        label,
        value: Number(expense.amount || 0),
      });
    });

    return [...totalsByVehicle.values()]
      .filter((item) => item.value > 0)
      .sort((left, right) => right.value - left.value)
      .slice(0, 5)
      .map((item, index) => ({
        ...item,
        color: palette[index % palette.length],
      }));
  }, [expenses, vehicles]);

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

          <ExpendituresChart data={topVehicleCosts} />

          <div className="mt-8 pt-8 border-t border-outline-variant/30 flex items-center justify-between gap-4">
            <p className="text-xs text-on-surface-variant/70">
              Ranking calculado a partir dos custos operacionais vinculados aos veiculos.
            </p>
            <div className="text-xs italic text-on-surface-variant/60 font-medium">Dados carregados na abertura da pagina</div>
          </div>
        </section>
      </div>

      {canReadExpenses ? (
        <section className="rounded-2xl bg-surface-container-low p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h5 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant">
                Pulso operacional
              </h5>
              <p className="mt-2 text-sm text-on-surface-variant">
                Acompanhamento das pendencias reais do modulo de custos operacionais.
              </p>
            </div>

            <button
              onClick={() => onNavigate('expenses')}
              className="text-primary font-bold text-xs flex items-center gap-1 hover:underline"
            >
              VER CUSTOS <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <PulseCard
              onClick={() => onNavigate('expenses')}
              icon={AlertTriangle}
              title="Pendencias operacionais"
              description={`${expenses.filter((expense) => expense.status === 'pending').length} custos operacionais pendentes de aprovacao.`}
              tone="error"
            />
            <PulseCard
              onClick={() => onNavigate('expenses')}
              icon={TrendingUp}
              title="Itens aprovados"
              description={`${expenses.filter((expense) => expense.status === 'approved').length} custos operacionais aprovados no sistema.`}
              tone="primary"
            />
          </div>
        </section>
      ) : null}
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
  tone: 'error' | 'primary';
}) {
  const toneClass =
    tone === 'error'
      ? 'bg-error-container text-error'
      : 'bg-primary-fixed text-primary';
  return (
    <div onClick={onClick} className="bg-surface p-4 rounded-xl flex items-center gap-4 transition-all hover:bg-surface-container-high cursor-pointer group">
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
