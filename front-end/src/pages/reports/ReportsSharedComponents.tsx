import React from 'react';
import { cn } from '../../lib/utils';

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6">
      <h3 className="mb-5 text-xl font-bold text-on-surface">{title}</h3>
      {children}
    </section>
  );
}

export function MetricBox({ label, value, icon: Icon, highlight }: { label: string; value: string; icon: React.ElementType; highlight?: boolean }) {
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

export function ProgressRow({ label, value, total, tone = 'default' }: { label: string; value: number; total: number; tone?: 'default' | 'danger' }) {
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

export function ExecutiveRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-outline-variant/30 pb-3 last:border-b-0 last:pb-0">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-right font-bold text-on-surface">{value}</span>
    </div>
  );
}

export function EmptyText({ text }: { text: string }) {
  return <p className="text-sm text-on-surface-variant">{text}</p>;
}

export function MapMarkerIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z" />
      <circle cx="12" cy="11" r="3" />
    </svg>
  );
}
