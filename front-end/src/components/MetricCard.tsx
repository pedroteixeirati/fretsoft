import React from 'react';
import { TrendingUp, CheckCircle, AlertTriangle, LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  trend?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'error';
}

export default function MetricCard({ label, value, subValue, icon: Icon, trend, variant = 'primary' }: MetricCardProps) {
  const borderColors = {
    primary: 'border-primary',
    secondary: 'border-primary-container',
    tertiary: 'border-tertiary',
    error: 'border-error'
  };

  const textColors = {
    primary: 'text-primary',
    secondary: 'text-on-surface',
    tertiary: 'text-tertiary',
    error: 'text-error'
  };

  return (
    <div className={cn(
      "bg-surface-container-lowest p-6 rounded-xl shadow-[32px_0_32px_rgba(26,28,21,0.04)] flex flex-col justify-between border-l-4",
      borderColors[variant]
    )}>
      <div>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">{label}</p>
        <h3 className={cn("font-headline text-3xl font-extrabold", textColors[variant])}>{value}</h3>
        {subValue && <p className="text-xs text-on-surface-variant mt-1">{subValue}</p>}
      </div>
      
      <div className="mt-4 flex items-center gap-2 text-xs font-semibold">
        <Icon className={cn("w-4 h-4", textColors[variant])} />
        <span className={textColors[variant]}>{trend}</span>
      </div>
    </div>
  );
}
