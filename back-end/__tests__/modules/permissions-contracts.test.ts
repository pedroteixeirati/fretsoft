import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readModule(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

const frontPermissionsSource = readModule('front-end/src/lib/permissions.ts');
const sidebarSource = readModule('front-end/src/features/navigation/config/nav.config.ts');
const navigationSource = readModule('front-end/src/app/router/navigation.ts');
const expensesResourceSource = readModule('back-end/modules/expenses/expenses.resource.ts');
const payablesResourceSource = readModule('back-end/modules/payables/payables.resource.ts');

test('front-end mantem custos operacionais em Operacao e contas a pagar em Gestao', () => {
  assert.match(sidebarSource, /id: 'operations'[\s\S]*navItem\('expenses', 'Custos operacionais'/);
  assert.match(sidebarSource, /id: 'management'[\s\S]*navItem\('payables', 'Contas a pagar'/);
});

test('front-end permite leitura financeira ampla e protege acoes por perfil', () => {
  assert.match(frontPermissionsSource, /revenues:\s*\{[\s\S]*read: \['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'\]/);
  assert.match(frontPermissionsSource, /payables:\s*\{[\s\S]*read: \['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'\]/);
  assert.match(frontPermissionsSource, /payables:\s*\{[\s\S]*create: \['dev', 'owner', 'admin', 'financial'\]/);
  assert.match(frontPermissionsSource, /expenses:\s*\{[\s\S]*read: \['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'\]/);
  assert.match(frontPermissionsSource, /expenses:\s*\{[\s\S]*create: \['dev', 'owner', 'admin', 'operational'\]/);
  assert.match(frontPermissionsSource, /expenses:\s*\{[\s\S]*update: \['dev', 'owner', 'admin', 'operational'\]/);
  assert.match(frontPermissionsSource, /expenses:\s*\{[\s\S]*delete: \['dev', 'owner', 'admin', 'operational'\]/);
});

test('App resolve navegacao respeitando as novas secoes operacionais e financeiras', () => {
  assert.match(navigationSource, /case 'expenses':[\s\S]*canAccess\(profile, 'expenses', 'read'\)/);
  assert.match(navigationSource, /case 'revenues':\s*case 'payables':\s*case 'reports':\s*return activeTab;/);
});

test('back-end mantem custos operacionais e leitura financeira alinhados ao menu', () => {
  assert.match(expensesResourceSource, /read: \['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'\]/);
  assert.match(expensesResourceSource, /create: \['dev', 'owner', 'admin', 'operational'\]/);
  assert.match(expensesResourceSource, /update: \['dev', 'owner', 'admin', 'operational'\]/);
  assert.match(expensesResourceSource, /delete: \['dev', 'owner', 'admin', 'operational'\]/);

  assert.match(payablesResourceSource, /read: \['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'\]/);
  assert.match(payablesResourceSource, /create: \['dev', 'owner', 'admin', 'financial'\]/);
  assert.match(payablesResourceSource, /update: \['dev', 'owner', 'admin', 'financial'\]/);
  assert.match(payablesResourceSource, /delete: \['dev', 'owner', 'admin', 'financial'\]/);
});
