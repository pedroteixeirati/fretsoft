export function serializeVehicle(vehicle: Record<string, unknown>) {
  return { ...vehicle };
}

export function serializeVehicles(vehicles: Array<Record<string, unknown>>) {
  return vehicles.map(serializeVehicle);
}
