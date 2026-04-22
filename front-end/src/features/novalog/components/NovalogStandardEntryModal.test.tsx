import React from 'react';
import { render, screen } from '@testing-library/react';
import NovalogStandardEntryModal from './NovalogStandardEntryModal';

describe('NovalogStandardEntryModal', () => {
  const baseEntry = {
    id: 'entry-1',
    displayId: 245,
    weekNumber: 1,
    operationDate: '2026-04-03',
    originName: 'Minerbrasil',
    destinationName: 'Gerdau',
    weight: 36.25,
    companyRatePerTon: 11,
    companyGrossAmount: 398.75,
    aggregatedRatePerTon: 10,
    aggregatedGrossAmount: 362.5,
    ticketNumber: '770',
    fuelStationName: 'Campeao',
    entryMode: 'standard' as const,
  };

  it('preenche os dados quando abre em modo de edicao', () => {
    render(
      <NovalogStandardEntryModal
        isOpen
        weekNumber={1}
        originOptions={[{ value: 'Minerbrasil', label: 'Minerbrasil' }]}
        draftEntry={baseEntry}
        mode="edit"
        onClose={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    expect(screen.getByText('Editar lancamento Novalog')).toBeInTheDocument();
    expect(screen.queryByText(/Identificador/i)).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('770')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar alteracoes' })).toBeInTheDocument();
  });

  it('informa que o identificador sera gerado ao duplicar', () => {
    render(
      <NovalogStandardEntryModal
        isOpen
        weekNumber={1}
        originOptions={[{ value: 'Minerbrasil', label: 'Minerbrasil' }]}
        draftEntry={baseEntry}
        mode="duplicate"
        onClose={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    expect(screen.getByText('Duplicar lancamento Novalog')).toBeInTheDocument();
    expect(screen.queryByText(/Identificador/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar copia' })).toBeInTheDocument();
  });
});
