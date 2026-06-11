import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const freightsServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/freights/services/freights.service.ts'), 'utf8');
const freightsRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/freights/repositories/freights.repository.ts'), 'utf8');
const freightsControllerSource = readFileSync(resolve(process.cwd(), 'back-end/modules/freights/controllers/freights.controller.ts'), 'utf8');

test('servico de fretes expoe permissoes explicitas do dominio', () => {
  assert.match(freightsServiceSource, /export const freightsPermissions: ResourcePermissions = \{/);
  assert.match(freightsServiceSource, /read: \['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'\]/);
  assert.match(freightsServiceSource, /delete: \['dev', 'owner', 'admin', 'operational'\]/);
});

test('frete marca execucao propria/terceiro e exige TAC quando terceiro', () => {
  assert.match(freightsServiceSource, /executionMode !== 'own_fleet' && executionMode !== 'third_party'/);
  assert.match(freightsServiceSource, /throw freightErrors\.invalidExecutionMode\(\)/);
  assert.match(freightsServiceSource, /if \(executionMode === 'third_party'\)/);
  assert.match(freightsServiceSource, /findTenantTransportPartnerForFreight/);
  assert.match(freightsServiceSource, /throw freightErrors\.transportPartnerNotFound\(\)/);
  assert.match(freightsRepositorySource, /execution_mode/);
  assert.match(freightsRepositorySource, /transport_partner_id/);
});

test('servico de fretes valida origem e destino explicitamente no dominio', () => {
  assert.doesNotMatch(freightsServiceSource, /resolveOriginAndDestination|buildFreightRoute/);
  assert.match(freightsServiceSource, /const origin = normalizeRequiredText\(body\.origin\);/);
  assert.match(freightsServiceSource, /const destination = normalizeRequiredText\(body\.destination\);/);
  assert.match(freightsServiceSource, /if \(origin.length < 3\) throw freightErrors\.invalidOrigin\(\);/);
  assert.match(freightsServiceSource, /if \(destination.length < 3\) throw freightErrors\.invalidDestination\(\);/);
});

test('servico de fretes orquestra CRUD explicito com revenues', () => {
  assert.match(freightsServiceSource, /export async function createFreight\(auth: AuthContext \| undefined, body: FreightInput\)/);
  assert.match(freightsServiceSource, /const payload = await validateFreightPayload\(body, tenantId\);/);
  assert.match(freightsServiceSource, /const row = await insertTenantFreight\(payload, tenantId, auth\?\.userId\);/);
  assert.match(freightsServiceSource, /await syncFreightRevenue\(tenantId, row, auth\?\.userId\);/);
  assert.match(freightsServiceSource, /await deleteFreightRevenue\(tenantId, id\);/);
});

test('repositorio de fretes consulta e persiste origem e destino diretamente na tabela do dominio', () => {
  assert.match(freightsRepositorySource, /select id,[\s\S]*display_id,[\s\S]*tenant_id,[\s\S]*vehicle_id,[\s\S]*plate,[\s\S]*contract_id,[\s\S]*contract_name,[\s\S]*billing_type,[\s\S]*date,[\s\S]*origin,[\s\S]*destination,[\s\S]*amount,[\s\S]*has_carga/i);
  assert.doesNotMatch(freightsRepositorySource, /\broute\b/);
  assert.match(freightsRepositorySource, /from freights[\s\S]*where tenant_id = \$1[\s\S]*order by date desc/i);
  assert.match(freightsRepositorySource, /insert into freights/i);
  assert.match(freightsRepositorySource, /update freights/i);
  assert.match(freightsRepositorySource, /delete from freights/i);
});

test('controller de fretes usa service explicito em vez de resources', () => {
  assert.match(freightsControllerSource, /import \{[\s\S]*createFreight,[\s\S]*deleteFreight,[\s\S]*freightsPermissions,[\s\S]*listFreights,[\s\S]*updateFreight,[\s\S]*\} from '\.\.\/services\/freights\.service';/);
  assert.doesNotMatch(freightsControllerSource, /createResourceByConfig|listResourcesByConfig|updateResourceByConfig|removeResourceByConfig/);
});
