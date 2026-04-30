import React from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import { cn } from '../../lib/utils';

type ConfirmDialogTone = 'default' | 'warning' | 'danger';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  icon?: React.ElementType;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

const toneConfig: Record<ConfirmDialogTone, {
  icon: React.ElementType;
  iconClassName: string;
  iconWrapperClassName: string;
  confirmVariant: 'primary' | 'danger';
}> = {
  default: {
    icon: HelpCircle,
    iconClassName: 'text-primary',
    iconWrapperClassName: 'bg-primary/10',
    confirmVariant: 'primary',
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: 'text-tertiary',
    iconWrapperClassName: 'bg-tertiary/10',
    confirmVariant: 'primary',
  },
  danger: {
    icon: AlertTriangle,
    iconClassName: 'text-error',
    iconWrapperClassName: 'bg-error/10',
    confirmVariant: 'danger',
  },
};

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'default',
  icon,
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const config = toneConfig[tone];
  const Icon = icon || config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => undefined : onClose}
      title={title}
      panelClassName="max-w-[min(92vw,460px)]"
      contentClassName="p-6"
    >
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <span className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', config.iconWrapperClassName)}>
            <Icon className={cn('h-5 w-5', config.iconClassName)} />
          </span>
          <div className="min-w-0 space-y-2">
            <p className="text-sm leading-6 text-on-surface-variant">{description}</p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/10 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-full"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={config.confirmVariant}
            disabled={isLoading}
            onClick={onConfirm}
            className="rounded-full"
          >
            {isLoading ? 'Processando...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export type { ConfirmDialogProps, ConfirmDialogTone };
