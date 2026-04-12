import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const providersControllerSource = readFileSync(resolve(process.cwd(), 'back-end/modules/providers/controllers/providers.controller.ts'), 'utf8');
const providersRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/providers/repositories/providers.repository.ts'), 'utf8');
const providersServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/providers/services/providers.service.ts'), 'utf8');

test('repositorio de providers lista e persiste registros explicitamente por tenant', () => {
  assert.match(providersRepositorySource, /from providers\s+where tenant_id = \$1/i);
  assert.match(providersRepositorySource, /insert into providers/i);
  assert.match(providersRepositorySource, /update providers/i);
  assert.match(providersRepositorySource, /delete from providers/i);
});

test('controller e service de providers usam fluxo explicito sem resources', () => {
  assert.match(providersServiceSource, /export const providersPermissions: ResourcePermissions = \{/);
  assert.match(providersServiceSource, /export async function listProviders\(auth\?: AuthContext\)/);
  assert.match(providersServiceSource, /export async function createProvider\(auth: AuthContext \| undefined, body: Record<string, unknown>\)/);
  assert.match(providersServiceSource, /export async function updateProvider\(auth: AuthContext \| undefined, id: string, body: Record<string, unknown>\)/);
  assert.match(providersServiceSource, /export async function deleteProvider\(auth: AuthContext \| undefined, id: string\)/);
  assert.match(providersControllerSource, /serializeProviders\(await listProviders\(req\.auth\)\)/);
  assert.match(providersControllerSource, /serializeProvider\(await createProvider\(req\.auth, req\.body as Record<string, unknown>\)\)/);
  assert.doesNotMatch(providersControllerSource, /createResource|listResources|updateResource|removeResource/);
});
