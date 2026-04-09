import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppError, conflictError, forbiddenError, notFoundError, unauthorizedError, validationError } from '../../shared/errors/app-error.ts';

const errorResponseSource = readFileSync(resolve(process.cwd(), 'back-end/shared/http/error-response.ts'), 'utf8');

test('AppError padroniza status code field e details', () => {
  const error = validationError('Informe uma placa valida para o veiculo.', 'invalid_plate', 'plate');

  assert.equal(error.statusCode, 400);
  assert.equal(error.code, 'invalid_plate');
  assert.equal(error.field, 'plate');
  assert.equal(error.details, null);
});

test('helpers de erro especializados usam status corretos', () => {
  assert.equal(unauthorizedError('Token ausente.').statusCode, 401);
  assert.equal(forbiddenError('Sem permissao.').statusCode, 403);
  assert.equal(notFoundError('Registro nao encontrado.').statusCode, 404);
  assert.equal(conflictError('Registro duplicado.').statusCode, 409);
});

test('error-response expone o shape consumivel pelo front', () => {
  assert.match(errorResponseSource, /error: error\.message/);
  assert.match(errorResponseSource, /code: error\.code/);
  assert.match(errorResponseSource, /field: error\.field/);
  assert.match(errorResponseSource, /details: error\.details/);
});
