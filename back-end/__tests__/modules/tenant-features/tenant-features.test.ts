import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

const controller = read('back-end/modules/tenant-features/controllers/tenant-features.controller.ts');
const service = read('back-end/modules/tenant-features/services/tenant-features.service.ts');
const repository = read('back-end/modules/tenant-features/repositories/tenant-features.repository.ts');
const appSource = read('back-end/shared/infra/http/app.ts');

test('feature flags expostas via rotas dedicadas e registradas', () => {
  assert.match(controller, /router\.get\('\/tenant-features'/);
  assert.match(controller, /router\.put\('\/tenant-features\/:key'/);
  assert.match(appSource, /tenantFeaturesRouter/);
  assert.match(appSource, /app\.use\('\/api', tenantFeaturesRouter\)/);
});

test('apenas dev gerencia flags e somente chaves fiscais conhecidas', () => {
  assert.match(service, /function ensureDev/);
  assert.match(service, /auth\?\.role !== 'dev'/);
  assert.match(service, /FISCAL_FEATURE_KEYS/);
  assert.match(service, /invalid_feature_key/);
});

test('repository faz upsert por tenant e chave', () => {
  assert.match(repository, /from tenant_features\s+where tenant_id = \$1/i);
  assert.match(repository, /on conflict \(tenant_id, feature_key\) do update/i);
});
