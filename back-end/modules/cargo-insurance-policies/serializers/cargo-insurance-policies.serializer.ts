export function serializeCargoInsurancePolicy(policy: Record<string, unknown>) {
  return { ...policy };
}

export function serializeCargoInsurancePolicies(policies: Array<Record<string, unknown>>) {
  return policies.map(serializeCargoInsurancePolicy);
}
