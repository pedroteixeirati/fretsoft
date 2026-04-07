export function getErrorMessage(error: unknown, fallback = 'Nao foi possivel concluir a operacao.') {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
}
