import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { companiesApi, contractsApi, expensesApi, freightsApi, payablesApi, revenuesApi, vehiclesApi } from '../../lib/api';
import { Company, Contract, Expense, Freight, Payable, Revenue, Vehicle } from '../../types';
import { getCurrentMonthRange, parseLocalDate, ReportTab, toDateInputValue } from './reports.shared';

export function useReportsData() {
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
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
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
      if (document.visibilityState === 'visible') void loadReports('refresh');
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
  const paidPayables = activePayables.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const openPayables = activePayables.filter((item) => ['open', 'overdue'].includes(item.status)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const overduePayables = activePayables.filter((item) => item.status === 'overdue').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const activeFinancialRevenues = filteredRevenues.filter((item) => item.status !== 'canceled');
  const contractRevenue = activeFinancialRevenues.filter((item) => item.sourceType === 'contract').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const freightRevenue = activeFinancialRevenues.filter((item) => item.sourceType === 'freight').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const receivedRevenue = activeFinancialRevenues.filter((item) => item.status === 'received').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const openRevenue = activeFinancialRevenues.filter((item) => ['pending', 'billed', 'overdue'].includes(item.status)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const projectedRevenue = contractRevenue + freightRevenue;
  const netResult = receivedRevenue - paidPayables;
  const activeVehicles = vehicles.filter((vehicle) => vehicle.status === 'active').length;
  const maintenanceAlerts = vehicles.filter((vehicle) => vehicle.nextMaintenance && new Date(vehicle.nextMaintenance) < new Date()).length;
  const activeContracts = contracts.filter((contract) => contract.status === 'active').length;
  const activeCompanies = companies.filter((company) => company.status === 'active').length;

  const routeRanking = useMemo(() => {
    const grouped = filteredFreights.reduce((acc, freight) => {
      const current = acc[freight.route] || { route: freight.route, trips: 0 };
      current.trips += 1;
      acc[freight.route] = current;
      return acc;
    }, {} as Record<string, { route: string; trips: number }>);

    return Object.values(grouped)
      .sort((a, b) => b.trips - a.trips || a.route.localeCompare(b.route, 'pt-BR'))
      .slice(0, 5);
  }, [filteredFreights]);

  const vehiclePerformance = useMemo(() => (
    vehicles.map((vehicle) => {
      const vehicleFreights = filteredFreights.filter((freight) => freight.vehicleId === vehicle.id);
      const vehicleExpenses = filteredExpenses.filter((expense) => expense.vehicleId === vehicle.id);
      const revenue = vehicleFreights.reduce((sum, freight) => sum + Number(freight.amount || 0), 0);
      const cost = vehicleExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      return { id: vehicle.id, label: `${vehicle.name} (${vehicle.plate})`, revenue, cost, margin: revenue - cost, trips: vehicleFreights.length };
    }).sort((a, b) => b.margin - a.margin)
  ), [vehicles, filteredFreights, filteredExpenses]);

  const companyPerformance = useMemo(() => (
    companies.map((company) => {
      const companyContracts = filteredContracts.filter((contract) => contract.companyId === company.id);
      const monthlyRevenue = companyContracts.reduce((sum, contract) => sum + Number(contract.monthlyValue || 0), 0);
      return { id: company.id, name: company.corporateName, contracts: companyContracts.length, monthlyRevenue };
    }).filter((item) => item.contracts > 0).sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
  ), [companies, filteredContracts]);

  return {
    activeTab, setActiveTab, startDate, setStartDate, endDate, setEndDate, vehicleFilter, setVehicleFilter, companyFilter, setCompanyFilter,
    loading, refreshing, loadError, loadReports, vehicles, companies, contracts,
    filteredExpenses, filteredFreights, totalOperationalCosts, activePayables, paidPayables, openPayables, overduePayables,
    contractRevenue, freightRevenue, receivedRevenue, openRevenue, projectedRevenue, netResult, activeVehicles, maintenanceAlerts,
    activeContracts, activeCompanies, routeRanking, vehiclePerformance, companyPerformance,
  };
}
