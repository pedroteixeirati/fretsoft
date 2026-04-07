export type RevenueRow = {
  id: string;
  display_id?: string | number | null;
  company_id: string | null;
  company_name: string | null;
  contract_id: string | null;
  contract_name: string | null;
  freight_id: string | null;
  competence_month: number;
  competence_year: number;
  competence_label: string;
  description: string;
  amount: string | number;
  due_date: string;
  status: 'pending' | 'billed' | 'received' | 'overdue' | 'canceled';
  source_type: 'contract' | 'freight' | 'manual';
  charge_reference: string | null;
  charge_generated_at: string | null;
  received_at: string | null;
  created_at: string;
};

export type ContractRevenueSeedRow = {
  tenant_id?: string;
  id: string;
  company_id: string;
  company_name: string;
  contract_name: string;
  remuneration_type: 'recurring' | 'per_trip';
  monthly_value: string | number;
  start_date: string;
  end_date: string;
  status: 'active' | 'renewal' | 'closed';
};

export type FreightRevenueSeedRow = {
  id: string;
  plate: string;
  contract_id: string | null;
  contract_name: string | null;
  billing_type: 'standalone' | 'contract_recurring' | 'contract_per_trip';
  date: string;
  route: string;
  amount: string | number;
};

export type FreightLinkedContractRow = {
  id: string;
  company_id: string;
  company_name: string;
  contract_name: string;
};

export function mapRevenue(row: RevenueRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    companyId: row.company_id || '',
    companyName: row.company_name || 'Fretes avulsos',
    contractId: row.contract_id || '',
    contractName: row.contract_name || 'Frete avulso',
    freightId: row.freight_id || undefined,
    competenceMonth: row.competence_month,
    competenceYear: row.competence_year,
    competenceLabel: row.competence_label,
    description: row.description,
    amount: Number(row.amount || 0),
    dueDate: row.due_date,
    status: row.status,
    sourceType: row.source_type,
    chargeReference: row.charge_reference || undefined,
    chargeGeneratedAt: row.charge_generated_at || undefined,
    receivedAt: row.received_at || undefined,
    createdAt: row.created_at,
  };
}
