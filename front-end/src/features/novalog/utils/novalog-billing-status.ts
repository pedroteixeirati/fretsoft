import { NovalogBillingItemStatus, NovalogBillingStatus } from '../types/novalog-billing.types';

export function novalogBillingStatusLabel(status: NovalogBillingStatus) {
  switch (status) {
    case 'draft':
      return 'Rascunho';
    case 'open':
      return 'Aberto';
    case 'partially_received':
      return 'Parcial';
    case 'received':
      return 'Recebido';
    case 'overdue':
      return 'Em atraso';
    case 'canceled':
      return 'Cancelado';
    default:
      return 'Aberto';
  }
}

export function novalogBillingItemStatusLabel(status: NovalogBillingItemStatus) {
  switch (status) {
    case 'billed':
      return 'Cobrado';
    case 'partially_received':
      return 'Parcial';
    case 'received':
      return 'Recebido';
    case 'overdue':
      return 'Em atraso';
    case 'canceled':
      return 'Cancelado';
    default:
      return 'Pendente';
  }
}

export function novalogBillingStatusClass(status: NovalogBillingStatus | NovalogBillingItemStatus) {
  switch (status) {
    case 'draft':
      return 'bg-surface-container text-on-surface-variant';
    case 'received':
      return 'bg-primary-fixed text-primary';
    case 'partially_received':
    case 'billed':
      return 'bg-secondary-container text-on-secondary-container';
    case 'overdue':
      return 'bg-error/10 text-error';
    case 'canceled':
      return 'bg-surface-container text-on-surface-variant';
    default:
      return 'bg-tertiary/10 text-tertiary';
  }
}
