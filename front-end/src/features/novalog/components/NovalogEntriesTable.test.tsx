import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import NovalogEntriesTable from './NovalogEntriesTable';

describe('NovalogEntriesTable', () => {
  it('renderiza os lancamentos e dispara as acoes principais', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const entry = {
      id: 'entry-1',
      displayId: 1,
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

    render(
      <NovalogEntriesTable
        entries={[entry]}
        searchTerm=""
        originFilter=""
        destinationFilter=""
        filteredCount={1}
        totalCount={1}
        currentPage={1}
        totalPages={1}
        onSearchChange={() => undefined}
        onOriginFilterChange={() => undefined}
        onDestinationFilterChange={() => undefined}
        onPreviousPage={() => undefined}
        onNextPage={() => undefined}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getAllByText('#1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Minerbrasil').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: 'Editar #1' })[0]);
    await user.click(screen.getAllByRole('button', { name: 'Excluir #1' })[0]);

    expect(onEdit).toHaveBeenCalledWith(entry);
    expect(onDelete).toHaveBeenCalledWith(entry);
  });
});
