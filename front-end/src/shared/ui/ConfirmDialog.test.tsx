import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renderiza conteudo customizado e confirma a acao', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDialog
        isOpen
        title="Excluir CT-e"
        description="Deseja excluir o CT-e 1235?"
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        tone="danger"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Excluir CT-e')).toBeInTheDocument();
    expect(screen.getByText('Deseja excluir o CT-e 1235?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('bloqueia botoes enquanto processa', () => {
    render(
      <ConfirmDialog
        isOpen
        title="Confirmar"
        description="Processando acao."
        isLoading
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Processando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });
});
