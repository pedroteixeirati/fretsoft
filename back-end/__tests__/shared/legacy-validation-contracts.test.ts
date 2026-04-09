import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readModule(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

const vehiclesServiceSource = readModule('back-end/modules/vehicles/services/vehicles.service.ts');
const companiesServiceSource = readModule('back-end/modules/companies/services/companies.service.ts');
const providersServiceSource = readModule('back-end/modules/providers/services/providers.service.ts');
const usersServiceSource = readModule('back-end/modules/users/services/users.service.ts');
const tenantsServiceSource = readModule('back-end/modules/tenants/services/tenants.service.ts');

test('vehicles usa erros de validacao e conflito tipados', () => {
  assert.match(vehiclesServiceSource, /validationError\('Informe uma placa valida para o veiculo\.', 'invalid_plate', 'plate'\)/);
  assert.match(vehiclesServiceSource, /conflictError\('Ja existe um veiculo cadastrado com essa placa\.', 'vehicle_plate_conflict', 'plate'\)/);
});

test('companies providers users e tenants nao usam mais new Error para validacao HTTP', () => {
  assert.doesNotMatch(companiesServiceSource, /throw new Error/);
  assert.doesNotMatch(providersServiceSource, /throw new Error/);
  assert.doesNotMatch(usersServiceSource, /throw new Error/);
  assert.doesNotMatch(tenantsServiceSource, /throw new Error/);
});
