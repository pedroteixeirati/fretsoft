import type { ContractInput, ContractPayload } from '../dtos/contract.types';
import {
  isNonNegativeNumber,
  isPositiveNumber,
  isValidDate,
  isValidUuid,
  normalizeOptionalText,
  normalizeRequiredText,
} from '../../../shared/validation/validation';
import { findTenantCompanyById, findTenantVehiclesByIds } from '../repositories/contracts.repository';
import { contractErrors } from '../errors/contracts.errors';

export async function validateContractPayload(body: ContractInput, tenantId: string): Promise<ContractPayload> {
  const companyId = normalizeRequiredText(body.companyId);
  const contractName = normalizeRequiredText(body.contractName);
  const remunerationType = body.remunerationType;
  const startDate = normalizeRequiredText(body.startDate);
  const endDate = normalizeRequiredText(body.endDate);
  const status = body.status;
  const notes = normalizeOptionalText(body.notes);
  const vehicleIds = Array.isArray(body.vehicleIds) ? body.vehicleIds.filter(Boolean) : [];

  if (!isValidUuid(companyId)) throw contractErrors.invalidCompany();
  if (contractName.length < 3) throw contractErrors.invalidName();
  if (!['recurring', 'per_trip'].includes(remunerationType)) throw contractErrors.invalidRemunerationType();
  if (!isValidDate(startDate) || !isValidDate(endDate)) throw contractErrors.invalidDates();
  if (new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`)) throw contractErrors.invalidDateRange();
  if (!['active', 'renewal', 'closed'].includes(status)) throw contractErrors.invalidStatus();
  if (vehicleIds.length === 0) throw contractErrors.missingVehicles();

  const company = await findTenantCompanyById(companyId, tenantId);
  if (!company) throw contractErrors.companyNotFound();

  const vehicles = await findTenantVehiclesByIds(tenantId, vehicleIds);
  if (vehicles.length !== vehicleIds.length) throw contractErrors.vehiclesNotFound();

  const annualValue = remunerationType === 'recurring' ? Number(body.annualValue ?? 0) : 0;
  const monthlyValue = remunerationType === 'recurring' ? Number(body.monthlyValue ?? 0) : 0;
  if (remunerationType === 'recurring' && !isPositiveNumber(annualValue)) {
    throw contractErrors.invalidAnnualValue();
  }
  if (remunerationType === 'recurring' && !isNonNegativeNumber(monthlyValue)) {
    throw contractErrors.invalidMonthlyValue();
  }

  return {
    companyId,
    companyName: company.corporate_name,
    contractName,
    remunerationType,
    annualValue,
    monthlyValue: remunerationType === 'recurring' ? monthlyValue : 0,
    startDate,
    endDate,
    status,
    vehicleIds: vehicles.map((vehicle) => vehicle.id),
    vehicleNames: vehicles.map((vehicle) => `${vehicle.name} (${vehicle.plate})`),
    notes: notes || '',
  };
}
