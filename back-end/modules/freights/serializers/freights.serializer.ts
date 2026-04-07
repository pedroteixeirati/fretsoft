import type { FreightPayload } from '../dtos/freight.types';

export function serializeFreight(freight: FreightPayload | Record<string, unknown>) {
  return { ...freight };
}

export function serializeFreights(freights: Array<FreightPayload | Record<string, unknown>>) {
  return freights.map(serializeFreight);
}
