import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Calendar, CheckCircle, FileText, Filter, Loader2, Route, TrendingDown, Truck, Wallet } from 'lucide-react';
import { companiesApi, contractsApi, expensesApi, freightsApi, vehiclesApi } from '../lib/api';
import { cn } from '../lib/utils';
import { Company, Contract, Expense, Freight, Vehicle } from '../types';

type ReportTab = 'financial' | 'operational' | 'managerial';

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6">
      <h3 className="text-xl font-bold text-on-surface mb-5">{title}</h3>
      {children}
    </section>
  );
}

function MetricBox({ label, value, icon: Icon, highlight }: { label: string; value: string; icon: React.ElementType; highlight?: boolean }) {
  return (
    <div className={cn('p-6 rounded-3xl border shadow-sm', highlight ? 'bg-primary-container/20 border-primary/20' : 'bg-surface-container-lowest border-outline-variant')}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-on-surface-variant">{label}</p>
        <Icon className={cn('w-5 h-5', highlight ? 'text-primary' : 'text-on-surface-variant')} />
      </div>
      <p className="text-3xl font-black text-on-surface">{value}</p>
    </div>
  );
}

function ProgressRow({ label, value, total, tone = 'default' }: { label: string; value: number; total: number; tone?: 'default' | 'danger' }) {
  const width = Math.min((value / Math.max(total, 1)) * 100, 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-on-surface">{label}</span>
        <span className="text-on-surface-variant">R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>
      <div className="h-3 bg-surface-container rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', tone === 'danger' ? 'bg-error' : 'bg-primary')} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ExecutiveRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-outline-variant/30 pb-3 last:border-b-0 last:pb-0">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-bold text-on-surface text-right">{value}</span>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="text-on-surface-variant text-sm">{text}</p>;
}

function MapMarkerIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z" />
      <circle cx="12" cy="11" r="3" />
    </svg>
  );
}

export default function Reports() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [freights, setFreights] = useState<Freight[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportTab>('financial');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const [expenseData, vehicleData, contractData, freightData, companyData] = await Promise.all([
          expensesApi.list(),
          vehiclesApi.list(),
          contractsApi.list(),
          freightsApi.list(),
          companiesApi.list(),
        ]);

        setExpenses(expenseData);
        setVehicles(vehicleData);
        setContracts(contractData);
        setFreights(freightData);
        setCompanies(companyData);
      } finally {
        setLoading(false);
      }
    };

    void loadReports();
  }, []);

  const isWithinDateRange = (value?: string) => {
    if (!value) return false;
    const current = new Date(value);
    if (Number.isNaN(current.getTime())) return false;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return current >= start && current <= end;
  };

  const filteredExpenses = useMemo(() => (
    expenses.filter((expense) => {
      if (!isWithinDateRange(expense.date)) return false;
      if (vehicleFilter !== 'all' && expense.vehicleId !== vehicleFilter) return false;
      return true;
    })
  ), [expenses, startDate, endDate, vehicleFilter]);

  const filteredFreights = useMemo(() => (
    freights.filter((freight) => {
      if (!isWithinDateRange(freight.date)) return false;
      if (vehicleFilter !== 'all' && freight.vehicleId !== vehicleFilter) return false;
      return true;
    })
  ), [freights, startDate, endDate, vehicleFilter]);

  const filteredContracts = useMemo(() => (
    contracts.filter((contract) => {
      const matchesDate = isWithinDateRange(contract.startDate) || isWithinDateRange(contract.endDate);
      if (!matchesDate) return false;
      if (companyFilter !== 'all' && contract.companyId !== companyFilter) return false;
      if (vehicleFilter !== 'all' && !(contract.vehicleIds || []).includes(vehicleFilter)) return false;
      return true;
    })
  ), [contracts, startDate, endDate, companyFilter, vehicleFilter]);

  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalFreights = filteredFreights.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalMonthlyContracts = filteredContracts.reduce((sum, item) => sum + Number(item.monthlyValue || 0), 0);
  const netResult = totalFreights + totalMonthlyContracts - totalExpenses;
  const activeVehicles = vehicles.filter((vehicle) => vehicle.status === 'active').length;
  const maintenanceAlerts = vehicles.filter((vehicle) => vehicle.nextMaintenance && new Date(vehicle.nextMaintenance) < new Date()).length;
  const activeContracts = contracts.filter((contract) => contract.status === 'active').length;
  const activeCompanies = companies.filter((company) => company.status === 'active').length;

  const routeRanking = useMemo(() => {
    const grouped = filteredFreights.reduce((acc, freight) => {
      const current = acc[freight.route] || { route: freight.route, trips: 0, revenue: 0 };
      current.trips += 1;
      current.revenue += Number(freight.amount || 0);
      acc[freight.route] = current;
      return acc;
    }, {} as Record<string, { route: string; trips: number; revenue: number }>);

    return (Object.values(grouped) as Array<{ route: string; trips: number; revenue: number }>)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredFreights]);

  const vehiclePerformance = useMemo(() => (
    vehicles.map((vehicle) => {
      const vehicleFreights = filteredFreights.filter((freight) => freight.vehicleId === vehicle.id);
      const vehicleExpenses = filteredExpenses.filter((expense) => expense.vehicleId === vehicle.id);
      const revenue = vehicleFreights.reduce((sum, freight) => sum + Number(freight.amount || 0), 0);
      const cost = vehicleExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      return {
        id: vehicle.id,
        label: `${vehicle.name} (${vehicle.plate})`,
        revenue,
        cost,
        margin: revenue - cost,
        trips: vehicleFreights.length,
      };
    }).sort((a, b) => b.margin - a.margin)
  ), [vehicles, filteredFreights, filteredExpenses]);

  const companyPerformance = useMemo(() => (
    companies.map((company) => {
      const companyContracts = filteredContracts.filter((contract) => contract.companyId === company.id);
      const monthlyRevenue = companyContracts.reduce((sum, contract) => sum + Number(contract.monthlyValue || 0), 0);
      return {
        id: company.id,
        name: company.corporateName,
        contracts: companyContracts.length,
        monthlyRevenue,
      };
    }).filter((item) => item.contracts > 0).sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
  ), [companies, filteredContracts]);

  const tabs: { id: ReportTab; label: string; description: string }[] = [
    { id: 'financial', label: 'Relatorio Financeiro', description: 'Receitas, despesas, saldo e rentabilidade.' },
    { id: 'operational', label: 'Relatorio Operacional', description: 'Viagens, rotas, uso da frota e manutencao.' },
    { id: 'managerial', label: 'Relatorio Gerencial', description: 'Visao consolidada de empresas, contratos e desempenho.' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-on-surface-variant font-bold text-lg">Gerando relatorios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Espaco de Trabalho Analitico</span>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mt-2">Relatorios da Transportadora</h2>
          <p className="text-on-surface-variant mt-2">
            Separe a leitura por area de decisao para enxergar o financeiro, a operacao e a gestao do negocio com mais clareza.
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 rounded-3xl border p-5 text-left transition-all',
                activeTab === tab.id
                  ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20'
                  : 'bg-surface-container-lowest border-outline-variant hover:border-primary/40'
              )}
            >
              <p className="font-black text-lg">{tab.label}</p>
              <p className={cn('text-sm mt-1', activeTab === tab.id ? 'text-on-primary/80' : 'text-on-surface-variant')}>
                {tab.description}
              </p>
            </button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-low rounded-xl p-5 flex flex-col gap-2 md:col-span-2">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Intervalo de datas</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-transparent text-on-surface font-medium cursor-pointer focus:outline-none text-sm" />
              <Calendar className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-primary pointer-events-none opacity-50" />
            </div>
            <span className="text-[10px] font-black text-outline uppercase">ate</span>
            <div className="flex-1 relative">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-transparent text-on-surface font-medium cursor-pointer focus:outline-none text-sm" />
              <Calendar className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-primary pointer-events-none opacity-50" />
            </div>
          </div>
        </div>
        <div className="bg-surface-container-low rounded-xl p-5 flex flex-col gap-2">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Veiculo</label>
          <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)} className="bg-transparent text-on-surface font-medium focus:outline-none">
            <option value="all">Todos os veiculos</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>{vehicle.name} ({vehicle.plate})</option>
            ))}
          </select>
        </div>
        <div className="bg-surface-container-low rounded-xl p-5 flex flex-col gap-2">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Empresa</label>
          <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="bg-transparent text-on-surface font-medium focus:outline-none">
            <option value="all">Todas as empresas</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>{company.corporateName}</option>
            ))}
          </select>
        </div>
      </section>

      {activeTab === 'financial' && (
        <div className="space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <MetricBox label="Fretes no periodo" value={`R$ ${totalFreights.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Route} />
            <MetricBox label="Repasse de contratos" value={`R$ ${totalMonthlyContracts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={FileText} />
            <MetricBox label="Despesas no periodo" value={`R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingDown} />
            <MetricBox label="Resultado liquido" value={`R$ ${netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} highlight={netResult >= 0} />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Panel title="Composicao financeira">
              <div className="space-y-4">
                <ProgressRow label="Fretes avulsos" value={totalFreights} total={Math.max(totalFreights + totalMonthlyContracts, 1)} />
                <ProgressRow label="Contratos ativos no periodo" value={totalMonthlyContracts} total={Math.max(totalFreights + totalMonthlyContracts, 1)} />
                <ProgressRow label="Despesas operacionais" value={totalExpenses} total={Math.max(totalFreights + totalMonthlyContracts, 1)} tone="danger" />
              </div>
            </Panel>
            <Panel title="Rentabilidade por veiculo">
              <div className="space-y-4">
                {vehiclePerformance.length === 0 ? (
                  <EmptyText text="Nenhum veiculo com movimentacao no periodo." />
                ) : vehiclePerformance.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 border-b border-outline-variant/30 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-bold text-on-surface">{item.label}</p>
                      <p className="text-xs text-on-surface-variant">{item.trips} frete(s) e custo R$ {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <p className={cn('font-black', item.margin >= 0 ? 'text-primary' : 'text-error')}>
                      R$ {item.margin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        </div>
      )}

      {activeTab === 'operational' && (
        <div className="space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <MetricBox label="Viagens no periodo" value={filteredFreights.length.toString()} icon={Route} />
            <MetricBox label="Frota ativa" value={`${activeVehicles}/${vehicles.length}`} icon={Truck} />
            <MetricBox label="Alertas de manutencao" value={maintenanceAlerts.toString()} icon={Filter} highlight={maintenanceAlerts === 0} />
            <MetricBox label="Rotas diferentes" value={routeRanking.length.toString()} icon={MapMarkerIcon} />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Panel title="Rotas com maior faturamento">
              <div className="space-y-4">
                {routeRanking.length === 0 ? (
                  <EmptyText text="Nenhum frete encontrado no intervalo." />
                ) : routeRanking.map((item) => (
                  <div key={item.route} className="flex items-center justify-between gap-4 border-b border-outline-variant/30 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-bold text-on-surface">{item.route}</p>
                      <p className="text-xs text-on-surface-variant">{item.trips} viagem(ns)</p>
                    </div>
                    <p className="font-black text-primary">R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Utilizacao da frota">
              <div className="space-y-4">
                {vehiclePerformance.length === 0 ? (
                  <EmptyText text="Nenhuma movimentacao operacional no intervalo." />
                ) : vehiclePerformance.slice(0, 5).map((item) => (
                  <div key={item.id}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-bold text-on-surface">{item.label}</span>
                      <span className="text-on-surface-variant">{item.trips} viagem(ns)</span>
                    </div>
                    <div className="h-3 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((item.trips / Math.max(filteredFreights.length, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        </div>
      )}

      {activeTab === 'managerial' && (
        <div className="space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <MetricBox label="Empresas ativas" value={activeCompanies.toString()} icon={Building2} />
            <MetricBox label="Contratos ativos" value={activeContracts.toString()} icon={FileText} />
            <MetricBox label="Receita recorrente mensal" value={`R$ ${contracts.filter((item) => item.status === 'active').reduce((sum, item) => sum + Number(item.monthlyValue || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} />
            <MetricBox label="Resultado consolidado" value={`R$ ${netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={CheckCircle} highlight={netResult >= 0} />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Panel title="Empresas com maior receita contratada">
              <div className="space-y-4">
                {companyPerformance.length === 0 ? (
                  <EmptyText text="Nenhuma empresa com contrato no intervalo atual." />
                ) : companyPerformance.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 border-b border-outline-variant/30 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-bold text-on-surface">{item.name}</p>
                      <p className="text-xs text-on-surface-variant">{item.contracts} contrato(s)</p>
                    </div>
                    <p className="font-black text-primary">R$ {item.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Resumo executivo">
              <div className="space-y-4 text-sm">
                <ExecutiveRow label="Fretes avulsos no periodo" value={`${filteredFreights.length} viagem(ns)`} />
                <ExecutiveRow label="Despesas registradas" value={`${filteredExpenses.length} lancamento(s)`} />
                <ExecutiveRow label="Veiculo com melhor margem" value={vehiclePerformance[0]?.label || '-'} />
                <ExecutiveRow label="Empresa com maior receita" value={companyPerformance[0]?.name || '-'} />
              </div>
            </Panel>
          </section>
        </div>
      )}
    </div>
  );
}
