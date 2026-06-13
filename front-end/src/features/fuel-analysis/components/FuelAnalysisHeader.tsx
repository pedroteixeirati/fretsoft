import React from 'react';

export default function FuelAnalysisHeader() {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Consumo de Combustivel</h1>
        <p className="mt-2 text-on-secondary-container">
          Media km/l, custo por km e historico de abastecimentos por veiculo, calculados a partir dos custos operacionais lancados com litros e odometro.
        </p>
      </div>
    </div>
  );
}
