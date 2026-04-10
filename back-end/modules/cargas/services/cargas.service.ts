import type { CargoInput, CargoPayload, CargoStatus } from '../dtos/carga.types.ts';
import type { AuthContext } from '../../auth/dtos/auth-context.ts';
import type { ResourcePermissions } from '../../../shared/authorization/permissions.ts';
import {
  isNonNegativeNumber,
  isValidDate,
  isValidUuid,
  normalizeOptionalText,
  normalizeRequiredText,
} from '../../../shared/validation/validation.ts';
import { cargoErrors } from '../errors/cargas.errors.ts';
import {
  deleteTenantCargo,
  findTenantCompanyForCargo,
  findTenantFreightForCargo,
  insertTenantCargo,
  listTenantCargos,
  listTenantCargosByFreight,
  type CargoRow,
  updateTenantCargo,
} from '../repositories/cargas.repository.ts';

export const cargasPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'],
  create: ['dev', 'owner', 'admin', 'operational'],
  update: ['dev', 'owner', 'admin', 'operational'],
  delete: ['dev', 'owner', 'admin', 'operational'],
};

function mapCargoRow(row: CargoRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    freightId: row.freight_id,
    freightDisplayId: row.freight_display_id !== null && row.freight_display_id !== undefined ? Number(row.freight_display_id) : undefined,
    freightRoute: row.freight_route,
    companyId: row.company_id,
    companyName: row.company_name,
    cargoNumber: row.cargo_number || '',
    description: row.description,
    cargoType: row.cargo_type,
    weight: Number(row.weight || 0),
    volume: Number(row.volume || 0),
    unitCount: Number(row.unit_count || 0),
    merchandiseValue: Number(row.merchandise_value || 0),
    origin: row.origin,
    destination: row.destination,
    status: row.status,
    scheduledDate: row.scheduled_date || '',
    deliveredAt: row.delivered_at || '',
    notes: row.notes || '',
  };
}

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

export async function listCargos(auth?: AuthContext) {
  if (!auth?.tenantId) return [];
  const rows = await listTenantCargos(auth.tenantId);
  return rows.map(mapCargoRow);
}

export async function listCargosByFreight(auth: AuthContext | undefined, freightId: string) {
  const tenantId = auth?.tenantId || '';
  const rows = await listTenantCargosByFreight(freightId, tenantId);
  return rows.map(mapCargoRow);
}

export async function createCargo(auth: AuthContext | undefined, body: CargoInput) {
  const tenantId = auth?.tenantId || '';
  const payload = await validateCargoPayload(body, tenantId);
  const row = await insertTenantCargo(payload, tenantId, auth?.userId);
  return row ? mapCargoRow(row) : null;
}

export async function updateCargo(auth: AuthContext | undefined, id: string, body: CargoInput) {
  const tenantId = auth?.tenantId || '';
  const payload = await validateCargoPayload(body, tenantId);
  const row = await updateTenantCargo(id, payload, tenantId, auth?.userId);
  return row ? mapCargoRow(row) : undefined;
}

export async function deleteCargo(auth: AuthContext | undefined, id: string) {
  const tenantId = auth?.tenantId || '';
  const deleted = await deleteTenantCargo(id, tenantId);
  return Boolean(deleted);
}
