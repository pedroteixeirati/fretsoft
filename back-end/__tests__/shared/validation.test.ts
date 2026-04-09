import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isNonNegativeNumber,
  isPositiveNumber,
  isValidCnpj,
  isValidCpf,
  isValidEmail,
  isValidPhone,
  isValidPlate,
  normalizeCnpj,
  normalizeCpf,
  normalizePhone,
  normalizePlate,
  slugify,
} from '../../shared/validation/validation.ts';

test('valida e normaliza CNPJ corretamente', () => {
  assert.equal(normalizeCnpj('12.544.992/0001-05'), '12544992000105');
  assert.equal(isValidCnpj('12.544.992/0001-05'), true);
  assert.equal(isValidCnpj('11.111.111/1111-11'), false);
});

test('valida e normaliza CPF corretamente', () => {
  assert.equal(normalizeCpf('390.533.447-05'), '39053344705');
  assert.equal(isValidCpf('390.533.447-05'), true);
  assert.equal(isValidCpf('111.111.111-11'), false);
});

test('valida placa mercosul e placa antiga', () => {
  assert.equal(normalizePlate('abc-1d23'), 'ABC1D23');
  assert.equal(isValidPlate('ABC1D23'), true);
  assert.equal(isValidPlate('ABC-1234'), true);
  assert.equal(isValidPlate('AB-123'), false);
});

test('valida email, telefone e numeros financeiros', () => {
  assert.equal(isValidEmail('financeiro@empresa.com.br'), true);
  assert.equal(isValidEmail('financeiro@empresa'), false);

  assert.equal(normalizePhone('(11) 99876-1234'), '11998761234');
  assert.equal(isValidPhone('(11) 99876-1234'), true);
  assert.equal(isValidPhone('12345'), false);

  assert.equal(isPositiveNumber(10), true);
  assert.equal(isPositiveNumber(0), false);
  assert.equal(isNonNegativeNumber(0), true);
});

test('gera slug seguro para cadastros administrativos', () => {
  assert.equal(slugify('Fretsoft Transportes LTDA'), 'fretsoft-transportes-ltda');
  assert.equal(slugify('  JP Soft / Plataforma  '), 'jp-soft-plataforma');
});
