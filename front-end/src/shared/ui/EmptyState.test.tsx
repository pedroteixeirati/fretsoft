import React from 'react';
import { render } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renderiza título e descrição', () => {
    const { getByText } = render(
      <EmptyState title="Sem dados" description="Nenhum registro encontrado." />,
    );

    expect(getByText('Sem dados')).toBeInTheDocument();
    expect(getByText('Nenhum registro encontrado.')).toBeInTheDocument();
  });
});
