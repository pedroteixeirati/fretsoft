import React from 'react';
import { Plus } from 'lucide-react';

interface VehiclesHeaderProps {
  canCreate: boolean;
  onCreate: () => void;
}

export default function VehiclesHeader({ canCreate, onCreate }: VehiclesHeaderProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Gestao de Cadastros</h1>
        <p className="mt-2 text-on-secondary-container">
          Gerencie suas entidades de frota, fornecedores e categorias de custos operacionais em um so lugar.
        </p>
      </div>

      {canCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-all hover:shadow-md"
        >
          <Plus className="h-5 w-5" />
          NOVO CADASTRO
        </button>
      ) : null}
    </div>
  );
}
