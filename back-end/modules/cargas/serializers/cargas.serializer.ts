import type { CargoPayload } from '../dtos/carga.types.ts';

export function serializeCargo(cargo: CargoPayload | Record<string, unknown>) {
  return { ...cargo };
}

export function serializeCargos(cargos: Array<CargoPayload | Record<string, unknown>>) {
  return cargos.map(serializeCargo);
}
