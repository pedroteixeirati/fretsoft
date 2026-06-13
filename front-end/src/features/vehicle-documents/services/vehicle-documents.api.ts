import { createCrudApi } from '../../../shared/lib/api-client';
import { VehicleDocument } from '../types/vehicle-document.types';

export const vehicleDocumentsApi = createCrudApi<VehicleDocument>('/api/vehicle-documents');
