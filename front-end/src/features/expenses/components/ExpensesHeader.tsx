import React from 'react';
import { ChevronRight, Plus } from 'lucide-react';

interface ExpensesHeaderProps {
  canCreate: boolean;
  onCreate: () => void;
}

export default function ExpensesHeader({ canCreate, onCreate }: ExpensesHeaderProps) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center gap-2 text-sm text-on-surface-variant">
        <span>Operacao</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-primary">Custos operacionais</span>
      </div>
      <div className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Custos Operacionais</h1>
          <p className="mt-1 text-on-secondary-container">Registre abastecimentos, manutencoes e custos operacionais por veiculo.</p>
        </div>
        {canCreate ? (
          <button onClick={onCreate} className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-semibold text-on-primary shadow-lg shadow-primary/10 transition-all hover:brightness-110">
            <Plus className="h-4 w-4" />
            Novo custo
          </button>
        ) : null}
      </div>
    </div>
  );
}
