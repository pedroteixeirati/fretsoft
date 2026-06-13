export function serializeInspection(inspection: Record<string, unknown>) {
  return { ...inspection };
}

export function serializeInspections(inspections: Array<Record<string, unknown>>) {
  return inspections.map(serializeInspection);
}
