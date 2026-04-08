export function getErrorMessage(error: unknown, fallback = 'Nao foi possivel concluir a operacao.') {
  if (error instanceof Error && error.message.trim()) {
    try {
      const parsed = JSON.parse(error.message) as { error?: string };
      if (parsed?.error && typeof parsed.error === 'string' && parsed.error.trim()) {
        return parsed.error;
      }
    } catch {
      // keep original message when it is not a serialized payload
    }

    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    try {
      const parsed = JSON.parse(error) as { error?: string };
      if (parsed?.error && typeof parsed.error === 'string' && parsed.error.trim()) {
        return parsed.error;
      }
    } catch {
      // keep original message when it is not a serialized payload
    }

    return error;
  }

  return fallback;
}
