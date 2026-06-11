export function serializeTransportPartner(partner: Record<string, unknown>) {
  return { ...partner };
}

export function serializeTransportPartners(partners: Array<Record<string, unknown>>) {
  return partners.map(serializeTransportPartner);
}
