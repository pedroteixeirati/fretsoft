import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
import Modal from '../../../components/Modal';
import { InventoryItem, InventoryMovement } from '../types/inventory.types';

interface InventoryHistoryModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  movements: InventoryMovement[];
  loading: boolean;
  onClose: () => void;
}

function formatDate(value: string) {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatNumber(value: number) {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

export default function InventoryHistoryModal({ isOpen, item, movements, loading, onClose }: InventoryHistoryModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? `Movimentacoes — ${item.name}` : 'Movimentacoes'}>
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-medium text-on-surface-variant">Carregando historico...</p>
        </div>
      ) : movements.length === 0 ? (
        <p className="py-12 text-center text-on-surface-variant">Nenhuma movimentacao registrada para esta peca.</p>
      ) : (
        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {movements.map((movement) => {
            const isEntry = movement.movementType === 'in';
            return (
              <div key={movement.id} className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    isEntry ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'
                  }`}
                >
                  {isEntry ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-on-surface">
                    {isEntry ? 'Entrada' : 'Saida'} de {formatNumber(movement.quantity)} un
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {formatDate(movement.occurredOn)}
                    {movement.reason ? ` • ${movement.reason}` : ''}
                    {movement.notes ? ` • ${movement.notes}` : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
