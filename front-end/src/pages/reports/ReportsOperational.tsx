import React from 'react';
import { Filter, Route, Truck } from 'lucide-react';
import { useReportsData } from './useReportsData';

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
    <div className={`rounded-3xl border p-6 shadow-sm ${highlight ? 'border-primary/20 bg-primary-container/20' : 'border-outline-variant bg-surface-container-lowest'}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-on-surface-variant">{label}</p>
        <Icon className={`h-5 w-5 ${highlight ? 'text-primary' : 'text-on-surface-variant'}`} />
      </div>
      <p className="text-3xl font-black text-on-surface">{value}</p>
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

type ReportsOperationalProps = {
  data: ReturnType<typeof useReportsData>;
};

export default function ReportsOperational({ data }: ReportsOperationalProps) {
  return (
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
  );
}
