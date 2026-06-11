export function serializeFiscalDocument(document: Record<string, unknown>) {
  return { ...document };
}

export function serializeFiscalDocuments(documents: Array<Record<string, unknown>>) {
  return documents.map(serializeFiscalDocument);
}
