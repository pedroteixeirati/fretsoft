export function serializeProvider(provider: Record<string, unknown>) {
  return { ...provider };
}

export function serializeProviders(providers: Array<Record<string, unknown>>) {
  return providers.map(serializeProvider);
}
