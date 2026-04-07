import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readModule(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

const frontPermissionsSource = readModule('front-end/src/lib/permissions.ts');
const sidebarSource = readModule('front-end/src/components/Sidebar.tsx');
const appSource = readModule('front-end/src/App.tsx');
const expensesResourceSource = readModule('back-end/modules/expenses/expenses.resource.ts');
const payablesResourceSource = readModule('back-end/modules/payables/payables.resource.ts');

test('front-end mantém custos operacionais em Operacao e contas a pagar em Gestao', () => {
  assert.match(sidebarSource, /id: 'operations'[\s\S]*id: 'expenses', label: 'Custos operacionais'/);
  assert.match(sidebarSource, /id: 'management'[\s\S]*id: 'payables', label: 'Contas a pagar'/);
});

test('front-end protege acesso de custos operacionais e contas a pagar por perfil', () => {
  assert.match(frontPermissionsSource, /payables:\s*\{[\s\S]*read: \['dev', 'owner', 'admin', 'financial'\]/);
  assert.match(frontPermissionsSource, /payables:\s*\{[\s\S]*create: \['dev', 'owner', 'admin', 'financial'\]/);
  assert.match(frontPermissionsSource, /expenses:\s*\{[\s\S]*read: \['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'\]/);
  assert.match(frontPermissionsSource, /expenses:\s*\{[\s\S]*create: \['dev', 'owner', 'admin', 'operational'\]/);
  assert.match(frontPermissionsSource, /expenses:\s*\{[\s\S]*update: \['dev', 'owner', 'admin', 'operational'\]/);
  assert.match(frontPermissionsSource, /expenses:\s*\{[\s\S]*delete: \['dev', 'owner', 'admin', 'operational'\]/);
});

test('App resolve navegação respeitando as novas secoes operacionais e financeiras', () => {
  assert.match(appSource, /case 'expenses':[\s\S]*canAccess\(profile, 'expenses', 'read'\)/);
  assert.match(appSource, /case 'payables':[\s\S]*canAccess\(profile, 'payables', 'read'\)/);
});

test('back-end mantém custos operacionais com ownership operacional e payables com ownership financeiro', () => {
  assert.match(expensesResourceSource, /read: \['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'\]/);
  assert.match(expensesResourceSource, /create: \['dev', 'owner', 'admin', 'operational'\]/);
  assert.match(expensesResourceSource, /update: \['dev', 'owner', 'admin', 'operational'\]/);
  assert.match(expensesResourceSource, /delete: \['dev', 'owner', 'admin', 'operational'\]/);

  assert.match(payablesResourceSource, /read: \['dev', 'owner', 'admin', 'financial'\]/);
  assert.match(payablesResourceSource, /create: \['dev', 'owner', 'admin', 'financial'\]/);
  assert.match(payablesResourceSource, /update: \['dev', 'owner', 'admin', 'financial'\]/);
  assert.match(payablesResourceSource, /delete: \['dev', 'owner', 'admin', 'financial'\]/);
});
