import type { FreightInput, FreightPayload } from '../dtos/freight.types';
import {
  isNonNegativeNumber,
  isPositiveNumber,
  isValidDate,
  isValidUuid,
  normalizeOptionalText,
  normalizeRequiredText,
} from '../../../shared/validation/validation';
import { findTenantContractForFreight, findTenantVehicleForFreight } from '../repositories/freights.repository';
import { freightErrors } from '../errors/freights.errors';

export async function validateFreightPayload(body: FreightInput, tenantId: string): Promise<FreightPayload> {
  const vehicleId = normalizeRequiredText(body.vehicleId);
  const contractIdInput = normalizeOptionalText((body.contractId as string | undefined) || '');
  const date = normalizeRequiredText(body.date);
  const route = normalizeRequiredText(body.route);
  const rawAmount = body.amount === '' || body.amount === null || body.amount === undefined ? 0 : Number(body.amount);
  const hasCargo = body.hasCargo === undefined ? true : body.hasCargo === true || body.hasCargo === 'true';

  if (!isValidUuid(vehicleId)) throw freightErrors.invalidVehicle();
  if (contractIdInput && !isValidUuid(contractIdInput)) throw freightErrors.invalidContract();
  if (!isValidDate(date)) throw freightErrors.invalidDate();
  if (route.length < 5) throw freightErrors.invalidRoute();
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

  return {
    vehicleId,
    plate: vehicle.plate,
    contractId: contractId || null,
    contractName,
    billingType,
    date,
    route,
    amount,
    hasCargo,
  };
}
