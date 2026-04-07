import React from 'react';
import { FileText, Route, Wallet } from 'lucide-react';
import { useReportsData } from './useReportsData';
import { EmptyText, ExecutiveRow, MetricBox, Panel, ProgressRow } from './ReportsSharedComponents';

type ReportsFinancialProps = {
  data: ReturnType<typeof useReportsData>;
};

export default function ReportsFinancial({ data }: ReportsFinancialProps) {
  return (
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
                <p className={`font-black ${item.margin >= 0 ? 'text-primary' : 'text-error'}`}>R$ {item.margin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
