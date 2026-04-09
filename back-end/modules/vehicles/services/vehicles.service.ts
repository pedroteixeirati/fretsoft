import { conflictError, validationError } from '../../../shared/errors/app-error';
import { pool } from '../../../shared/infra/database/pool';
import {
  isNonNegativeNumber,
  isValidDate,
  isValidPlate,
  normalizeOptionalText,
  normalizePlate,
  normalizeRequiredText,
} from '../../../shared/validation/validation';

export async function validateVehiclePayload(
  body: Record<string, unknown>,
  tenantId: string,
  recordId?: string
) {
  const name = normalizeRequiredText(body.name as string);
  const plate = normalizePlate(body.plate as string);
  const driver = normalizeRequiredText(body.driver as string);
  const type = normalizeRequiredText(body.type as string);
  const km = Number(body.km ?? 0);
  const nextMaintenance = normalizeOptionalText(body.nextMaintenance as string);
  const status = body.status as string;

  if (name.length < 3) throw validationError('Informe um nome valido para o veiculo.', 'invalid_vehicle_name', 'name');
  if (!isValidPlate(plate)) throw validationError('Informe uma placa valida para o veiculo.', 'invalid_plate', 'plate');
  if (driver.length < 3) throw validationError('Informe o motorista responsavel pelo veiculo.', 'invalid_vehicle_driver', 'driver');
  if (type.length < 3) throw validationError('Informe o tipo do veiculo.', 'invalid_vehicle_type', 'type');
  if (!isNonNegativeNumber(km)) throw validationError('A quilometragem deve ser um numero igual ou maior que zero.', 'invalid_vehicle_km', 'km');
  if (nextMaintenance && !isValidDate(nextMaintenance)) throw validationError('A proxima manutencao deve ser uma data valida.', 'invalid_vehicle_next_maintenance', 'nextMaintenance');
  if (!['active', 'maintenance', 'alert'].includes(status)) throw validationError('Status do veiculo invalido.', 'invalid_vehicle_status', 'status');

  const duplicate = await pool.query<{ id: string }>(
    `select id
     from vehicles
     where tenant_id = $1
       and upper(regexp_replace(plate, '[^A-Za-z0-9]', '', 'g')) = $2
       and ($3::uuid is null or id <> $3::uuid)
     limit 1`,
    [tenantId, plate, recordId || null]
  );

  if (duplicate.rows[0]) throw conflictError('Ja existe um veiculo cadastrado com essa placa.', 'vehicle_plate_conflict', 'plate');

  return { name, plate, driver, type, km, nextMaintenance: nextMaintenance || '', status };
}
