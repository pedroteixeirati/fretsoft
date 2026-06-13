export function serializeVehicleDocument(document: Record<string, unknown>) {
  return { ...document };
}

export function serializeVehicleDocuments(documents: Array<Record<string, unknown>>) {
  return documents.map(serializeVehicleDocument);
}
