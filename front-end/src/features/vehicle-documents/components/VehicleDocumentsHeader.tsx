import React from 'react';
import { Plus } from 'lucide-react';

interface VehicleDocumentsHeaderProps {
  canCreate: boolean;
  onCreate: () => void;
}

export default function VehicleDocumentsHeader({ canCreate, onCreate }: VehicleDocumentsHeaderProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Vencimentos da Frota</h1>
        <p className="mt-2 text-on-secondary-container">
          Acompanhe IPVA, licenciamento, tacografo, extintor, seguro e demais documentos com vencimento por veiculo.
        </p>
      </div>

      {canCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-all hover:shadow-md"
        >
          <Plus className="h-5 w-5" />
          NOVO DOCUMENTO
        </button>
      ) : null}
    </div>
  );
}
