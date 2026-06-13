import React from 'react';
import { Plus } from 'lucide-react';

interface MaintenanceInspectionsHeaderProps {
  canCreate: boolean;
  onCreate: () => void;
}

export default function MaintenanceInspectionsHeader({ canCreate, onCreate }: MaintenanceInspectionsHeaderProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Manutencao Preventiva</h1>
        <p className="mt-2 text-on-secondary-container">
          Registre inspecoes preventivas com checklist por veiculo e acompanhe o proximo vencimento por data ou quilometragem.
        </p>
      </div>

      {canCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-all hover:shadow-md"
        >
          <Plus className="h-5 w-5" />
          NOVA INSPECAO
        </button>
      ) : null}
    </div>
  );
}
