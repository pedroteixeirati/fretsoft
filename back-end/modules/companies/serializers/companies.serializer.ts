export function serializeCompany(company: Record<string, unknown>) {
  return { ...company };
}

export function serializeCompanies(companies: Array<Record<string, unknown>>) {
  return companies.map(serializeCompany);
}
