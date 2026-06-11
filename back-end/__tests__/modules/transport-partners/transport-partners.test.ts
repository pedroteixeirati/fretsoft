import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

const migration = read('back-end/migrations/1713423600000_transport_partners.sql');
const controller = read('back-end/modules/transport-partners/controllers/transport-partners.controller.ts');
const service = read('back-end/modules/transport-partners/services/transport-partners.service.ts');
const repository = read('back-end/modules/transport-partners/repositories/transport-partners.repository.ts');
const appSource = read('back-end/shared/infra/http/app.ts');

test('migration cria transport_partners multi-tenant com tipo e status', () => {
  assert.match(migration, /create table if not exists transport_partners/i);
  assert.match(migration, /tenant_id uuid not null references tenants\(id\) on delete cascade/i);
  assert.match(migration, /check \(partner_type in \('tac', 'agregado'\)\)/i);
  assert.match(migration, /check \(status in \('active', 'inactive'\)\)/i);
  assert.match(migration, /idx_transport_partners_tenant_document/i);
  assert.match(migration, /trg_transport_partners_display_id/i);
});

test('cadastro de TAC exige feature fiscal.third_party habilitada', () => {
  assert.match(controller, /requireThirdPartyFeature/);
  assert.match(controller, /isFeatureEnabled\(features, 'fiscal'\)/);
  assert.match(controller, /isFeatureEnabled\(features, 'fiscal\.third_party'\)/);
  assert.match(appSource, /transportPartnersRouter/);
  assert.match(appSource, /app\.use\('\/api', transportPartnersRouter\)/);
});

test('service valida documento, tipo e RNTRC e preserva CNPJ alfanumerico', () => {
  assert.match(service, /isValidPartnerDocument/);
  assert.match(service, /normalizeDocumentNumber\(body\.documentNumber\)/);
  assert.match(service, /partnerTypes\.includes\(partnerType\)/);
  assert.match(service, /transportPartnerErrors\.duplicatedDocument/);
});

test('repository sempre filtra transportadores por tenant', () => {
  assert.match(repository, /from transport_partners\s+where tenant_id = \$1/i);
  assert.match(repository, /where id = \$1\s+and tenant_id = \$2/i);
  assert.match(repository, /delete from transport_partners[\s\S]*and tenant_id = \$2/i);
});
