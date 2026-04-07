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

  if (name.length < 3) throw new Error('Informe um nome valido para o veiculo.');
  if (!isValidPlate(plate)) throw new Error('Informe uma placa valida para o veiculo.');
  if (driver.length < 3) throw new Error('Informe o motorista responsavel pelo veiculo.');
  if (type.length < 3) throw new Error('Informe o tipo do veiculo.');
  if (!isNonNegativeNumber(km)) throw new Error('A quilometragem deve ser um numero igual ou maior que zero.');
  if (nextMaintenance && !isValidDate(nextMaintenance)) throw new Error('A proxima manutencao deve ser uma data valida.');
  if (!['active', 'maintenance', 'alert'].includes(status)) throw new Error('Status do veiculo invalido.');

  const duplicate = await pool.query<{ id: string }>(
    `select id
     from vehicles
     where tenant_id = $1
       and upper(regexp_replace(plate, '[^A-Za-z0-9]', '', 'g')) = $2
       and ($3::uuid is null or id <> $3::uuid)
     limit 1`,
    [tenantId, plate, recordId || null]
  );

  if (duplicate.rows[0]) throw new Error('Ja existe um veiculo cadastrado com essa placa.');

  return { name, plate, driver, type, km, nextMaintenance: nextMaintenance || '', status };
}
