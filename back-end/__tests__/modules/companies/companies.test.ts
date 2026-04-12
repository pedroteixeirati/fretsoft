import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const companiesControllerSource = readFileSync(resolve(process.cwd(), 'back-end/modules/companies/controllers/companies.controller.ts'), 'utf8');
const companiesRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/companies/repositories/companies.repository.ts'), 'utf8');
const companiesServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/companies/services/companies.service.ts'), 'utf8');

test('repositorio de companies lista e persiste registros explicitamente por tenant', () => {
  assert.match(companiesRepositorySource, /from companies\s+where tenant_id = \$1/i);
  assert.match(companiesRepositorySource, /insert into companies/i);
  assert.match(companiesRepositorySource, /update companies/i);
  assert.match(companiesRepositorySource, /delete from companies/i);
});

test('controller e service de companies usam fluxo explicito sem resources', () => {
  assert.match(companiesServiceSource, /export const companiesPermissions: ResourcePermissions = \{/);
  assert.match(companiesServiceSource, /export async function listCompanies\(auth\?: AuthContext\)/);
  assert.match(companiesServiceSource, /export async function createCompany\(auth: AuthContext \| undefined, body: Record<string, unknown>\)/);
  assert.match(companiesServiceSource, /export async function updateCompany\(auth: AuthContext \| undefined, id: string, body: Record<string, unknown>\)/);
  assert.match(companiesServiceSource, /export async function deleteCompany\(auth: AuthContext \| undefined, id: string\)/);
  assert.match(companiesControllerSource, /serializeCompanies\(await listCompanies\(req\.auth\)\)/);
  assert.match(companiesControllerSource, /serializeCompany\(await createCompany\(req\.auth, req\.body as Record<string, unknown>\)\)/);
  assert.doesNotMatch(companiesControllerSource, /createResource|listResources|updateResource|removeResource/);
});
