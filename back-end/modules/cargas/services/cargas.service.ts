import type { CargoInput, CargoPayload, CargoStatus } from '../dtos/carga.types.ts';
import {
  isNonNegativeNumber,
  isValidDate,
  isValidUuid,
  normalizeOptionalText,
  normalizeRequiredText,
} from '../../../shared/validation/validation.ts';
import { cargoErrors } from '../errors/cargas.errors.ts';
import { findTenantCompanyForCargo, findTenantFreightForCargo } from '../repositories/cargas.repository.ts';

export async function validateCargoPayload(body: CargoInput, tenantId: string): Promise<CargoPayload> {
  const freightId = normalizeRequiredText(body.freightId);
  const companyId = normalizeRequiredText(body.companyId);
  const cargoNumber = normalizeOptionalText(body.cargoNumber) || '';
  const description = normalizeRequiredText(body.description);
  const cargoType = normalizeRequiredText(body.cargoType);
  const weight = body.weight === '' || body.weight === null || body.weight === undefined ? 0 : Number(body.weight);
  const volume = body.volume === '' || body.volume === null || body.volume === undefined ? 0 : Number(body.volume);
  const unitCount = body.unitCount === '' || body.unitCount === null || body.unitCount === undefined ? 0 : Number(body.unitCount);
  const merchandiseValue = body.merchandiseValue === '' || body.merchandiseValue === null || body.merchandiseValue === undefined ? 0 : Number(body.merchandiseValue);
  const origin = normalizeRequiredText(body.origin);
  const destination = normalizeRequiredText(body.destination);
  const status = body.status;
  const scheduledDate = normalizeOptionalText(body.scheduledDate) || '';
  const deliveredAt = normalizeOptionalText(body.deliveredAt) || '';
  const notes = normalizeOptionalText(body.notes) || '';

  if (!isValidUuid(freightId)) throw cargoErrors.invalidFreight();
  if (!isValidUuid(companyId)) throw cargoErrors.invalidCompany();
  if (cargoNumber && cargoNumber.length < 2) throw cargoErrors.invalidCargoNumber();
  if (description.length < 3) throw cargoErrors.invalidDescription();
  if (cargoType.length < 2) throw cargoErrors.invalidCargoType();
  if (!isNonNegativeNumber(weight)) throw cargoErrors.invalidWeight();
  if (!isNonNegativeNumber(volume)) throw cargoErrors.invalidVolume();
  if (!isNonNegativeNumber(unitCount)) throw cargoErrors.invalidUnitCount();
  if (!isNonNegativeNumber(merchandiseValue)) throw cargoErrors.invalidMerchandiseValue();
  if (origin.length < 3) throw cargoErrors.invalidOrigin();
  if (destination.length < 3) throw cargoErrors.invalidDestination();
  if (!['planned', 'loading', 'in_transit', 'delivered', 'cancelled'].includes(status)) throw cargoErrors.invalidStatus();
  if (scheduledDate && !isValidDate(scheduledDate)) throw cargoErrors.invalidScheduledDate();
  if (deliveredAt && !isValidDate(deliveredAt)) throw cargoErrors.invalidDeliveredAt();

  const freight = await findTenantFreightForCargo(freightId, tenantId);
  if (!freight) throw cargoErrors.freightNotFound();

  const company = await findTenantCompanyForCargo(companyId, tenantId);
  if (!company) throw cargoErrors.companyNotFound();

  return {
    freightId,
    freightDisplayId: freight.display_id,
    freightRoute: freight.route,
    companyId,
    companyName: company.trade_name || company.corporate_name,
    cargoNumber,
    description,
    cargoType,
    weight,
    volume,
    unitCount,
    merchandiseValue,
    origin,
    destination,
    status: status as CargoStatus,
    scheduledDate,
    deliveredAt,
    notes,
  };
}
