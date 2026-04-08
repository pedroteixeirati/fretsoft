import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { NavItem } from '../../../shared/types/common.types';

interface ExpensesInsightsProps {
  aiLoading: boolean;
  aiSummary: string;
  onNavigate: (item: NavItem) => void;
}

export default function ExpensesInsights({ aiLoading, aiSummary, onNavigate }: ExpensesInsightsProps) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-surface-container-lowest p-8 shadow-sm md:col-span-2">
        <div className="relative z-10">
          <h3 className="mb-2 text-2xl font-extrabold text-on-surface">Analise de Eficiencia</h3>
          {aiLoading ? (
            <div className="flex animate-pulse items-center gap-2 text-on-secondary-container">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm">IA analisando dados da frota...</p>
            </div>
          ) : (
            <p className="max-w-md leading-relaxed text-on-secondary-container">
              {aiSummary || 'Adicione custos operacionais para que a IA possa gerar um resumo analitico da sua frota.'}
            </p>
          )}
        </div>
        <div className="mt-8 flex gap-4">
          <button onClick={() => onNavigate('reports')} className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-on-primary">
            Ver Relatorio Detalhado
          </button>
        </div>
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      </div>
      <div className="flex flex-col items-center justify-center rounded-3xl bg-primary-container p-8 text-center text-on-primary-container shadow-lg">
        <Sparkles className="mb-4 h-12 w-12" />
        <h4 className="mb-2 text-xl font-bold">Padrao de Lancamentos</h4>
        <p className="mb-6 text-sm leading-relaxed opacity-90">
          Centralize os custos por veiculo para comparar combustivel, manutencao e recorrencia operacional com muito mais clareza.
        </p>
        <button onClick={() => onNavigate('reports')} className="w-full rounded-full bg-on-primary-container py-3 font-bold text-primary-container transition-transform hover:scale-[1.02]">
          Abrir Relatorios
        </button>
      </div>
    </div>
  );
}
