import test from 'node:test';
import assert from 'node:assert/strict';
import { canPerform } from '../../shared/authorization/permissions.ts';
import { resources } from '../../shared/resources/resources.ts';
import { contractsResource } from '../../modules/contracts/contracts.resource.ts';
import { freightsResource } from '../../modules/freights/freights.resource.ts';
import { expensesResource } from '../../modules/expenses/expenses.resource.ts';

test('viewer nao pode criar, editar ou excluir recursos operacionais', () => {
  for (const resource of [...Object.values(resources), contractsResource, freightsResource, expensesResource]) {
    assert.equal(canPerform('create', resource.permissions, 'viewer'), false);
    assert.equal(canPerform('update', resource.permissions, 'viewer'), false);
    assert.equal(canPerform('delete', resource.permissions, 'viewer'), false);
  }
});

test('driver so pode criar e editar fretes entre os recursos operacionais', () => {
  assert.equal(canPerform('create', freightsResource.permissions, 'driver'), true);
  assert.equal(canPerform('update', freightsResource.permissions, 'driver'), true);
  assert.equal(canPerform('delete', freightsResource.permissions, 'driver'), false);

  assert.equal(canPerform('create', resources.vehicles.permissions, 'driver'), false);
  assert.equal(canPerform('create', expensesResource.permissions, 'driver'), false);
  assert.equal(canPerform('create', contractsResource.permissions, 'driver'), false);
});

test('financeiro pode operar despesas, mas nao pode alterar veiculos', () => {
  assert.equal(canPerform('create', expensesResource.permissions, 'financial'), true);
  assert.equal(canPerform('update', expensesResource.permissions, 'financial'), true);
  assert.equal(canPerform('delete', expensesResource.permissions, 'financial'), true);

  assert.equal(canPerform('create', resources.vehicles.permissions, 'financial'), false);
  assert.equal(canPerform('update', resources.vehicles.permissions, 'financial'), false);
});
