import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Filter, TrendingUp, Star, Bell, CheckCircle, Truck, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Expense, Vehicle } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import { cn } from '../lib/utils';

export default function Reports() {
  const { user, userProfile } = useFirebase();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (!user || !userProfile) return;

    const isAdmin = userProfile.role === 'admin';

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
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'vehicles');
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeVehicles();
    };
  }, [user, userProfile]);

  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    
    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (expenseDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (expenseDate > end) return false;
    }

    // Vehicle filter
    if (vehicleFilter !== 'all' && expense.vehicleId !== vehicleFilter) return false;

    // Category filter
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false;

    return true;
  });

  const totalFilteredExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const maintenanceAlerts = vehicles.filter(v => v.nextMaintenance && new Date(v.nextMaintenance) < new Date()).length;
  const activeFleetPercentage = vehicles.length > 0 ? Math.round((vehicles.filter(v => v.status === 'active').length / vehicles.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-on-surface-variant font-bold text-lg">Gerando Relatórios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Espaço de Trabalho Analítico</span>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mt-2">Relatórios da Frota</h2>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
        <div className="bg-surface-container-low rounded-xl p-5 flex flex-col gap-2 md:col-span-2">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Intervalo de Datas (Calendário)</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-transparent text-on-surface font-medium cursor-pointer focus:outline-none text-sm"
              />
              <Calendar className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-primary pointer-events-none opacity-50" />
            </div>
            <span className="text-[10px] font-black text-outline uppercase">até</span>
            <div className="flex-1 relative">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-transparent text-on-surface font-medium cursor-pointer focus:outline-none text-sm"
              />
              <Calendar className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-primary pointer-events-none opacity-50" />
            </div>
          </div>
        </div>
        <div className="bg-surface-container-low rounded-xl p-5 flex flex-col gap-2">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Selecionar Veículo</label>
          <div className="relative">
            <select 
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="w-full bg-transparent text-on-surface font-medium appearance-none cursor-pointer focus:outline-none"
            >
              <option value="all">Todos os Veículos ({vehicles.length})</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
          </div>
        </div>
        <div className="bg-surface-container-low rounded-xl p-5 flex flex-col gap-2">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Tipo de Despesa</label>
          <div className="relative">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-transparent text-on-surface font-medium appearance-none cursor-pointer focus:outline-none"
            >
              <option value="all">Todas as Categorias</option>
              <option value="Combustível">Combustível</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Lavagem">Lavagem</option>
              <option value="Pneus">Pneus</option>
              <option value="Documentação">Documentação</option>
              <option value="Seguro">Seguro</option>
              <option value="Outros">Outros</option>
            </select>
            <Filter className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
          </div>
        </div>
        <div className="bg-primary-container/10 border border-primary-container/20 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Gasto Filtrado</p>
            <p className="text-2xl font-black text-on-primary-container">R$ {totalFilteredExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-2xl font-bold text-on-surface">Relatório de Despesas</h3>
          <div className="h-px flex-1 bg-outline-variant/30" />
          <span className="text-sm font-medium text-on-surface-variant">Mostrando {filteredExpenses.length} transações</span>
        </div>
        <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Veículo</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Valor</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant font-medium">Nenhuma despesa encontrada com os filtros selecionados.</td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-primary-fixed-dim/5 transition-colors">
                    <td className="px-6 py-5 text-sm font-medium">{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-5 text-sm font-bold text-primary">{expense.vehicleName}</td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                        expense.category.includes('Combustível') ? "bg-tertiary-container text-on-tertiary-container" : "bg-secondary-container text-on-secondary-container"
                      )}>{expense.category}</span>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-right">R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                        <span className={cn("w-2 h-2 rounded-full", expense.status === 'approved' ? "bg-primary" : "bg-tertiary")} /> 
                        {expense.status === 'approved' ? 'Aprovado' : 'Pendente'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-2xl font-bold text-on-surface">Relatório de Eficiência de Veículos</h3>
          <div className="h-px flex-1 bg-outline-variant/30" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/20">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h4 className="text-lg font-bold">Ativo em Destaque</h4>
                <p className="text-sm text-on-surface-variant">Veículo com maior quilometragem registrada</p>
              </div>
              <Star className="w-8 h-8 text-primary" />
            </div>
            {vehicles.length > 0 ? (
              <div className="flex items-center gap-8">
                <div className="w-48 h-32 rounded-xl bg-surface overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1591768793355-74d7c789c417?auto=format&fit=crop&q=80&w=400" 
                    alt="Veículo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-primary">{vehicles.sort((a, b) => b.km - a.km)[0].plate}</span>
                    <span className="text-xs font-bold bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded uppercase">{vehicles.sort((a, b) => b.km - a.km)[0].type}</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-[100%]" />
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    <span>Quilometragem Total</span>
                    <span>{vehicles.sort((a, b) => b.km - a.km)[0].km.toLocaleString()} km</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-on-surface-variant italic">Nenhum veículo cadastrado para análise.</p>
            )}
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex-1 bg-tertiary-container/5 rounded-2xl p-6 border border-tertiary-container/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-tertiary uppercase tracking-wider">Alertas de Manutenção</p>
                <p className="text-3xl font-black text-on-tertiary-container">{maintenanceAlerts.toString().padStart(2, '0')}</p>
              </div>
              <Bell className="w-10 h-10 text-tertiary" />
            </div>
            <div className="flex-1 bg-secondary-container/10 rounded-2xl p-6 border border-secondary-container/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-on-secondary-container uppercase tracking-wider">Frota Ativa</p>
                <p className="text-3xl font-black text-on-secondary-container">{activeFleetPercentage}%</p>
              </div>
              <CheckCircle className="w-10 h-10 text-secondary" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
