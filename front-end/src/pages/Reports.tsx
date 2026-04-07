import React from 'react';
import { Building2, CheckCircle, FileText, Filter, Route, Truck, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';
import ReportsLayout from './reports/ReportsLayout';
import { useReportsData } from './reports/useReportsData';

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6">
      <h3 className="mb-5 text-xl font-bold text-on-surface">{title}</h3>
      {children}
    </section>
  );
}

function MetricBox({ label, value, icon: Icon, highlight }: { label: string; value: string; icon: React.ElementType; highlight?: boolean }) {
  return (
    <div className={cn('rounded-3xl border p-6 shadow-sm', highlight ? 'border-primary/20 bg-primary-container/20' : 'border-outline-variant bg-surface-container-lowest')}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-on-surface-variant">{label}</p>
        <Icon className={cn('h-5 w-5', highlight ? 'text-primary' : 'text-on-surface-variant')} />
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
      <div className="h-3 overflow-hidden rounded-full bg-surface-container">
        <div className={cn('h-full rounded-full', tone === 'danger' ? 'bg-error' : 'bg-primary')} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ExecutiveRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-outline-variant/30 pb-3 last:border-b-0 last:pb-0">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-right font-bold text-on-surface">{value}</span>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="text-sm text-on-surface-variant">{text}</p>;
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
  const data = useReportsData();

  return (
    <ReportsLayout
      activeTab={data.activeTab}
      onTabChange={data.setActiveTab}
      startDate={data.startDate}
      endDate={data.endDate}
      onStartDateChange={data.setStartDate}
      onEndDateChange={data.setEndDate}
      vehicleFilter={data.vehicleFilter}
      onVehicleFilterChange={data.setVehicleFilter}
      companyFilter={data.companyFilter}
      onCompanyFilterChange={data.setCompanyFilter}
      vehicles={data.vehicles}
      companies={data.companies}
      loading={data.loading}
      refreshing={data.refreshing}
      loadError={data.loadError}
      onRefresh={() => void data.loadReports('refresh')}
    >
      {data.activeTab === 'financial' && (
        <div className="space-y-8">
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <MetricBox label="Fretes faturados" value={`R$ ${data.freightRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Route} />
            <MetricBox label="Contratos faturados" value={`R$ ${data.contractRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={FileText} />
            <MetricBox label="Contas pagas no periodo" value={`R$ ${data.paidPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} />
            <MetricBox label="Saldo realizado" value={`R$ ${data.netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} highlight={data.netResult >= 0} />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Panel title="Composicao financeira">
              <div className="space-y-4">
                <ProgressRow label="Fretes avulsos" value={data.freightRevenue} total={Math.max(data.projectedRevenue, 1)} />
                <ProgressRow label="Contratos recorrentes faturados" value={data.contractRevenue} total={Math.max(data.projectedRevenue, 1)} />
                <ProgressRow label="Carteira em aberto" value={data.openRevenue} total={Math.max(data.projectedRevenue, 1)} />
                <ProgressRow label="Custos operacionais registrados" value={data.totalOperationalCosts} total={Math.max(data.projectedRevenue, 1)} tone="danger" />
                <ProgressRow label="Contas a pagar em aberto" value={data.openPayables} total={Math.max(data.projectedRevenue, 1)} tone="danger" />
              </div>
            </Panel>
            <Panel title="Indicadores de saida">
              <div className="space-y-4 text-sm">
                <ExecutiveRow label="Recebido no periodo" value={`R$ ${data.receivedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <ExecutiveRow label="Custos operacionais registrados" value={`R$ ${data.totalOperationalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <ExecutiveRow label="Contas pagas no periodo" value={`R$ ${data.paidPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <ExecutiveRow label="Contas a pagar em aberto" value={`R$ ${data.openPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <ExecutiveRow label="Contas vencidas" value={`R$ ${data.overduePayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </div>
            </Panel>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Panel title="Rentabilidade por veiculo">
              <div className="space-y-4">
                {data.vehiclePerformance.length === 0 ? (
                  <EmptyText text="Nenhum veiculo com movimentacao no periodo." />
                ) : data.vehiclePerformance.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 border-b border-outline-variant/30 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-bold text-on-surface">{item.label}</p>
                      <p className="text-xs text-on-surface-variant">{item.trips} frete(s) e custo operacional R$ {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <p className={cn('font-black', item.margin >= 0 ? 'text-primary' : 'text-error')}>R$ {item.margin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        </div>
      )}

      {data.activeTab === 'operational' && (
        <div className="space-y-8">
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <MetricBox label="Viagens no periodo" value={data.filteredFreights.length.toString()} icon={Route} />
            <MetricBox label="Frota ativa" value={`${data.activeVehicles}/${data.vehicles.length}`} icon={Truck} />
            <MetricBox label="Alertas de manutencao" value={data.maintenanceAlerts.toString()} icon={Filter} highlight={data.maintenanceAlerts === 0} />
            <MetricBox label="Rotas diferentes" value={data.routeRanking.length.toString()} icon={MapMarkerIcon} />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Panel title="Rotas mais frequentes">
              <div className="space-y-4">
                {data.routeRanking.length === 0 ? (
                  <EmptyText text="Nenhum frete encontrado no intervalo." />
                ) : data.routeRanking.map((item) => (
                  <div key={item.route} className="flex items-center justify-between gap-4 border-b border-outline-variant/30 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-bold text-on-surface">{item.route}</p>
                      <p className="text-xs text-on-surface-variant">Trecho operacional mais recorrente no periodo</p>
                    </div>
                    <p className="font-black text-primary">{item.trips} viagem(ns)</p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Utilizacao da frota">
              <div className="space-y-4">
                {data.vehiclePerformance.length === 0 ? (
                  <EmptyText text="Nenhuma movimentacao operacional no intervalo." />
                ) : data.vehiclePerformance.slice(0, 5).map((item) => (
                  <div key={item.id}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-bold text-on-surface">{item.label}</span>
                      <span className="text-on-surface-variant">{item.trips} viagem(ns)</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min((item.trips / Math.max(data.filteredFreights.length, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        </div>
      )}

      {data.activeTab === 'managerial' && (
        <div className="space-y-8">
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <MetricBox label="Empresas ativas" value={data.activeCompanies.toString()} icon={Building2} />
            <MetricBox label="Contratos ativos" value={data.activeContracts.toString()} icon={FileText} />
            <MetricBox label="Carteira recorrente mensal" value={`R$ ${data.contracts.filter((item) => item.status === 'active').reduce((sum, item) => sum + Number(item.monthlyValue || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} />
            <MetricBox label="Contas vencidas" value={`R$ ${data.overduePayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={CheckCircle} highlight={data.overduePayables === 0} />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Panel title="Empresas com maior receita contratada">
              <div className="space-y-4">
                {data.companyPerformance.length === 0 ? (
                  <EmptyText text="Nenhuma empresa com contrato no intervalo atual." />
                ) : data.companyPerformance.slice(0, 5).map((item) => (
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
                <ExecutiveRow label="Fretes avulsos no periodo" value={`${data.filteredFreights.length} viagem(ns)`} />
                <ExecutiveRow label="Custos operacionais registrados" value={`${data.filteredExpenses.length} lancamento(s)`} />
                <ExecutiveRow label="Contas a pagar em aberto" value={`${data.activePayables.filter((item) => item.status === 'open').length} titulo(s)`} />
                <ExecutiveRow label="Contas pagas no periodo" value={`R$ ${data.paidPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <ExecutiveRow label="Contas a receber em aberto" value={`R$ ${data.openRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <ExecutiveRow label="Veiculo com melhor margem" value={data.vehiclePerformance[0]?.label || '-'} />
                <ExecutiveRow label="Empresa com maior receita" value={data.companyPerformance[0]?.name || '-'} />
              </div>
            </Panel>
          </section>
        </div>
      )}
    </ReportsLayout>
  );
}
