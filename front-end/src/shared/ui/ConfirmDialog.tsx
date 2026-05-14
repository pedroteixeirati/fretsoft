import React from 'react';
import { AlertTriangle, HelpCircle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib/utils';

export type ConfirmDialogTone = 'default' | 'warning' | 'danger';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: React.ReactNode;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  variant?: ConfirmDialogTone;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose?: () => void;
  onCancel?: () => void;
}

const variantConfig = {
  default: {
    icon: HelpCircle,
    iconClassName: 'bg-primary/10 text-primary',
    buttonClassName: 'bg-primary text-on-primary shadow-primary/20',
  },
  warning: {
    icon: Info,
    iconClassName: 'bg-tertiary/10 text-tertiary',
    buttonClassName: 'bg-tertiary text-on-tertiary shadow-tertiary/20',
  },
  danger: {
    icon: AlertTriangle,
    iconClassName: 'bg-error/10 text-error',
    buttonClassName: 'bg-error text-on-error shadow-error/20',
  },
} satisfies Record<ConfirmDialogTone, { icon: React.ElementType; iconClassName: string; buttonClassName: string }>;

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone,
  variant,
  isLoading = false,
  onConfirm,
  onClose,
  onCancel,
}: ConfirmDialogProps) {
  const dialogTone = variant || tone || 'default';
  const handleCancel = onCancel || onClose || (() => {});
  const config = variantConfig[dialogTone];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : handleCancel}
            className="absolute inset-0 bg-on-surface/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', config.iconClassName)}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 id="confirm-dialog-title" className="text-xl font-black tracking-tight text-on-surface">
                  {title}
                </h2>
                <div className="mt-2 text-sm leading-6 text-on-surface-variant">{message ?? description}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="rounded-full border border-outline-variant bg-surface px-5 py-3 text-sm font-bold text-on-surface transition hover:border-primary/20 hover:bg-primary/5 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={cn('rounded-full px-5 py-3 text-sm font-bold shadow-lg transition hover:scale-[1.01] active:scale-95 disabled:opacity-60', config.buttonClassName)}
              >
                {isLoading ? 'Processando...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
