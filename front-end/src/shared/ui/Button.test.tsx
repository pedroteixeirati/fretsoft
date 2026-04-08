import React from 'react';
import userEvent from '@testing-library/user-event';
import Button from './Button';
import { renderWithProviders } from '../../test/utils/renderWithProviders';

describe('Button', () => {
  it('renderiza o rotulo e dispara clique', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    const { getByRole } = renderWithProviders(
      <Button onClick={onClick}>Salvar</Button>,
    );

    const button = getByRole('button', { name: 'Salvar' });
    await user.click(button);

    expect(button).toBeInTheDocument();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
