import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const freightsServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/freights/services/freights.service.ts'), 'utf8');
const freightsRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/freights/repositories/freights.repository.ts'), 'utf8');
const freightsControllerSource = readFileSync(resolve(process.cwd(), 'back-end/modules/freights/controllers/freights.controller.ts'), 'utf8');

test('servico de fretes expõe permissoes explícitas do domínio', () => {
  assert.match(freightsServiceSource, /export const freightsPermissions: ResourcePermissions = \{/);
  assert.match(freightsServiceSource, /read: \['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'\]/);
  assert.match(freightsServiceSource, /delete: \['dev', 'owner', 'admin', 'operational'\]/);
});

test('servico de fretes valida payload e orquestra CRUD explícito com revenues', () => {
  assert.match(freightsServiceSource, /export async function createFreight\(auth: AuthContext \| undefined, body: FreightInput\)/);
  assert.match(freightsServiceSource, /const payload = await validateFreightPayload\(body, tenantId\);/);
  assert.match(freightsServiceSource, /const row = await insertTenantFreight\(payload, tenantId, auth\?\.userId\);/);
  assert.match(freightsServiceSource, /await syncFreightRevenue\(tenantId, row, auth\?\.userId\);/);
  assert.match(freightsServiceSource, /await deleteFreightRevenue\(tenantId, id\);/);
});

test('repositorio de fretes consulta e persiste dados diretamente na tabela do domínio', () => {
  assert.match(freightsRepositorySource, /from freights[\s\S]*where tenant_id = \$1[\s\S]*order by date desc/i);
  assert.match(freightsRepositorySource, /insert into freights/i);
  assert.match(freightsRepositorySource, /update freights/i);
  assert.match(freightsRepositorySource, /delete from freights/i);
});

test('controller de fretes usa service explícito em vez de resources', () => {
  assert.match(freightsControllerSource, /import \{[\s\S]*createFreight,[\s\S]*deleteFreight,[\s\S]*freightsPermissions,[\s\S]*listFreights,[\s\S]*updateFreight,[\s\S]*\} from '\.\.\/services\/freights\.service';/);
  assert.doesNotMatch(freightsControllerSource, /createResourceByConfig|listResourcesByConfig|updateResourceByConfig|removeResourceByConfig/);
});
