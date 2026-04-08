import React from 'react';
import { LucideIcon } from 'lucide-react';
import KpiCard from './KpiCard';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  trend?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'error';
}

export default function MetricCard({ label, value, subValue, icon: Icon, trend, variant = 'primary' }: MetricCardProps) {
  return <KpiCard label={label} value={value} icon={Icon} tone={variant === 'error' ? 'danger' : variant} helperText={subValue || trend} />;
}
