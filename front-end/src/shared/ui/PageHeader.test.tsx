import React from 'react';
import { render } from '@testing-library/react';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  it('renderiza título, descrição e ações', () => {
    const { getByText } = render(
      <PageHeader
        title="Contas a pagar"
        description="Controle financeiro"
        actions={<button type="button">Nova conta</button>}
      />,
    );

    expect(getByText('Contas a pagar')).toBeInTheDocument();
    expect(getByText('Controle financeiro')).toBeInTheDocument();
    expect(getByText('Nova conta')).toBeInTheDocument();
  });
});
