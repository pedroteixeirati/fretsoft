import React from 'react';
import { Building2, CheckCircle, FileText, Wallet } from 'lucide-react';
import { useReportsData } from './useReportsData';
import { EmptyText, ExecutiveRow, MetricBox, Panel, ReportsEmptyState } from './ReportsSharedComponents';

type ReportsManagerialProps = {
  data: ReturnType<typeof useReportsData>;
};

export default function ReportsManagerial({ data }: ReportsManagerialProps) {
  if (data.filteredContracts.length === 0 && data.companyPerformance.length === 0) {
    return (
      <ReportsEmptyState
        title="Ainda nao ha dados gerenciais suficientes"
        description="Cadastre contratos e relacione empresas ao periodo filtrado para destravar esta visao consolidada da transportadora."
      />
    );
  }

  return (
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
            <ExecutiveRow label="Veiculo com melhor margem" value={data.vehiclePerformance[0]?.label || '-' } />
            <ExecutiveRow label="Empresa com maior receita" value={data.companyPerformance[0]?.name || '-' } />
          </div>
        </Panel>
      </section>
    </div>
  );
}
