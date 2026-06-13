export function serializeServiceOrder(serviceOrder: Record<string, unknown>) {
  return { ...serviceOrder };
}

export function serializeServiceOrders(serviceOrders: Array<Record<string, unknown>>) {
  return serviceOrders.map(serializeServiceOrder);
}
