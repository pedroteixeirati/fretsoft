import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const vehiclesControllerSource = readFileSync(resolve(process.cwd(), 'back-end/modules/vehicles/controllers/vehicles.controller.ts'), 'utf8');
const vehiclesRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/vehicles/repositories/vehicles.repository.ts'), 'utf8');
const vehiclesServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/vehicles/services/vehicles.service.ts'), 'utf8');

test('repositorio de vehicles lista e persiste registros explicitamente por tenant', () => {
  assert.match(vehiclesRepositorySource, /from vehicles\s+where tenant_id = \$1/i);
  assert.match(vehiclesRepositorySource, /insert into vehicles/i);
  assert.match(vehiclesRepositorySource, /update vehicles/i);
  assert.match(vehiclesRepositorySource, /delete from vehicles/i);
});

test('controller e service de vehicles usam fluxo explicito sem resources', () => {
  assert.match(vehiclesServiceSource, /export const vehiclesPermissions: ResourcePermissions = \{/);
  assert.match(vehiclesServiceSource, /export async function listVehicles\(auth\?: AuthContext\)/);
  assert.match(vehiclesServiceSource, /export async function createVehicle\(auth: AuthContext \| undefined, body: Record<string, unknown>\)/);
  assert.match(vehiclesServiceSource, /export async function updateVehicle\(auth: AuthContext \| undefined, id: string, body: Record<string, unknown>\)/);
  assert.match(vehiclesServiceSource, /export async function deleteVehicle\(auth: AuthContext \| undefined, id: string\)/);
  assert.match(vehiclesControllerSource, /serializeVehicles\(await listVehicles\(req\.auth\)\)/);
  assert.match(vehiclesControllerSource, /serializeVehicle\(await createVehicle\(req\.auth, req\.body as Record<string, unknown>\)\)/);
  assert.doesNotMatch(vehiclesControllerSource, /createResource|listResources|updateResource|removeResource/);
});
