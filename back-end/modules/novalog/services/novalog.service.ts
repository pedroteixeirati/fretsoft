import { forbiddenError, validationError } from '../../../shared/errors/app-error';
import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import {
  isPositiveNumber,
  isValidDate,
  normalizeOptionalText,
  normalizeRequiredText,
} from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import type { NovalogBatchInput, NovalogEntriesFilters, NovalogEntryInput, NovalogEntryPayload } from '../dtos/novalog.types';
import {
  deleteTenantNovalogEntry,
  insertTenantNovalogEntriesBatch,
  insertTenantNovalogEntry,
  listTenantNovalogEntries,
  listTenantNovalogReferenceMonths,
  type NovalogEntryRow,
  updateTenantNovalogEntry,
} from '../repositories/novalog.repository';

export const novalogPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'operational'],
  update: ['dev', 'owner', 'admin', 'operational'],
  delete: ['dev', 'owner', 'admin', 'operational'],
};

function ensureNovalogContext(auth?: AuthContext) {
  if (!auth?.tenantId) {
    throw forbiddenError('Acesso ao modulo Novalog requer um tenant autenticado.');
  }

  if (auth.role !== 'dev' && auth.tenantSlug !== 'novalog') {
    throw forbiddenError('Modulo disponivel apenas para a operacao Novalog.');
  }
}

function buildReferenceMonth(operationDate: string) {
  return operationDate.slice(0, 7);
}

function normalizeEntriesFilters(filters: NovalogEntriesFilters = {}) {
  const referenceMonth = normalizeOptionalText(filters.referenceMonth);

  if (referenceMonth && !/^\d{4}-\d{2}$/.test(referenceMonth)) {
    throw validationError('Informe uma competencia valida no formato YYYY-MM.', 'invalid_novalog_reference_month', 'referenceMonth');
  }

  return {
    referenceMonth,
  };
}

function calculateAmounts(weight: number, companyRatePerTon: number, aggregatedRatePerTon: number) {
  const companyGrossAmount = Number((weight * companyRatePerTon).toFixed(2));
  const aggregatedGrossAmount = Number((weight * aggregatedRatePerTon).toFixed(2));
  const driverSharePercent = 40;
  const driverShareAmount = Number((aggregatedGrossAmount * 0.4).toFixed(2));
  const driverNetAmount = Number((aggregatedGrossAmount - driverShareAmount).toFixed(2));

  return {
    companyGrossAmount,
    aggregatedGrossAmount,
    driverSharePercent,
    driverShareAmount,
    driverNetAmount,
  };
}

function mapNovalogRow(row: NovalogEntryRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    referenceMonth: row.reference_month,
    weekNumber: Number(row.week_number),
    operationDate: row.operation_date,
    originName: row.origin_name,
    destinationName: row.destination_name,
    weight: Number(row.weight),
    companyRatePerTon: Number(row.company_rate_per_ton),
    companyGrossAmount: Number(row.company_gross_amount),
    aggregatedRatePerTon: Number(row.aggregated_rate_per_ton),
    aggregatedGrossAmount: Number(row.aggregated_gross_amount),
    ticketNumber: row.ticket_number || '',
    fuelStationName: row.fuel_station_name || '',
    driverName: row.driver_name || '',
    vehicleLabel: row.vehicle_label || '',
    driverSharePercent: Number(row.driver_share_percent),
    driverShareAmount: Number(row.driver_share_amount),
    driverNetAmount: Number(row.driver_net_amount),
    notes: row.notes || '',
    entryMode: row.entry_mode,
    batchKey: row.batch_key || '',
    createdByUserId: row.created_by_user_id || '',
    createdByName: row.created_by_name || '',
    createdAt: row.created_at,
  };
}

export async function validateNovalogEntryPayload(body: NovalogEntryInput): Promise<NovalogEntryPayload> {
  const operationDate = normalizeRequiredText(body.operationDate);
  const originName = normalizeRequiredText(body.originName);
  const destinationName = normalizeRequiredText(body.destinationName);
  const ticketNumber = normalizeOptionalText(body.ticketNumber);
  const fuelStationName = normalizeOptionalText(body.fuelStationName);
  const driverName = normalizeOptionalText(body.driverName);
  const vehicleLabel = normalizeOptionalText(body.vehicleLabel);
  const notes = normalizeOptionalText(body.notes);
  const batchKey = normalizeOptionalText(body.batchKey);
  const weekNumber = Number(body.weekNumber);
  const weight = Number(body.weight);
  const companyRatePerTon = Number(body.companyRatePerTon);
  const aggregatedRatePerTon = Number(body.aggregatedRatePerTon);
  const entryMode = body.entryMode === 'batch' ? 'batch' : 'standard';

  if (!isValidDate(operationDate)) throw validationError('Informe uma data valida para o lancamento.', 'invalid_novalog_date', 'operationDate');
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 4) {
    throw validationError('Informe uma semana valida entre 1 e 4.', 'invalid_novalog_week', 'weekNumber');
  }
  if (originName.length < 2) throw validationError('Informe a mineradora de origem.', 'invalid_novalog_origin', 'originName');
  if (destinationName.length < 2) throw validationError('Informe a siderurgica de destino.', 'invalid_novalog_destination', 'destinationName');
  if (!isPositiveNumber(weight)) throw validationError('Informe um peso maior que zero.', 'invalid_novalog_weight', 'weight');
  if (!isPositiveNumber(companyRatePerTon)) {
    throw validationError('Informe o valor empresa por tonelada.', 'invalid_novalog_company_rate', 'companyRatePerTon');
  }
  if (!isPositiveNumber(aggregatedRatePerTon)) {
    throw validationError('Informe o valor agregado por tonelada.', 'invalid_novalog_aggregated_rate', 'aggregatedRatePerTon');
  }

  const amounts = calculateAmounts(weight, companyRatePerTon, aggregatedRatePerTon);

  return {
    referenceMonth: buildReferenceMonth(operationDate),
    weekNumber,
    operationDate,
    originName,
    destinationName,
    weight,
    companyRatePerTon,
    companyGrossAmount: amounts.companyGrossAmount,
    aggregatedRatePerTon,
    aggregatedGrossAmount: amounts.aggregatedGrossAmount,
    ticketNumber,
    fuelStationName,
    driverName,
    vehicleLabel,
    driverSharePercent: amounts.driverSharePercent,
    driverShareAmount: amounts.driverShareAmount,
    driverNetAmount: amounts.driverNetAmount,
    notes,
    entryMode,
    batchKey,
  };
}

export async function validateNovalogBatchPayload(body: NovalogBatchInput) {
  const weekNumber = Number(body.weekNumber);
  const operationDate = normalizeRequiredText(body.operationDate);
  const originName = normalizeRequiredText(body.originName);
  const entries = Array.isArray(body.entries) ? body.entries : [];

  if (!isValidDate(operationDate)) {
    throw validationError('Informe uma data valida para o lote.', 'invalid_novalog_batch_date', 'operationDate');
  }
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 4) {
    throw validationError('Informe uma semana valida para o lote.', 'invalid_novalog_batch_week', 'weekNumber');
  }
  if (originName.length < 2) {
    throw validationError('Informe a mineradora de origem do lote.', 'invalid_novalog_batch_origin', 'originName');
  }
  if (entries.length === 0) {
    throw validationError('Adicione ao menos uma linha no lote.', 'invalid_novalog_batch_entries', 'entries');
  }

  const batchKey = `batch-${Date.now()}`;
  const normalizedEntries = await Promise.all(
    entries.map((entry, index) =>
      validateNovalogEntryPayload({
        ...entry,
        weekNumber,
        operationDate,
        originName,
        entryMode: 'batch',
        batchKey,
      }),
    ),
  );

  return normalizedEntries;
}

export async function listNovalogEntries(auth?: AuthContext, filters: NovalogEntriesFilters = {}) {
  ensureNovalogContext(auth);
  const rows = await listTenantNovalogEntries(auth?.tenantId || '', normalizeEntriesFilters(filters));
  return rows.map(mapNovalogRow);
}

export async function listNovalogReferenceMonths(auth?: AuthContext) {
  ensureNovalogContext(auth);
  return listTenantNovalogReferenceMonths(auth?.tenantId || '');
}

export async function createNovalogEntry(auth: AuthContext | undefined, body: NovalogEntryInput) {
  ensureNovalogContext(auth);
  const payload = await validateNovalogEntryPayload(body);
  const row = await insertTenantNovalogEntry(payload, auth?.tenantId || '', auth?.userId);
  return row ? mapNovalogRow(row) : null;
}

export async function createNovalogBatch(auth: AuthContext | undefined, body: NovalogBatchInput) {
  ensureNovalogContext(auth);
  const payloads = await validateNovalogBatchPayload(body);
  const rows = await insertTenantNovalogEntriesBatch(payloads, auth?.tenantId || '', auth?.userId);
  return rows.map(mapNovalogRow);
}

export async function updateNovalogEntry(auth: AuthContext | undefined, id: string, body: NovalogEntryInput) {
  ensureNovalogContext(auth);
  const payload = await validateNovalogEntryPayload(body);
  const row = await updateTenantNovalogEntry(id, payload, auth?.tenantId || '', auth?.userId);
  return row ? mapNovalogRow(row) : undefined;
}

export async function deleteNovalogEntry(auth: AuthContext | undefined, id: string) {
  ensureNovalogContext(auth);
  const row = await deleteTenantNovalogEntry(id, auth?.tenantId || '');
  return Boolean(row);
}
