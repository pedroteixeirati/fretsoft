export function serializeInventoryItem(item: Record<string, unknown>) {
  return { ...item };
}

export function serializeInventoryItems(items: Array<Record<string, unknown>>) {
  return items.map(serializeInventoryItem);
}

export function serializeInventoryMovements(movements: Array<Record<string, unknown>>) {
  return movements.map((movement) => ({ ...movement }));
}
