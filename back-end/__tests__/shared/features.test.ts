import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FISCAL_FEATURE_KEYS, isFeatureEnabled } from '../../shared/authorization/features.ts';

test('isFeatureEnabled so retorna true para flag explicitamente habilitada', () => {
  assert.equal(isFeatureEnabled({ fiscal: true }, 'fiscal'), true);
  assert.equal(isFeatureEnabled({ fiscal: false }, 'fiscal'), false);
  assert.equal(isFeatureEnabled({}, 'fiscal'), false);
  assert.equal(isFeatureEnabled(undefined, 'fiscal'), false);
  assert.equal(isFeatureEnabled({ 'fiscal.cte': true }, 'fiscal'), false);
});

test('chaves fiscais cobrem mestre e sub-flags do rollout', () => {
  assert.deepEqual([...FISCAL_FEATURE_KEYS], ['fiscal', 'fiscal.cte', 'fiscal.mdfe', 'fiscal.third_party']);
});

test('migration cria tenant_features multi-tenant com unicidade por chave', () => {
  const source = readFileSync(resolve(process.cwd(), 'back-end/migrations/1713420000000_tenant_features.sql'), 'utf8');
  assert.match(source, /create table if not exists tenant_features/i);
  assert.match(source, /tenant_id uuid not null references tenants\(id\) on delete cascade/i);
  assert.match(source, /feature_key text not null/i);
  assert.match(source, /enabled boolean not null default false/i);
  assert.match(source, /idx_tenant_features_tenant_key/i);
});

test('contexto de auth resolve features e respeita kill-switch global', () => {
  const source = readFileSync(resolve(process.cwd(), 'back-end/modules/auth/services/auth-context.service.ts'), 'utf8');
  assert.match(source, /findTenantFeatures/);
  assert.match(source, /config\.fiscalModuleEnabled/);
  assert.match(source, /row\.feature_key\.startsWith\('fiscal'\)/);
  assert.match(source, /features,/);
});

test('controller fiscal exige a feature e perfil expoe features', () => {
  const controller = readFileSync(resolve(process.cwd(), 'back-end/modules/fiscal/controllers/fiscal.controller.ts'), 'utf8');
  assert.match(controller, /requireFiscalFeature/);
  assert.match(controller, /ensureFeature\(res, req\.auth\?\.features, 'fiscal'/);
  const authController = readFileSync(resolve(process.cwd(), 'back-end/modules/auth/controllers/auth.controller.ts'), 'utf8');
  assert.match(authController, /features: auth\.features/);
});
