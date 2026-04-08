import React from 'react';
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileText,
  Fuel,
  Layers3,
  LucideIcon,
  Mail,
  MapPinned,
  Route,
  Truck,
  UserRound,
  Wallet,
  Wrench,
} from 'lucide-react';
import { cn } from '../lib/utils';

export type KpiTone = 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'neutral';

type KpiCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: KpiTone;
  helperText?: string;
  className?: string;
  valueClassName?: string;
};

function getValuePresentation(value: string | number) {
  const normalizedValue = String(value).trim();
  const isCurrency = normalizedValue.startsWith('R$');
  const isDateLike = /^\d{2}\/\d{2}\/\d{4}$/.test(normalizedValue);
  const isShortNumeric = /^\d+$/.test(normalizedValue);

  if (isCurrency) {
    return {
      sizeClass: 'text-[1.85rem] xl:text-[2rem]',
      trackingClass: 'tracking-[-0.035em]',
    };
  }

  if (isDateLike) {
    return {
      sizeClass: 'text-[1.45rem] xl:text-[1.55rem]',
      trackingClass: 'tracking-[-0.02em]',
    };
  }

  if (isShortNumeric) {
    return {
      sizeClass: 'text-[2.5rem] xl:text-[2.7rem]',
      trackingClass: 'tracking-[-0.05em]',
    };
  }

  return {
    sizeClass: 'text-[1.7rem] xl:text-[1.85rem]',
    trackingClass: 'tracking-[-0.03em]',
  };
}

function getCurrencyParts(value: string | number) {
  const normalizedValue = String(value).trim();
  if (!normalizedValue.startsWith('R$')) return null;

  return {
    prefix: 'R$',
    amount: normalizedValue.replace(/^R\$\s*/, ''),
  };
}

function getKpiIconSizeClass(label: string) {
  const normalized = normalizeKpiLabel(label);

  if (/(pendente|pendencias|atras|vencid|alerta|erro|risco)/.test(normalized)) return 'h-5.5 w-5.5';
  if (/(saldo|receita|fatur|custo|conta|valor|pag|receb|carteira|financeir)/.test(normalized)) return 'h-5 w-5';
  if (/(veiculo|frota|caminhao|viagem|rota|frete|combust|manutenc)/.test(normalized)) return 'h-5.5 w-5.5';
  if (/(empresa|transportadora|tenant|owner|fornecedor|parceiro|oficina|email|e-mail|contato)/.test(normalized)) return 'h-4.5 w-4.5';

  return 'h-5 w-5';
}

function normalizeKpiLabel(label: string) {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function resolveKpiIcon(label: string): LucideIcon {
  const normalized = normalizeKpiLabel(label);

  if (/(pendente|pendencias|atras|vencid|alerta|erro|risco)/.test(normalized)) return AlertTriangle;
  if (/(combust)/.test(normalized)) return Fuel;
  if (/(manutenc)/.test(normalized)) return Wrench;
  if (/(fornecedor|parceiro|oficina)/.test(normalized)) return BriefcaseBusiness;
  if (/(empresa|transportadora|tenant)/.test(normalized)) return Building2;
  if (/(owner)/.test(normalized)) return UserRound;
  if (/(contrato|plano)/.test(normalized)) return FileText;
  if (/(veiculo|frota|caminhao)/.test(normalized)) return Truck;
  if (/(viagem|rota|frete)/.test(normalized)) return Route;
  if (/(uf|estado|localiz)/.test(normalized)) return MapPinned;
  if (/(email|e-mail|contato)/.test(normalized)) return Mail;
  if (/(ativo|ativas|ativos|aprovad)/.test(normalized)) return CheckCircle2;
  if (/(saldo|receita|fatur|custo|conta|valor|pag|receb|carteira|financeir)/.test(normalized)) return Wallet;

  return Layers3;
}

export function resolveKpiTone(label: string): KpiTone {
  const normalized = normalizeKpiLabel(label);

  if (/(pendente|pendencias|atras|vencid|alerta|erro|risco)/.test(normalized)) return 'danger';
  if (/(combust)/.test(normalized)) return 'secondary';
  if (/(manutenc)/.test(normalized)) return 'tertiary';
  if (/(ativo|ativas|ativos|aprovad|recebid|ok)/.test(normalized)) return 'success';
  if (/(plano|owner|tenant|empresa|contrato)/.test(normalized)) return 'primary';

  return 'neutral';
}

const toneStyles: Record<KpiTone, { card: string; iconBox: string; icon: string }> = {
  primary: {
    card: 'border-primary/18 bg-surface-container-lowest',
    iconBox: 'bg-primary/10',
    icon: 'text-primary',
  },
  secondary: {
    card: 'border-secondary/18 bg-surface-container-lowest',
    iconBox: 'bg-secondary/10',
    icon: 'text-secondary',
  },
  tertiary: {
    card: 'border-tertiary/18 bg-surface-container-lowest',
    iconBox: 'bg-tertiary/10',
    icon: 'text-tertiary',
  },
  success: {
    card: 'border-primary/18 bg-surface-container-lowest',
    iconBox: 'bg-primary-fixed',
    icon: 'text-primary',
  },
  warning: {
    card: 'border-secondary/18 bg-surface-container-lowest',
    iconBox: 'bg-secondary-container',
    icon: 'text-on-secondary-container',
  },
  danger: {
    card: 'border-error/18 bg-surface-container-lowest',
    iconBox: 'bg-error/10',
    icon: 'text-error',
  },
  neutral: {
    card: 'border-outline-variant bg-surface-container-lowest',
    iconBox: 'bg-surface-container',
    icon: 'text-on-surface-variant',
  },
};

export default function KpiCard({
  label,
  value,
  icon,
  tone,
  helperText,
  className,
  valueClassName,
}: KpiCardProps) {
  const Icon = icon ?? resolveKpiIcon(label);
  const resolvedTone = tone ?? resolveKpiTone(label);
  const styles = toneStyles[resolvedTone];
  const valuePresentation = getValuePresentation(value);
  const currencyParts = getCurrencyParts(value);
  const cardHeightClass = currencyParts ? 'min-h-[138px]' : 'min-h-[128px]';
  const iconSizeClass = getKpiIconSizeClass(label);

  return (
    <article className={cn('flex flex-col rounded-[1.75rem] border px-6 py-4 shadow-sm', cardHeightClass, styles.card, className)}>
      <div className="mb-2.5 flex items-center justify-between gap-4">
        <h3 className="min-w-0 flex-1 truncate text-[1rem] font-medium leading-none text-on-surface">{label}</h3>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', styles.iconBox)}>
          <Icon className={cn(iconSizeClass, styles.icon)} />
        </span>
      </div>
      <div className="mt-0.5">
        {currencyParts ? (
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="shrink-0 text-[0.95rem] font-bold text-on-surface-variant">{currencyParts.prefix}</span>
            <p
              className={cn(
                'min-w-0 whitespace-nowrap font-black leading-[0.92] text-on-surface',
                valuePresentation.sizeClass,
                valuePresentation.trackingClass,
                valueClassName,
              )}
            >
              {currencyParts.amount}
            </p>
          </div>
        ) : (
          <p
            className={cn(
              'whitespace-nowrap font-black leading-[0.92] text-on-surface',
              valuePresentation.sizeClass,
              valuePresentation.trackingClass,
              valueClassName,
            )}
          >
            {value}
          </p>
        )}
        {helperText && <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-on-surface-variant">{helperText}</p>}
      </div>
    </article>
  );
}

export type { KpiCardProps };
