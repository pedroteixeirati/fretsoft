import React from 'react';
import { Loader2, Plus, RefreshCw } from 'lucide-react';

interface RecurringPayablesHeaderProps {
  canCreate: boolean;
  isGenerating: boolean;
  onCreate: () => void;
  onGenerate: () => void;
}

export default function RecurringPayablesHeader({
  canCreate,
  isGenerating,
  onCreate,
  onGenerate,
}: RecurringPayablesHeaderProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Despesas Recorrentes</h1>
        <p className="mt-2 text-on-secondary-container">
          Cadastre despesas fixas como aluguel, tributos e mensalidades. Todo dia 1 elas viram contas a pagar do mes automaticamente.
        </p>
      </div>

      {canCreate ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-full border border-primary/30 bg-surface px-6 py-2.5 text-sm font-bold text-primary shadow-sm transition-all hover:bg-primary/5 hover:shadow-md disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
            GERAR LANCAMENTOS DO MES
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-all hover:shadow-md"
          >
            <Plus className="h-5 w-5" />
            NOVA DESPESA RECORRENTE
          </button>
        </div>
      ) : null}
    </div>
  );
}
