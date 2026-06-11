export type RevenueStatus = 'pending' | 'billed' | 'partially_received' | 'received' | 'overdue' | 'canceled';

export type RevenueRow = {
  id: string;
  display_id?: string | number | null;
  company_id: string | null;
  company_name: string | null;
  contract_id: string | null;
  contract_name: string | null;
  freight_id: string | null;
  novalog_billing_id: string | null;
  novalog_billing_item_id: string | null;
  fiscal_document_id: string | null;
  competence_month: number;
  competence_year: number;
  competence_label: string;
  description: string;
  amount: string | number;
  due_date: string;
  status: RevenueStatus;
  source_type: 'contract' | 'freight' | 'manual' | 'novalog_billing_item';
  charge_reference: string | null;
  charge_generated_at: string | null;
  received_at: string | null;
  received_amount?: string | number | null;
  balance_amount?: string | number | null;
  payment_count?: string | number | null;
  last_payment_at?: string | null;
  created_at: string;
};

export type RevenuePaymentRow = {
  id: string;
  tenant_id: string;
  revenue_id: string;
  amount: string | number;
  payment_date: string;
  notes: string | null;
  status: 'active' | 'reversed';
  reversed_at: string | null;
  reversal_reason: string | null;
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
  origin: string;
  destination: string;
  amount: string | number;
};

export type FreightLinkedContractRow = {
  id: string;
  company_id: string;
  company_name: string;
  contract_name: string;
};

export function mapRevenue(row: RevenueRow) {
  const isNovalogBillingItem = row.source_type === 'novalog_billing_item';
  const receivedAmount = Number(row.received_amount ?? (row.status === 'received' ? row.amount : 0) ?? 0);
  const balanceAmount = Number(row.balance_amount ?? Math.max(Number(row.amount || 0) - receivedAmount, 0));
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    companyId: row.company_id || '',
    companyName: row.company_name || 'Fretes avulsos',
    contractId: row.contract_id || '',
    contractName: isNovalogBillingItem ? row.description : row.contract_name || 'Frete avulso',
    freightId: row.freight_id || undefined,
    novalogBillingId: row.novalog_billing_id || undefined,
    novalogBillingItemId: row.novalog_billing_item_id || undefined,
    fiscalDocumentId: row.fiscal_document_id || undefined,
    competenceMonth: row.competence_month,
    competenceYear: row.competence_year,
    competenceLabel: row.competence_label,
    description: row.description,
    amount: Number(row.amount || 0),
    receivedAmount,
    balanceAmount,
    paymentCount: Number(row.payment_count || 0),
    lastPaymentAt: row.last_payment_at || undefined,
    dueDate: row.due_date,
    status: row.status,
    sourceType: row.source_type,
    chargeReference: row.charge_reference || undefined,
    chargeGeneratedAt: row.charge_generated_at || undefined,
    receivedAt: row.received_at || undefined,
    createdAt: row.created_at,
  };
}

export function mapRevenuePayment(row: RevenuePaymentRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    revenueId: row.revenue_id,
    amount: Number(row.amount || 0),
    paymentDate: row.payment_date,
    notes: row.notes || '',
    status: row.status || 'active',
    reversedAt: row.reversed_at || undefined,
    reversalReason: row.reversal_reason || '',
    createdAt: row.created_at,
  };
}
