import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import { validationError } from '../../../shared/errors/app-error';
import { isValidDate, isValidUuid, normalizeOptionalText } from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import {
  deleteTenantVehicleDocument,
  findVehicleBelongsToTenant,
  insertTenantVehicleDocument,
  listTenantVehicleDocuments,
  updateTenantVehicleDocument,
  type VehicleDocumentRow,
} from '../repositories/vehicle-documents.repository';

export const vehicleDocumentPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'operational'],
  update: ['dev', 'owner', 'admin', 'operational'],
  delete: ['dev', 'owner', 'admin', 'operational'],
};

const documentTypes = ['ipva', 'licenciamento', 'tacografo', 'extintor', 'seguro', 'inspecao', 'outro'];
const statuses = ['active', 'archived'];

export function mapVehicleDocumentRow(row: VehicleDocumentRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name || '',
    vehiclePlate: row.vehicle_plate || '',
    documentType: row.document_type,
    identifier: row.identifier || '',
    amount: row.amount !== null && row.amount !== undefined ? Number(row.amount) : null,
    dueDate: row.due_date,
    status: row.status,
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function validateVehicleDocumentPayload(body: Record<string, unknown>, tenantId?: string) {
  const vehicleId = normalizeOptionalText(body.vehicleId as string) || '';
  const documentType = normalizeOptionalText(body.documentType as string) || 'outro';
  const identifier = normalizeOptionalText(body.identifier as string);
  const dueDate = normalizeOptionalText(body.dueDate as string) || '';
  const status = normalizeOptionalText(body.status as string) || 'active';
  const notes = normalizeOptionalText(body.notes as string);

  if (!isValidUuid(vehicleId)) {
    throw validationError('Selecione o veiculo do documento.', 'invalid_vehicle_document_vehicle', 'vehicleId');
  }
  if (!documentTypes.includes(documentType)) {
    throw validationError('Informe um tipo de documento valido.', 'invalid_vehicle_document_type', 'documentType');
  }
  if (!isValidDate(dueDate)) {
    throw validationError('Informe uma data de vencimento valida.', 'invalid_vehicle_document_due_date', 'dueDate');
  }
  if (!statuses.includes(status)) {
    throw validationError('Informe um status valido para o documento.', 'invalid_vehicle_document_status', 'status');
  }

  let amount: number | null = null;
  if (body.amount !== undefined && body.amount !== null && String(body.amount).trim() !== '') {
    const numericAmount = Number(body.amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      throw validationError('O valor do documento deve ser zero ou maior.', 'invalid_vehicle_document_amount', 'amount');
    }
    amount = Number(numericAmount.toFixed(2));
  }

  const vehicle = await findVehicleBelongsToTenant(vehicleId, tenantId);
  if (!vehicle) {
    throw validationError('Veiculo nao encontrado para esta transportadora.', 'invalid_vehicle_document_vehicle', 'vehicleId');
  }

  return {
    vehicleId,
    documentType,
    identifier,
    amount,
    dueDate,
    status,
    notes,
  };
}

export async function listVehicleDocuments(auth?: AuthContext) {
  const rows = await listTenantVehicleDocuments(auth?.tenantId);
  return rows.map(mapVehicleDocumentRow);
}

export async function createVehicleDocument(auth: AuthContext | undefined, body: Record<string, unknown>) {
  const payload = await validateVehicleDocumentPayload(body, auth?.tenantId);
  const row = await insertTenantVehicleDocument(payload, auth?.tenantId, auth?.userId);
  return row ? mapVehicleDocumentRow(row) : null;
}

export async function updateVehicleDocument(auth: AuthContext | undefined, id: string, body: Record<string, unknown>) {
  const payload = await validateVehicleDocumentPayload(body, auth?.tenantId);
  const row = await updateTenantVehicleDocument(id, payload, auth?.tenantId, auth?.userId);
  return row ? mapVehicleDocumentRow(row) : undefined;
}

export async function deleteVehicleDocument(auth: AuthContext | undefined, id: string) {
  const row = await deleteTenantVehicleDocument(id, auth?.tenantId);
  return Boolean(row);
}
