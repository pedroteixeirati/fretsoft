import React, { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Building2, Calendar, CheckCircle, FileText, Filter, Loader2, RefreshCw, Route, Truck, Wallet } from 'lucide-react';
import { companiesApi, contractsApi, expensesApi, freightsApi, payablesApi, revenuesApi, vehiclesApi } from '../lib/api';
import { cn } from '../lib/utils';
import { Company, Contract, Expense, Freight, Payable, Revenue, Vehicle } from '../types';

type ReportTab = 'financial' | 'operational' | 'managerial';

function toDateInputValue(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatDatePtBr(value: string) {
  if (!value) return 'dd/mm/aaaa';
  const parsed = parseLocalDate(value);
  if (Number.isNaN(parsed.getTime())) return 'dd/mm/aaaa';
  return parsed.toLocaleDateString('pt-BR');
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function getMonthLabel(reference: Date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(reference);
}

function getCalendarDays(reference: Date) {
  const firstDay = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const lastDay = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  const days: Date[] = [];

  for (let index = firstDay.getDay(); index > 0; index -= 1) {
    days.push(new Date(reference.getFullYear(), reference.getMonth(), 1 - index));
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(reference.getFullYear(), reference.getMonth(), day));
  }

  while (days.length % 7 !== 0) {
    const nextDay = days.length - lastDay.getDate() - firstDay.getDay() + 1;
    days.push(new Date(reference.getFullYear(), reference.getMonth() + 1, nextDay));
  }

  return days;
}

function getCurrentMonthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

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

function DateFilterInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = value ? parseLocalDate(value) : new Date();
  const [viewDate, setViewDate] = useState(selectedDate);
  const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  useEffect(() => {
    setViewDate(selectedDate);
  }, [value]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const calendarDays = getCalendarDays(viewDate);

  return (
    <div ref={rootRef} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 pr-9 text-left text-on-surface font-medium text-sm"
      >
        <span className="block truncate">
          {formatDatePtBr(value)}
        </span>
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none opacity-60" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-[18rem] rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              className="rounded-full border border-outline-variant p-2 text-on-surface-variant transition hover:border-primary hover:text-primary"
              aria-label="Mes anterior"
            >
              <Calendar className="h-4 w-4 rotate-90" />
            </button>
            <p className="text-sm font-bold capitalize text-on-surface">{getMonthLabel(viewDate)}</p>
            <button
              type="button"
              onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              className="rounded-full border border-outline-variant p-2 text-on-surface-variant transition hover:border-primary hover:text-primary"
              aria-label="Proximo mes"
            >
              <Calendar className="h-4 w-4 -rotate-90" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
            {weekdayLabels.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const isoValue = toDateInputValue(day);
              const isCurrentMonth = day.getMonth() === viewDate.getMonth();
              const isSelected = isoValue === value;

              return (
                <button
                  key={isoValue}
                  type="button"
                  onClick={() => {
                    onChange(isoValue);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-xl text-sm transition',
                    isSelected
                      ? 'bg-primary text-on-primary font-bold'
                      : isCurrentMonth
                        ? 'text-on-surface hover:bg-primary/10'
                        : 'text-on-surface-variant/50 hover:bg-surface-container'
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
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
  const [payables, setPayables] = useState<Payable[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [freights, setFreights] = useState<Freight[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<ReportTab>('financial');
  const [startDate, setStartDate] = useState(() => {
    const { start } = getCurrentMonthRange();
    return toDateInputValue(start);
  });
  const [endDate, setEndDate] = useState(() => {
    const { end } = getCurrentMonthRange();
    return toDateInputValue(end);
  });
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  const loadReports = useEffectEvent(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setLoadError('');

    try {
      const results = await Promise.allSettled([
        expensesApi.list(),
        payablesApi.list(),
        vehiclesApi.list(),
        contractsApi.list(),
        freightsApi.list(),
        revenuesApi.list(),
        companiesApi.list(),
      ]);

      const [expenseResult, payableResult, vehicleResult, contractResult, freightResult, revenueResult, companyResult] = results;
      let hasFailure = false;

      if (expenseResult.status === 'fulfilled') setExpenses(expenseResult.value ?? []);
      else hasFailure = true;

      if (payableResult.status === 'fulfilled') setPayables(payableResult.value ?? []);
      else hasFailure = true;

      if (vehicleResult.status === 'fulfilled') setVehicles(vehicleResult.value ?? []);
      else hasFailure = true;

      if (contractResult.status === 'fulfilled') setContracts(contractResult.value ?? []);
      else hasFailure = true;

      if (freightResult.status === 'fulfilled') setFreights(freightResult.value ?? []);
      else hasFailure = true;

      if (revenueResult.status === 'fulfilled') setRevenues(revenueResult.value ?? []);
      else hasFailure = true;

      if (companyResult.status === 'fulfilled') setCompanies(companyResult.value ?? []);
      else hasFailure = true;

      if (hasFailure) {
        setLoadError('Alguns dados do relatorio nao puderam ser atualizados. A exibicao foi mantida com o que carregou com sucesso.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  });

  useEffect(() => {
    void loadReports('initial');
  }, []);

  useEffect(() => {
    const handleWindowFocus = () => {
      void loadReports('refresh');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadReports('refresh');
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const isWithinDateRange = (value?: string) => {
    if (!value) return false;
    const current = /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseLocalDate(value) : new Date(value);
    if (Number.isNaN(current.getTime())) return false;
    const start = parseLocalDate(startDate);
    start.setHours(0, 0, 0, 0);
    const end = parseLocalDate(endDate);
    end.setHours(23, 59, 59, 999);
    return current >= start && current <= end;
  };

  const filteredExpenses = useMemo(() => (
    expenses.filter((expense) => {
      if (!isWithinDateRange(expense.costDate || expense.date)) return false;
      if (vehicleFilter !== 'all' && expense.vehicleId !== vehicleFilter) return false;
      return true;
    })
  ), [expenses, startDate, endDate, vehicleFilter]);

  const filteredPayables = useMemo(() => (
    payables.filter((payable) => {
      if (!isWithinDateRange(payable.dueDate)) return false;
      if (vehicleFilter !== 'all' && payable.vehicleId !== vehicleFilter) return false;
      return true;
    })
  ), [payables, startDate, endDate, vehicleFilter]);

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

  const filteredRevenues = useMemo(() => (
    revenues.filter((revenue) => {
      if (!isWithinDateRange(revenue.dueDate)) return false;
      if (companyFilter !== 'all' && revenue.companyId !== companyFilter) return false;
      if (vehicleFilter !== 'all' && revenue.sourceType === 'freight') {
        const relatedFreight = freights.find((freight) => freight.id === revenue.freightId);
        if (!relatedFreight || relatedFreight.vehicleId !== vehicleFilter) return false;
      }
      if (vehicleFilter !== 'all' && revenue.sourceType === 'contract') {
        const relatedContract = contracts.find((contract) => contract.id === revenue.contractId);
        if (!relatedContract || !(relatedContract.vehicleIds || []).includes(vehicleFilter)) return false;
      }
      return true;
    })
  ), [revenues, startDate, endDate, companyFilter, vehicleFilter, freights, contracts]);

  const totalOperationalCosts = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const activePayables = filteredPayables.filter((item) => item.status !== 'canceled');
  const paidPayables = activePayables
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const openPayables = activePayables
    .filter((item) => ['open', 'overdue'].includes(item.status))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const overduePayables = activePayables
    .filter((item) => item.status === 'overdue')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const activeFinancialRevenues = filteredRevenues.filter((item) => item.status !== 'canceled');
  const contractRevenue = activeFinancialRevenues
    .filter((item) => item.sourceType === 'contract')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const freightRevenue = activeFinancialRevenues
    .filter((item) => item.sourceType === 'freight')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const receivedRevenue = activeFinancialRevenues
    .filter((item) => item.status === 'received')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const openRevenue = activeFinancialRevenues
    .filter((item) => ['pending', 'billed', 'overdue'].includes(item.status))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const overdueRevenue = activeFinancialRevenues
    .filter((item) => item.status === 'overdue')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const projectedRevenue = contractRevenue + freightRevenue;
  const netResult = receivedRevenue - paidPayables;
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
    { id: 'financial', label: 'Relatorio Financeiro', description: 'Contas a receber, custos operacionais, contas a pagar e saldo realizado.' },
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Espaco de Trabalho Analitico</span>
            <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mt-2">Relatorios da Transportadora</h2>
            <p className="text-on-surface-variant mt-2">
              Separe a leitura por area de decisao para enxergar o financeiro, a operacao e a gestao do negocio com mais clareza.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadReports('refresh')}
            className="inline-flex items-center gap-2 self-start rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface transition hover:border-primary/40"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Atualizar dados
          </button>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {loadError}
          </div>
        )}

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
          <div className="flex items-end gap-3 flex-nowrap">
            <DateFilterInput value={startDate} onChange={setStartDate} />
            <DateFilterInput value={endDate} onChange={setEndDate} />
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
            <MetricBox label="Fretes faturados" value={`R$ ${freightRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Route} />
            <MetricBox label="Contratos faturados" value={`R$ ${contractRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={FileText} />
            <MetricBox label="Contas pagas no periodo" value={`R$ ${paidPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} />
            <MetricBox label="Saldo realizado" value={`R$ ${netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} highlight={netResult >= 0} />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Panel title="Composicao financeira">
              <div className="space-y-4">
                <ProgressRow label="Fretes avulsos" value={freightRevenue} total={Math.max(projectedRevenue, 1)} />
                <ProgressRow label="Contratos recorrentes faturados" value={contractRevenue} total={Math.max(projectedRevenue, 1)} />
                <ProgressRow label="Carteira em aberto" value={openRevenue} total={Math.max(projectedRevenue, 1)} />
                <ProgressRow label="Custos operacionais registrados" value={totalOperationalCosts} total={Math.max(projectedRevenue, 1)} tone="danger" />
                <ProgressRow label="Contas a pagar em aberto" value={openPayables} total={Math.max(projectedRevenue, 1)} tone="danger" />
              </div>
            </Panel>
            <Panel title="Indicadores de saida">
              <div className="space-y-4 text-sm">
                <ExecutiveRow label="Recebido no periodo" value={`R$ ${receivedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <ExecutiveRow label="Custos operacionais registrados" value={`R$ ${totalOperationalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <ExecutiveRow label="Contas pagas no periodo" value={`R$ ${paidPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <ExecutiveRow label="Contas a pagar em aberto" value={`R$ ${openPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <ExecutiveRow label="Contas vencidas" value={`R$ ${overduePayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </div>
            </Panel>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Panel title="Rentabilidade por veiculo">
              <div className="space-y-4">
                {vehiclePerformance.length === 0 ? (
                  <EmptyText text="Nenhum veiculo com movimentacao no periodo." />
                ) : vehiclePerformance.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 border-b border-outline-variant/30 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-bold text-on-surface">{item.label}</p>
                      <p className="text-xs text-on-surface-variant">{item.trips} frete(s) e custo operacional R$ {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
            <MetricBox label="Carteira recorrente mensal" value={`R$ ${contracts.filter((item) => item.status === 'active').reduce((sum, item) => sum + Number(item.monthlyValue || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} />
            <MetricBox label="Contas vencidas" value={`R$ ${overduePayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={CheckCircle} highlight={overduePayables === 0} />
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
                <ExecutiveRow label="Custos operacionais registrados" value={`${filteredExpenses.length} lancamento(s)`} />
                <ExecutiveRow label="Contas a pagar em aberto" value={`${activePayables.filter((item) => item.status === 'open').length} titulo(s)`} />
                <ExecutiveRow label="Contas pagas no periodo" value={`R$ ${paidPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <ExecutiveRow label="Contas a receber em aberto" value={`R$ ${openRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
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
