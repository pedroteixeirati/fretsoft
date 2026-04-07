import type { ContractInput } from '../../contracts/dtos/contract.types';
import { validateContractPayload } from '../../contracts/services/contracts.service';
import type { ExpenseInput } from '../../expenses/dtos/expense.types';
import { validateExpensePayload } from '../../expenses/services/expenses.service';
import type { FreightInput } from '../../freights/dtos/freight.types';
import { validateFreightPayload } from '../../freights/services/freights.service';
import { validateCompanyPayload } from '../../companies/services/companies.service';
import { validateProviderPayload } from '../../providers/services/providers.service';
import { validateVehiclePayload } from '../../vehicles/services/vehicles.service';
import type { ResourcePayload } from '../dtos/resource-payload.types';

export async function validateSimpleResourcePayload(
  resourceName: string,
  body: Record<string, unknown>,
  tenantId: string,
  recordId?: string
): Promise<ResourcePayload | null> {
  switch (resourceName) {
    case 'vehicles':
      return validateVehiclePayload(body, tenantId, recordId);
    case 'providers':
      return validateProviderPayload(body);
    case 'companies':
      return validateCompanyPayload(body, tenantId, recordId);
    case 'contracts':
      return validateContractPayload(body as unknown as ContractInput, tenantId);
    case 'freights':
      return validateFreightPayload(body as unknown as FreightInput, tenantId);
    case 'expenses':
      return validateExpensePayload(body as unknown as ExpenseInput, tenantId);
    default:
      return null;
  }
}
