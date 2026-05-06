import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Clock, Edit2, ExternalLink, FileText, MoreVertical, Trash2 } from 'lucide-react';
import Modal from '../../../components/Modal';
import { formatDateOnlyPtBr, formatDateTimePtBr } from '../../../lib/date';
import { cn } from '../../../lib/utils';
import { NovalogBilling, NovalogBillingItem } from '../types/novalog-billing.types';
import { formatNovalogCurrency } from '../utils/novalog.calculations';
import { novalogBillingItemStatusLabel, novalogBillingStatusClass, novalogBillingStatusLabel } from '../utils/novalog-billing-status';

interface NovalogBillingDetailsModalProps {
  isOpen: boolean;
  billing: NovalogBilling | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onCloseBilling: (billing: NovalogBilling) => void;
  onEdit: (billing: NovalogBilling) => void;
  onReceiveItem: (itemId: string) => void;
  onOverdueItem: (itemId: string) => void;
  onEditItem: (item: NovalogBillingItem) => void;
  onDeleteItem: (item: NovalogBillingItem) => void;
  onOpenRevenue?: (item: NovalogBillingItem) => void;
}

export default function NovalogBillingDetailsModal({
  isOpen,
  billing,
  isSubmitting = false,
  onClose,
  onCloseBilling,
  onEdit,
  onReceiveItem,
  onOverdueItem,
  onEditItem,
  onDeleteItem,
  onOpenRevenue,
}: NovalogBillingDetailsModalProps) {
  if (!billing) return null;
  const items = billing.items ?? [];
  const canOperateItems = billing.status !== 'draft' && billing.status !== 'canceled';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Faturamento ${billing.displayId ? `#${billing.displayId}` : 'Novalog'}`}
      panelClassName="max-w-[min(94vw,1320px)]"
      contentClassName="xl:px-6"
    >
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-4">
          <article className="rounded-[1.6rem] border border-outline-variant/15 bg-surface-container-lowest p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Cliente</p>
            <p className="mt-2 text-sm font-black text-on-surface">{billing.companyName}</p>
          </article>
          <article className="rounded-[1.6rem] border border-outline-variant/15 bg-surface-container-lowest p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Vencimento</p>
            <p className="mt-2 text-sm font-black text-on-surface">{formatDateOnlyPtBr(billing.dueDate)}</p>
          </article>
          <article className="rounded-[1.6rem] border border-outline-variant/15 bg-surface-container-lowest p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Total</p>
            <p className="mt-2 text-sm font-black text-primary">{formatNovalogCurrency(billing.totalAmount)}</p>
          </article>
          <article className="rounded-[1.6rem] border border-outline-variant/15 bg-surface-container-lowest p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Status</p>
            <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${novalogBillingStatusClass(billing.status)}`}>
              {novalogBillingStatusLabel(billing.status)}
            </span>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-primary/15 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Recebido</p>
            </div>
            <p className="mt-2 text-lg font-black text-on-surface">{formatNovalogCurrency(billing.receivedAmount)}</p>
          </article>
          <article className="rounded-[1.5rem] border border-tertiary/15 bg-tertiary/5 p-4">
            <div className="flex items-center gap-2 text-tertiary">
              <Clock className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Em aberto</p>
            </div>
            <p className="mt-2 text-lg font-black text-on-surface">{formatNovalogCurrency(billing.openAmount)}</p>
          </article>
          <article className="rounded-[1.5rem] border border-error/15 bg-error/5 p-4">
            <div className="flex items-center gap-2 text-error">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Em atraso</p>
            </div>
            <p className="mt-2 text-lg font-black text-on-surface">{formatNovalogCurrency(billing.overdueAmount)}</p>
          </article>
        </section>

        <section className="overflow-hidden rounded-[1.8rem] border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant/10 bg-surface-container-low px-5 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-on-surface">CT-es</h3>
            </div>
            <span className="text-xs font-bold text-on-surface-variant">{items.length} item(ns)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">CT-e</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Emissao</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Vencimento</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Valor</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Recebido</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Saldo</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-center">Status</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-center">Recebimento</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-center">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 text-sm font-bold text-on-surface">{item.cteNumber}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{item.issueDate ? formatDateOnlyPtBr(item.issueDate) : '-'}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{item.dueDate ? formatDateOnlyPtBr(item.dueDate) : formatDateOnlyPtBr(billing.dueDate)}</td>
                    <td className="px-5 py-4 text-right text-sm font-black text-primary">{formatNovalogCurrency(item.amount)}</td>
                    <td className="px-5 py-4 text-right text-sm font-bold text-on-surface">{formatNovalogCurrency(item.receivedAmount || 0)}</td>
                    <td className="px-5 py-4 text-right text-sm font-black text-primary">{formatNovalogCurrency(item.balanceAmount ?? item.amount)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${novalogBillingStatusClass(item.status)}`}>
                        {novalogBillingItemStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-semibold text-on-surface-variant">
                      {item.status === 'received' ? formatDateTimePtBr(item.receivedAt) : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="grid min-w-[148px] grid-cols-[6rem_2.25rem] items-center justify-center gap-2">
                        {canOperateItems && item.status !== 'received' && item.status !== 'partially_received' && item.status !== 'canceled' ? (
                          <button type="button" disabled={isSubmitting} onClick={() => (item.linkedRevenueId && onOpenRevenue ? onOpenRevenue(item) : onReceiveItem(item.id))} className="rounded-full bg-secondary-container px-3 py-2 text-[11px] font-bold text-on-secondary-container disabled:opacity-60">
                            Receber
                          </button>
                        ) : (
                          <span aria-hidden="true" />
                        )}
                        <NovalogBillingItemActionsMenu
                          item={item}
                          canOperateItems={canOperateItems}
                          isSubmitting={isSubmitting}
                          onOverdueItem={onOverdueItem}
                          onEditItem={onEditItem}
                          onDeleteItem={onDeleteItem}
                          onOpenRevenue={onOpenRevenue}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-outline-variant/10 pt-5 sm:flex-row sm:justify-end">
          {billing.status === 'draft' ? (
            <button type="button" onClick={() => onEdit(billing)} disabled={isSubmitting || !billing.items} className="rounded-full border border-outline-variant bg-surface px-5 py-3 text-sm font-bold text-on-surface transition hover:border-primary/20 hover:bg-primary/5 disabled:opacity-60">
              Editar
            </button>
          ) : null}
          {billing.status === 'draft' ? (
            <button type="button" onClick={() => onCloseBilling(billing)} disabled={isSubmitting} className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition hover:scale-[1.01] active:scale-95 disabled:opacity-60">
              Fechar e gerar recebiveis
            </button>
          ) : null}
          <button type="button" onClick={onClose} className="rounded-full border border-outline-variant bg-surface px-5 py-3 text-sm font-bold text-on-surface transition hover:border-primary/20 hover:bg-primary/5">
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface NovalogBillingItemActionsMenuProps {
  item: NovalogBillingItem;
  canOperateItems: boolean;
  isSubmitting: boolean;
  onOverdueItem: (itemId: string) => void;
  onEditItem: (item: NovalogBillingItem) => void;
  onDeleteItem: (item: NovalogBillingItem) => void;
  onOpenRevenue?: (item: NovalogBillingItem) => void;
}

function NovalogBillingItemActionsMenu({
  item,
  canOperateItems,
  isSubmitting,
  onOverdueItem,
  onEditItem,
  onDeleteItem,
  onOpenRevenue,
}: NovalogBillingItemActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const canEditItem = item.status !== 'received' && item.status !== 'partially_received' && item.status !== 'canceled';
  const canMarkOverdue = canOperateItems && item.status !== 'overdue' && canEditItem;
  const canOpenRevenue = Boolean(item.linkedRevenueId && onOpenRevenue);
  const hasActions = canMarkOverdue || canEditItem || canOpenRevenue;

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !dropdownRef.current?.contains(target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const updateDropdownPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const buttonRect = button.getBoundingClientRect();
    const dropdownWidth = dropdownRef.current?.offsetWidth || 176;
    const dropdownHeight = dropdownRef.current?.offsetHeight || 150;
    const viewportPadding = 12;
    const gap = 8;
    const top = Math.min(buttonRect.bottom + gap, window.innerHeight - dropdownHeight - viewportPadding);
    const left = Math.min(
      Math.max(viewportPadding, buttonRect.right - dropdownWidth),
      window.innerWidth - dropdownWidth - viewportPadding,
    );

    setDropdownStyle({
      position: 'fixed',
      top,
      left,
      zIndex: 140,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;

    const frameId = window.requestAnimationFrame(updateDropdownPosition);
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [isOpen, updateDropdownPosition]);

  if (!hasActions) return null;

  const runAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Acoes do CT-e ${item.cteNumber}`}
        disabled={isSubmitting}
        onClick={() => setIsOpen((current) => !current)}
        className="grid h-9 w-9 place-items-center rounded-full p-0 text-on-surface-variant transition hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreVertical className="block h-4 w-4" />
      </button>

      {isOpen ? createPortal(
        <div ref={dropdownRef} style={dropdownStyle} className="w-[11rem] overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-2 text-left shadow-[0_24px_60px_rgba(26,28,21,0.12)]">
          {canMarkOverdue ? (
            <ActionMenuItem
              icon={AlertTriangle}
              label="Em atraso"
              tone="danger"
              onClick={() => runAction(() => onOverdueItem(item.id))}
            />
          ) : null}
          {canEditItem ? (
            <ActionMenuItem
              icon={Edit2}
              label="Editar"
              onClick={() => runAction(() => onEditItem(item))}
            />
          ) : null}
          {canEditItem ? (
            <ActionMenuItem
              icon={Trash2}
              label="Excluir"
              tone="danger"
              onClick={() => runAction(() => onDeleteItem(item))}
            />
          ) : null}
          {canOpenRevenue ? (
            <ActionMenuItem
              icon={ExternalLink}
              label="Recebivel"
              onClick={() => runAction(() => onOpenRevenue?.(item))}
            />
          ) : null}
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

function ActionMenuItem({
  icon: Icon,
  label,
  tone = 'default',
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  tone?: 'default' | 'danger';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition',
        tone === 'danger' ? 'text-error hover:bg-error/10' : 'text-on-surface hover:bg-primary/10',
      )}
    >
      <Icon className={cn('h-4 w-4', tone === 'danger' ? 'text-error' : 'text-primary')} />
      {label}
    </button>
  );
}
