import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const providerServiceSource = readFileSync(
  resolve(process.cwd(), 'back-end/modules/fiscal/services/fiscal-provider.service.ts'),
  'utf8',
);

function mockConsultBlock() {
  const marker = "name: 'mock_fiscal'";
  const start = providerServiceSource.indexOf(marker);
  assert.notEqual(start, -1, 'adapter mock_fiscal deve existir');
  const consultStart = providerServiceSource.indexOf('async consultDocument', start);
  assert.notEqual(consultStart, -1, 'mock deve implementar consultDocument');
  return providerServiceSource.slice(consultStart, providerServiceSource.indexOf('buildFiscalProviderRequest'));
}

test('mock provider expoe seletor por env com aliases dedicados', () => {
  assert.match(providerServiceSource, /mockProviderAliases = new Set\(\['mock', 'mock_fiscal', 'focus_nfe_mock'\]\)/);
  assert.match(providerServiceSource, /mockProviderAliases\.has\(providerName\)/);
  assert.match(providerServiceSource, /createMockFiscalProviderAdapter/);
});

test('mock emit retorna processamento sem exigir token', () => {
  const emitStart = providerServiceSource.indexOf('async emitDocument', providerServiceSource.indexOf("name: 'mock_fiscal'"));
  const emitBlock = providerServiceSource.slice(emitStart, providerServiceSource.indexOf('async consultDocument', emitStart));
  assert.match(emitBlock, /status: 'processing'/);
  assert.match(emitBlock, /status: 'processando_autorizacao'/);
  assert.match(emitBlock, /httpStatus: 202/);
  assert.doesNotMatch(emitBlock, /focusTokenFromEnv\(\)/);
});

test('mock consult espelha protocolo corretamente (regressao do bug protocolo/protocol)', () => {
  const block = mockConsultBlock();
  // O valor declarado e `protocol`; o payload Focus-like usa a chave `protocolo`.
  assert.match(block, /const protocol = mockProtocol\(request\.document\)/);
  assert.match(block, /protocolo: protocol/);
  // Garante que a referencia solta `protocolo,` (ReferenceError em runtime) nao volte.
  assert.doesNotMatch(block, /\n\s*protocolo,\s*\n/);
});

test('mock consult autoriza com chave, xml e dacte/damdfe', () => {
  const block = mockConsultBlock();
  assert.match(block, /status: 'authorized'/);
  assert.match(block, /accessKey/);
  assert.match(block, /mock:\/\/fiscal\/\$\{reference\}/);
  assert.match(block, /caminho_dacte/);
  assert.match(block, /caminho_damdfe/);
});

test('focus continua exigindo token para emitir', () => {
  assert.match(providerServiceSource, /function focusTokenFromEnv\(\)[\s\S]*throw fiscalErrors\.providerTokenMissing\(\)/);
});
