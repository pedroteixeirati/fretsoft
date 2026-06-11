import type { FreightInput, FreightPayload } from '../dtos/freight.types';
import type { AuthContext } from '../../auth/dtos/auth-context';
import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import {
  isNonNegativeNumber,
  isPositiveNumber,
  isValidDate,
  isValidUuid,
  normalizeOptionalText,
  normalizeRequiredText,
} from '../../../shared/validation/validation';
import {
  deleteTenantFreight,
  findTenantContractForFreight,
  findTenantTransportPartnerForFreight,
  findTenantVehicleForFreight,
  insertTenantFreight,
  listTenantFreights,
  type FreightRow,
  updateTenantFreight,
} from '../repositories/freights.repository';
import { freightErrors } from '../errors/freights.errors';
import { syncFreightRevenue } from '../../revenues/services/revenues.service';
import { deleteFreightRevenue } from '../../revenues/repositories/revenues.repository';

export const freightsPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'],
  create: ['dev', 'owner', 'admin', 'operational', 'driver'],
  update: ['dev', 'owner', 'admin', 'operational', 'driver'],
  delete: ['dev', 'owner', 'admin', 'operational'],
};

function mapFreightRow(row: FreightRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    vehicleId: row.vehicle_id,
    plate: row.plate,
    contractId: row.contract_id,
    contractName: row.contract_name || '',
    billingType: row.billing_type,
    date: row.date,
    origin: row.origin,
    destination: row.destination,
    amount: Number(row.amount || 0),
    hasCargo: row.has_carga,
    executionMode: row.execution_mode || 'own_fleet',
    transportPartnerId: row.transport_partner_id || null,
  };
}

export async function validateFreightPayload(body: FreightInput, tenantId: string): Promise<FreightPayload> {
  const vehicleId = normalizeRequiredText(body.vehicleId);
  const contractIdInput = normalizeOptionalText((body.contractId as string | undefined) || '');
  const date = normalizeRequiredText(body.date);
  const origin = normalizeRequiredText(body.origin);
  const destination = normalizeRequiredText(body.destination);
  const rawAmount = body.amount === '' || body.amount === null || body.amount === undefined ? 0 : Number(body.amount);
  const hasCargo = body.hasCargo === undefined ? true : body.hasCargo === true || body.hasCargo === 'true';

  if (!isValidUuid(vehicleId)) throw freightErrors.invalidVehicle();
  if (contractIdInput && !isValidUuid(contractIdInput)) throw freightErrors.invalidContract();
  if (!isValidDate(date)) throw freightErrors.invalidDate();
  if (origin.length < 3) throw freightErrors.invalidOrigin();
  if (destination.length < 3) throw freightErrors.invalidDestination();
  if (!isNonNegativeNumber(rawAmount)) throw freightErrors.invalidAmount();

  const vehicle = await findTenantVehicleForFreight(vehicleId, tenantId);
  if (!vehicle) throw freightErrors.vehicleNotFound();

  let contractId = '';
  let contractName = '';
  let billingType: 'standalone' | 'contract_recurring' | 'contract_per_trip' = 'standalone';
  let amount = rawAmount;

  if (contractIdInput) {
    const linkedContract = await findTenantContractForFreight(contractIdInput, tenantId);
    if (!linkedContract) throw freightErrors.contractNotFound();
    if (!linkedContract.vehicle_ids.includes(vehicleId)) {
      throw freightErrors.vehicleNotLinked();
    }

    contractId = linkedContract.id;
    contractName = linkedContract.contract_name;

    if (linkedContract.remuneration_type === 'recurring') {
      billingType = 'contract_recurring';
      amount = 0;
    } else {
      billingType = 'contract_per_trip';
      if (!isPositiveNumber(rawAmount)) throw freightErrors.perTripAmountRequired();
    }
  } else if (!isPositiveNumber(rawAmount)) {
    throw freightErrors.standaloneAmountRequired();
  }

  const executionMode = (normalizeOptionalText((body.executionMode as string | undefined) || '') || 'own_fleet') as 'own_fleet' | 'third_party';
  if (executionMode !== 'own_fleet' && executionMode !== 'third_party') {
    throw freightErrors.invalidExecutionMode();
  }

  let transportPartnerId: string | null = null;
  if (executionMode === 'third_party') {
    const partnerIdInput = normalizeOptionalText((body.transportPartnerId as string | undefined) || '');
    if (!partnerIdInput || !isValidUuid(partnerIdInput)) throw freightErrors.invalidTransportPartner();
    const partner = await findTenantTransportPartnerForFreight(partnerIdInput, tenantId);
    if (!partner) throw freightErrors.transportPartnerNotFound();
    transportPartnerId = partner.id;
  }

  return {
    vehicleId,
    plate: vehicle.plate,
    contractId: contractId || null,
    contractName,
    billingType,
    date,
    origin,
    destination,
    amount,
    hasCargo,
    executionMode,
    transportPartnerId,
  };
}

export async function listFreights(auth?: AuthContext) {
  if (!auth?.tenantId) return [];
  const rows = await listTenantFreights(auth.tenantId);
  return rows.map(mapFreightRow);
}

export async function createFreight(auth: AuthContext | undefined, body: FreightInput) {
  const tenantId = auth?.tenantId || '';
  const payload = await validateFreightPayload(body, tenantId);
  const row = await insertTenantFreight(payload, tenantId, auth?.userId);
  if (!row) return null;

  await syncFreightRevenue(tenantId, row, auth?.userId);
  return mapFreightRow(row);
}

export async function updateFreight(auth: AuthContext | undefined, id: string, body: FreightInput) {
  const tenantId = auth?.tenantId || '';
  const payload = await validateFreightPayload(body, tenantId);
  const row = await updateTenantFreight(id, payload, tenantId, auth?.userId);
  if (!row) return undefined;

  await syncFreightRevenue(tenantId, row, auth?.userId);
  return mapFreightRow(row);
}

export async function deleteFreight(auth: AuthContext | undefined, id: string) {
  const tenantId = auth?.tenantId || '';
  await deleteFreightRevenue(tenantId, id);
  const deleted = await deleteTenantFreight(id, tenantId);
  return Boolean(deleted);
}
