import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationSource = readFileSync(resolve(process.cwd(), 'back-end/migrations/1713412800000_fiscal_documents.sql'), 'utf8');
const nfeReceiptsMigrationSource = readFileSync(resolve(process.cwd(), 'back-end/migrations/1713474900000_fiscal_nfe_receipts.sql'), 'utf8');
const novalogLinkMigrationSource = readFileSync(resolve(process.cwd(), 'back-end/migrations/1713416400000_fiscal_novalog_revenue_links.sql'), 'utf8');
const controllerSource = readFileSync(resolve(process.cwd(), 'back-end/modules/fiscal/controllers/fiscal.controller.ts'), 'utf8');
const serviceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/fiscal/services/fiscal-documents.service.ts'), 'utf8');
const nfeReceiptsServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/fiscal/services/fiscal-nfe-receipts.service.ts'), 'utf8');
const nfeReceiptsRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/fiscal/repositories/fiscal-nfe-receipts.repository.ts'), 'utf8');
const nfeXmlParserSource = readFileSync(resolve(process.cwd(), 'back-end/modules/fiscal/utils/nfe-xml-parser.ts'), 'utf8');
const providerServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/fiscal/services/fiscal-provider.service.ts'), 'utf8');
const repositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/fiscal/repositories/fiscal-documents.repository.ts'), 'utf8');
const fiscalApiSource = readFileSync(resolve(process.cwd(), 'front-end/src/features/fiscal/services/fiscal.api.ts'), 'utf8');
const fiscalHookSource = readFileSync(resolve(process.cwd(), 'front-end/src/features/fiscal/hooks/useFiscalDocumentMutations.ts'), 'utf8');
const fiscalPageSource = readFileSync(resolve(process.cwd(), 'front-end/src/features/fiscal/pages/FiscalDocumentsPage.tsx'), 'utf8');

test('migration cria documentos fiscais como modulo generico multi-tenant', () => {
  assert.match(migrationSource, /create table if not exists fiscal_documents/i);
  assert.match(migrationSource, /tenant_id uuid not null references tenants\(id\) on delete cascade/i);
  assert.match(migrationSource, /document_type text not null default 'cte'/i);
  assert.match(migrationSource, /status text not null default 'draft'/i);
  assert.match(migrationSource, /xml text/i);
  assert.match(migrationSource, /tax_data jsonb not null default '\{\}'::jsonb/i);
  assert.match(migrationSource, /emitter_snapshot jsonb not null default '\{\}'::jsonb/i);
});

test('migration prepara partes eventos logs e vinculo futuro com fretes', () => {
  assert.match(migrationSource, /create table if not exists fiscal_document_parties/i);
  assert.match(migrationSource, /role in \('taker', 'sender', 'recipient', 'dispatcher', 'receiver'\)/i);
  assert.match(migrationSource, /create table if not exists fiscal_document_freights/i);
  assert.match(migrationSource, /freight_id uuid not null references freights\(id\) on delete cascade/i);
  assert.match(migrationSource, /create table if not exists fiscal_events/i);
  assert.match(migrationSource, /create table if not exists fiscal_communication_logs/i);
});

test('migration protege duplicidade por tenant e rastreia idempotencia', () => {
  assert.match(migrationSource, /idx_fiscal_documents_tenant_type_series_number/i);
  assert.match(migrationSource, /idx_fiscal_documents_tenant_access_key/i);
  assert.match(migrationSource, /idx_fiscal_documents_tenant_idempotency/i);
  assert.match(migrationSource, /trg_fiscal_documents_display_id/i);
});

test('caixa de NF-es recebidas persiste XML por tenant e gera base para CT-e', () => {
  assert.match(nfeReceiptsMigrationSource, /create table if not exists fiscal_nfe_receipts/i);
  assert.match(nfeReceiptsMigrationSource, /tenant_id uuid not null references tenants\(id\) on delete cascade/i);
  assert.match(nfeReceiptsMigrationSource, /source text not null default 'upload'/i);
  assert.match(nfeReceiptsMigrationSource, /status text not null default 'pending'/i);
  assert.match(nfeReceiptsMigrationSource, /idx_fiscal_nfe_receipts_tenant_nfe_key/i);
  assert.match(nfeReceiptsMigrationSource, /execute function assign_tenant_display_id\(\)/i);

  assert.match(controllerSource, /router\.get\('\/fiscal\/nfe-receipts'/);
  assert.match(controllerSource, /router\.post\('\/fiscal\/nfe-receipts\/import'/);
  assert.match(controllerSource, /router\.patch\('\/fiscal\/nfe-receipts\/:id\/status'/);
  assert.match(nfeReceiptsServiceSource, /parseNfeXml\(xml\)/);
  assert.match(nfeReceiptsServiceSource, /status: 'pending'/);
  assert.match(nfeReceiptsServiceSource, /status === 'used'/);
  assert.match(nfeReceiptsRepositorySource, /on conflict \(tenant_id, nfe_key\) do update/i);
  assert.match(fiscalApiSource, /\/api\/fiscal\/nfe-receipts\/import/);
  assert.match(fiscalHookSource, /importNfeReceipt/);
  assert.match(fiscalPageSource, /NF-es recebidas/);
  assert.match(fiscalPageSource, /Gerar CT-e/);
});

test('parser de NF-e extrai chave partes valor produto e peso', () => {
  assert.match(nfeXmlParserSource, /attrOf\(normalizedXml, 'infNFe', 'Id'\) \|\| textOf\(normalizedXml, 'chNFe'\)/);
  assert.match(nfeXmlParserSource, /nfeKey\.length !== 44/);
  assert.match(nfeXmlParserSource, /partyFromNode\(emit, 'enderEmit'\)/);
  assert.match(nfeXmlParserSource, /partyFromNode\(dest, 'enderDest'\)/);
  assert.match(nfeXmlParserSource, /invoiceAmount: numberFromText\(textOf\(total, 'vNF'\)\)/);
  assert.match(nfeXmlParserSource, /weight: numberFromText\(textOf\(vol, 'pesoB'\)\)/);
  assert.match(nfeXmlParserSource, /predominantProduct: textOf\(firstProduct, 'xProd'\)/);
  assert.match(nfeXmlParserSource, /ncm: digits\(textOf\(firstProduct, 'NCM'\)\)/);
});

test('reenvio por e-mail fica controlado quando provider nao suporta a operacao', () => {
  assert.match(providerServiceSource, /sendEmail\(request: FiscalProviderRequest, emails: string\[\]\)/);
  assert.doesNotMatch(providerServiceSource, /\/\$\{endpoint\}\/\$\{encodeURIComponent\(reference\)\}\/email/);
  assert.match(providerServiceSource, /providerOperationUnsupported/);
  assert.match(serviceSource, /export async function resendFiscalDocument/);
  assert.match(serviceSource, /document\.status !== 'authorized'\) throw fiscalErrors\.documentNotResendable\(\)/);
  assert.match(serviceSource, /provider\.sendEmail\(\{ \.\.\.request, operation: 'send_email' \}, cleanEmails\)/);
  assert.match(controllerSource, /router\.post\('\/fiscal\/documents\/:id\/email'/);
});

test('MDF-e: dados estruturados, agregacao de CT-es e encerramento', () => {
  const mdfeMigration = readFileSync(resolve(process.cwd(), 'back-end/migrations/1713441600000_mdfe_data.sql'), 'utf8');
  assert.match(mdfeMigration, /add column if not exists mdfe_data jsonb/i);

  assert.match(serviceSource, /function normalizeMdfeData/);
  assert.match(serviceSource, /export async function closeMdfeDocument/);
  assert.match(serviceSource, /document\.document_type !== 'mdfe' \|\| document\.status !== 'authorized' \|\| mdfe\.encerrado === true/);
  assert.match(serviceSource, /setFiscalDocumentMdfeData/);

  assert.match(providerServiceSource, /closeDocument\(request: FiscalProviderRequest\)/);
  assert.match(providerServiceSource, /cancelDocument\(request: FiscalProviderRequest, justification: string\)/);
  assert.match(providerServiceSource, /sendCorrectionLetter\(request: FiscalProviderRequest, correction: FiscalCorrectionLetterInput\)/);
  assert.match(providerServiceSource, /addMdfeDriver\(request: FiscalProviderRequest, driver: FiscalMdfeDriverInput\)/);
  assert.match(providerServiceSource, /\/mdfe\/\$\{encodeURIComponent\(reference\)\}\/encerrar/);
  assert.match(providerServiceSource, /method: 'DELETE'/);
  assert.match(providerServiceSource, /body: JSON\.stringify\(\{ justificativa: justification \}\)/);
  assert.match(providerServiceSource, /\/carta_correcao/);
  assert.match(providerServiceSource, /\/inclusao_condutor/);
  assert.match(providerServiceSource, /registro_nacional_transporte/);
  assert.match(providerServiceSource, /placa_veiculo/);
  assert.match(providerServiceSource, /municipios_descarregamento: mapMdfeMunicipiosDescarregamento/);
  assert.match(providerServiceSource, /chave_cte: String\(chave\)/);

  assert.match(controllerSource, /router\.post\('\/fiscal\/documents\/:id\/close'/);
  assert.match(controllerSource, /closeMdfeDocument\(req\.params\.id/);
  assert.match(controllerSource, /router\.post\('\/fiscal\/documents\/:id\/cancel'/);
  assert.match(controllerSource, /cancelFiscalDocument\(req\.params\.id/);
  assert.match(controllerSource, /router\.post\('\/fiscal\/documents\/:id\/correction-letter'/);
  assert.match(controllerSource, /sendFiscalCorrectionLetter\(req\.params\.id/);
  assert.match(controllerSource, /router\.post\('\/fiscal\/documents\/:id\/mdfe-driver'/);
  assert.match(controllerSource, /addMdfeDriverToDocument\(req\.params\.id/);
  assert.match(controllerSource, /router\.post\('\/fiscal\/webhooks\/focus\/:event\?'/);
  assert.match(controllerSource, /FOCUS_NFE_WEBHOOK_AUTHORIZATION/);
  assert.match(serviceSource, /export async function handleFocusWebhook/);
  assert.match(serviceSource, /findFiscalDocumentForProviderWebhook/);
  assert.match(serviceSource, /operation: 'provider_webhook'/);
  assert.match(repositorySource, /provider_document_id = \$1/);
  assert.match(controllerSource, /router\.get\('\/fiscal\/documents\/:id\/logs'/);
  assert.match(controllerSource, /router\.get\('\/fiscal\/documents\/:id\/events'/);
  assert.match(serviceSource, /export async function listFiscalDocumentCommunicationLogs/);
  assert.match(serviceSource, /export async function listFiscalDocumentEvents/);
  assert.match(repositorySource, /from fiscal_communication_logs l/);
  assert.match(repositorySource, /from fiscal_events e/);
  assert.match(serviceSource, /eventType: 'mdfe_close'/);
  assert.match(serviceSource, /eventType: 'cancel'/);
  assert.match(serviceSource, /eventType: 'correction_letter'/);
  assert.match(serviceSource, /eventType: 'mdfe_driver_add'/);
});

test('tomador derivado de tomadorTipo e cliente do contrato pre-preenche destinatario', () => {
  assert.match(providerServiceSource, /const tomadorCodes: Record<string, string> = \{ remetente: '0'/);
  assert.match(providerServiceSource, /tomador: tomadorCode \?\? document\.tax_data\?\.tomador/);
  assert.match(providerServiceSource, /tomadorCode === '4' \? focusPartyFields\('tomador', taker\)/);
  assert.match(serviceSource, /findContractCompanyForFreight/);
  assert.match(serviceSource, /role: 'recipient' as const/);
  assert.match(serviceSource, /tomadorTipo: company \? 'destinatario' : undefined/);
  assert.match(repositorySource, /join companies co on co\.id = c\.company_id/i);
});

test('CT-e completo: emitente automatico, partes com endereco/IBGE, tributacao e NF-e', () => {
  const cteMigration = readFileSync(resolve(process.cwd(), 'back-end/migrations/1713438000000_cte_fiscal_data.sql'), 'utf8');
  assert.match(cteMigration, /alter table if exists tenants add column if not exists crt text/i);
  assert.match(cteMigration, /fiscal_document_parties add column if not exists city_ibge_code text/i);
  assert.match(cteMigration, /fiscal_documents add column if not exists cte_data jsonb/i);

  // Emitente preenchido do tenant nos campos da Focus.
  assert.match(serviceSource, /async function buildEmitterSnapshot/);
  assert.match(serviceSource, /cnpj_emitente:/);
  assert.match(serviceSource, /findTenantEmitter/);
  assert.match(serviceSource, /document\.emitter_snapshot = \{ \.\.\.\(await buildEmitterSnapshot\(tenantId\)\)/);

  // Partes e cteData mapeados para a Focus.
  assert.match(providerServiceSource, /codigo_municipio_\$\{prefix\}/);
  assert.match(providerServiceSource, /logradouro_\$\{prefix\}/);
  assert.match(providerServiceSource, /icms_situacao_tributaria: cteData\.icmsCst/);
  assert.match(providerServiceSource, /cfop: cteData\.cfop/);
  assert.match(providerServiceSource, /nfes: cteNfes\(cteData, taxData\)/);
});

test('piso ANTT gera alerta nao-bloqueante via warnings', () => {
  assert.match(serviceSource, /function computePisoWarnings/);
  assert.match(serviceSource, /config\.fiscalPisoMinFreight/);
  assert.match(serviceSource, /payment\.componentType === '04' && payment\.amount < piso/);
  assert.match(serviceSource, /warnings: computePisoWarnings\(payload\)/);
  // Nao bloqueia: warnings sao retornados no documento, nao lancam erro.
  assert.doesNotMatch(serviceSource, /throw[^\n]*piso/i);
});

test('frete de terceiro exige CIOT/RNTRC/infPag e mapeia para o provider', () => {
  const ciotMigration = readFileSync(resolve(process.cwd(), 'back-end/migrations/1713434400000_fiscal_ciot_payments.sql'), 'utf8');
  assert.match(ciotMigration, /add column if not exists ciot text/i);
  assert.match(ciotMigration, /add column if not exists execution_mode text/i);
  assert.match(ciotMigration, /create table if not exists fiscal_document_payments/i);
  assert.match(ciotMigration, /check \(component_type in \('01', '02', '03', '04'\)\)/i);

  assert.match(serviceSource, /if \(executionMode === 'third_party'\)/);
  assert.match(serviceSource, /throw fiscalErrors\.ciotRequiredForThirdParty\(\)/);
  assert.match(serviceSource, /throw fiscalErrors\.rntrcRequiredForThirdParty\(\)/);
  assert.match(serviceSource, /throw fiscalErrors\.paymentRequiredForThirdParty\(\)/);

  assert.match(providerServiceSource, /function buildInfPag/);
  assert.match(providerServiceSource, /infPag: buildInfPag\(request\.payments\)/);
  assert.match(providerServiceSource, /ciot: document\.ciot/);
});

test('documento fiscal nasce de um frete com idempotencia por frete', () => {
  const sourceMigration = readFileSync(resolve(process.cwd(), 'back-end/migrations/1713430800000_fiscal_source_freight.sql'), 'utf8');
  assert.match(sourceMigration, /add column if not exists source_freight_id uuid references freights\(id\)/i);
  assert.match(sourceMigration, /idx_fiscal_documents_unique_source_freight[\s\S]*where source_freight_id is not null and status <> 'canceled'/i);
  assert.match(serviceSource, /export async function buildFiscalDraftFromFreight/);
  assert.match(serviceSource, /findFiscalDocumentBySourceFreight\(payload\.sourceFreightId, tenantId\)/);
  assert.match(serviceSource, /throw fiscalErrors\.duplicatedSourceFreight\(\)/);
  assert.match(controllerSource, /router\.get\('\/fiscal\/documents\/from-freight\/:freightId'/);
});

test('status fiscal e read-only: nasce draft e edicao preserva o estado atual', () => {
  assert.match(serviceSource, /createTenantFiscalDocument\(\{ \.\.\.payload, status: 'draft' \}/);
  assert.match(serviceSource, /editableStatuses\.includes\(current\.status\)/);
  assert.match(serviceSource, /throw fiscalErrors\.documentNotEditable\(\)/);
  assert.match(serviceSource, /updateTenantFiscalDocument\(id, \{ \.\.\.payload, status: current\.status \}/);
});

test('documento das partes preserva CNPJ alfanumerico', () => {
  assert.match(serviceSource, /documentNumber: normalizeDocumentNumber\(party\.documentNumber\)/);
  assert.match(providerServiceSource, /\[\^0-9A-Za-z\]/);
  assert.match(providerServiceSource, /const isCpf = document\.length === 11/);
});

test('service valida dados fiscais criticos antes de persistir', () => {
  assert.match(serviceSource, /const documentTypes: FiscalDocumentType\[\] = \['cte', 'cte_os', 'mdfe'\]/);
  assert.match(serviceSource, /const statuses: FiscalDocumentStatus\[\]/);
  assert.match(serviceSource, /\^\\d\{44\}\$/);
  assert.match(serviceSource, /isValidDate\(issueDate\)/);
  assert.match(serviceSource, /isPositiveNumber\(amount\)/);
  assert.match(serviceSource, /findFiscalDocumentDuplicate/);
  assert.match(serviceSource, /findFiscalDocumentByAccessKey/);
});

test('repository sempre filtra documentos fiscais por tenant', () => {
  assert.match(repositorySource, /from fiscal_documents\s+where tenant_id = \$1/i);
  assert.match(repositorySource, /where id = \$1\s+and tenant_id = \$2/i);
  assert.match(repositorySource, /delete from fiscal_documents[\s\S]*and tenant_id = \$2/i);
  assert.match(repositorySource, /from fiscal_document_parties[\s\S]*and tenant_id = \$2/i);
});

test('vinculo fiscal conecta CT-e Novalog e recebiveis sem duplicar documento', () => {
  assert.match(novalogLinkMigrationSource, /add column if not exists fiscal_document_id uuid references fiscal_documents\(id\) on delete set null/i);
  assert.match(novalogLinkMigrationSource, /idx_novalog_billing_items_fiscal_document_id/i);
  assert.match(novalogLinkMigrationSource, /idx_revenues_fiscal_document_id/i);
  assert.match(novalogLinkMigrationSource, /idx_novalog_billing_items_unique_fiscal_document/i);
  assert.match(repositorySource, /export async function upsertFiscalDocumentFromNovalogBillingItem/);
  assert.match(repositorySource, /on conflict \(tenant_id, document_type, series, number\) where status <> 'canceled' do update/i);
  assert.match(repositorySource, /normalizedAccessKey \? 'authorized' : 'draft'/);
});

test('integracao fiscal prepara provider e registra tentativas de emissao sem simular autorizacao', () => {
  assert.match(controllerSource, /router\.post\('\/fiscal\/documents\/:id\/emit'/);
  assert.match(controllerSource, /router\.post\('\/fiscal\/documents\/:id\/sync'/);
  assert.match(controllerSource, /emitFiscalDocument\(req\.params\.id, req\.auth\?\.tenantId, req\.auth\?\.userId\)/);
  assert.match(controllerSource, /syncFiscalDocument\(req\.params\.id, req\.auth\?\.tenantId, req\.auth\?\.userId\)/);
  assert.match(serviceSource, /export async function emitFiscalDocument/);
  assert.match(serviceSource, /export async function syncFiscalDocument/);
  assert.match(serviceSource, /\['draft', 'rejected', 'error'\]\.includes\(document\.status\)/);
  assert.match(serviceSource, /createFiscalCommunicationLog/);
  assert.match(serviceSource, /updateFiscalDocumentAfterProviderAttempt/);
  assert.match(providerServiceSource, /process\.env\.FISCAL_PROVIDER/);
  assert.match(providerServiceSource, /FOCUS_NFE_TOKEN/);
  assert.match(providerServiceSource, /FOCUS_NFE_BASE_URL/);
  assert.match(providerServiceSource, /https:\/\/homologacao\.focusnfe\.com\.br\/v2/);
  assert.match(providerServiceSource, /Authorization: focusAuthHeader\(token\)/);
  assert.match(providerServiceSource, /\/\$\{endpoint\}\?ref=\$\{encodeURIComponent\(reference\)\}/);
  assert.match(providerServiceSource, /\/\$\{endpoint\}\/\$\{encodeURIComponent\(reference\)\}\?completa=1/);
  assert.match(providerServiceSource, /caminho_xml/);
  assert.match(providerServiceSource, /caminho_dacte/);
  assert.match(providerServiceSource, /caminho_damdfe/);
  assert.match(providerServiceSource, /processando_autorizacao/);
  assert.match(providerServiceSource, /createFocusNfeProviderAdapter/);
  assert.match(providerServiceSource, /focusProviderAliases\.has\(providerName\)/);
  assert.match(providerServiceSource, /createMockFiscalProviderAdapter/);
  assert.match(providerServiceSource, /mockProviderAliases\.has\(providerName\)/);
  assert.match(providerServiceSource, /name: 'mock_fiscal'/);
  assert.match(providerServiceSource, /status: 'processando_autorizacao'/);
  assert.match(providerServiceSource, /mock:\/\/fiscal\/\$\{reference\}/);
  assert.match(providerServiceSource, /mockAccessKey/);
  assert.match(providerServiceSource, /mockProtocol/);
  assert.match(providerServiceSource, /throw fiscalErrors\.providerNotConfigured\(\)/);
  assert.match(repositorySource, /insert into fiscal_communication_logs/i);
  assert.match(repositorySource, /insert into fiscal_events/i);
  assert.match(repositorySource, /update fiscal_documents[\s\S]*provider_document_id = coalesce/i);
  assert.match(fiscalApiSource, /\/api\/fiscal\/documents\/\$\{id\}\/emit/);
  assert.match(fiscalApiSource, /\/api\/fiscal\/documents\/\$\{id\}\/logs/);
  assert.match(fiscalApiSource, /\/api\/fiscal\/documents\/\$\{id\}\/events/);
  assert.match(fiscalApiSource, /\/api\/fiscal\/documents\/\$\{id\}\/sync/);
  assert.match(fiscalApiSource, /\/api\/fiscal\/documents\/\$\{id\}\/cancel/);
  assert.match(fiscalApiSource, /\/api\/fiscal\/documents\/\$\{id\}\/correction-letter/);
  assert.match(fiscalApiSource, /\/api\/fiscal\/documents\/\$\{id\}\/mdfe-driver/);
  assert.match(fiscalHookSource, /emitDocument/);
  assert.match(fiscalHookSource, /syncDocument/);
  assert.match(fiscalHookSource, /cancelDocument/);
  assert.match(fiscalHookSource, /sendCorrectionLetter/);
  assert.match(fiscalHookSource, /addMdfeDriver/);
  assert.match(fiscalPageSource, /aria-label=\{`Emitir \$\{documentLabel\(document\)\}`\}/);
  assert.match(fiscalPageSource, /aria-label=\{`Sincronizar \$\{documentLabel\(document\)\}`\}/);
});
