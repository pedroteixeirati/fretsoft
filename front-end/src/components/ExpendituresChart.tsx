import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ExpenditureChartItem {
  id: string;
  name: string;
  label: string;
  value: number;
  color: string;
}

interface ExpendituresChartProps {
  data: ExpenditureChartItem[];
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function ExpendituresChart({ data }: ExpendituresChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[1.8rem] border border-dashed border-outline-variant/40 bg-surface-container-low/50 px-6 text-center">
        <div className="space-y-2">
          <p className="text-sm font-bold text-on-surface">
            Ainda nao ha custos suficientes para comparar a frota.
          </p>
          <p className="text-xs text-on-surface-variant">
            Lance custos operacionais vinculados a veiculos para visualizar o ranking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e3d8" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 700, fill: '#454839' }}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;

              const datum = payload[0].payload as ExpenditureChartItem;

              return (
                <div className="rounded-xl bg-on-surface px-3 py-2 text-surface shadow-lg">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-surface/70">
                    {datum.name}
                  </p>
                  <p className="mt-1 text-xs font-bold">
                    {currencyFormatter.format(datum.value)}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
            {data.map((entry) => (
              <Cell key={entry.id} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
