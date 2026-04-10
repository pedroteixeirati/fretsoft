import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readModule(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

const authControllerSource = readModule('back-end/modules/auth/controllers/auth.controller.ts');
const cargasControllerSource = readModule('back-end/modules/cargas/controllers/cargas.controller.ts');
const companiesControllerSource = readModule('back-end/modules/companies/controllers/companies.controller.ts');
const contractsControllerSource = readModule('back-end/modules/contracts/controllers/contracts.controller.ts');
const expensesControllerSource = readModule('back-end/modules/expenses/controllers/expenses.controller.ts');
const freightsControllerSource = readModule('back-end/modules/freights/controllers/freights.controller.ts');
const payablesControllerSource = readModule('back-end/modules/payables/controllers/payables.controller.ts');
const resourcesControllerSource = readModule('back-end/modules/resources/controllers/resources.controller.ts');
const revenuesControllerSource = readModule('back-end/modules/revenues/controllers/revenues.controller.ts');
const tenantsControllerSource = readModule('back-end/modules/tenants/controllers/tenants.controller.ts');
const usersControllerSource = readModule('back-end/modules/users/controllers/users.controller.ts');
const appSource = readModule('back-end/shared/infra/http/app.ts');
const errorHandlerSource = readModule('back-end/shared/http/error-handler.ts');
const ensureAllowedSource = readModule('back-end/shared/http/ensure-allowed.ts');
const authMiddlewareSource = readModule('back-end/modules/auth/middlewares/load-auth-context.middleware.ts');

test('app HTTP registra todos os routers principais da API', () => {
  assert.match(appSource, /app\.use\('\/api', authRouter\)/);
  assert.match(appSource, /app\.use\('\/api', tenantsRouter\)/);
  assert.match(appSource, /app\.use\('\/api', usersRouter\)/);
  assert.match(appSource, /app\.use\('\/api', companiesRouter\)/);
  assert.match(appSource, /app\.use\('\/api', contractsRouter\)/);
  assert.match(appSource, /app\.use\('\/api', cargasRouter\)/);
  assert.match(appSource, /app\.use\('\/api', freightsRouter\)/);
  assert.match(appSource, /app\.use\('\/api', expensesRouter\)/);
  assert.match(appSource, /app\.use\('\/api', payablesRouter\)/);
  assert.match(appSource, /app\.use\('\/api\/revenues', revenuesRouter\)/);
  assert.match(appSource, /app\.use\('\/api', resourcesRouter\)/);
});

test('auth expoe endpoint de perfil autenticado com dados do tenant', () => {
  assert.match(authControllerSource, /router\.get\('\/me\/profile'/);
  assert.match(authControllerSource, /tenantId: auth\.tenantId/);
  assert.match(authControllerSource, /tenantName: auth\.tenantName/);
  assert.match(authControllerSource, /tenantSlug: auth\.tenantSlug/);
  assert.match(authControllerSource, /tenantLogoUrl: auth\.tenantLogoUrl \|\| ''/);
});

test('contrato global de erro usa code field e details no backend', () => {
  assert.match(errorHandlerSource, /sendErrorResponse\(res, error\)/);
  assert.match(errorHandlerSource, /code: 'internal_server_error'/);
  assert.match(ensureAllowedSource, /forbiddenError\(message\)/);
  assert.match(authMiddlewareSource, /unauthorizedError\('Token de autenticacao ausente\.'/);
  assert.match(authMiddlewareSource, /tenant_access_required/);
});

test('contracts expoe CRUD completo com permissoes e respostas esperadas', () => {
  assert.match(contractsControllerSource, /router\.get\('\/contracts'/);
  assert.match(contractsControllerSource, /router\.post\('\/contracts'/);
  assert.match(contractsControllerSource, /router\.put\('\/contracts\/:id'/);
  assert.match(contractsControllerSource, /router\.delete\('\/contracts\/:id'/);
  assert.match(contractsControllerSource, /Sem permissao para visualizar este recurso\./);
  assert.match(contractsControllerSource, /Sem permissao para criar neste recurso\./);
  assert.match(contractsControllerSource, /Sem permissao para editar este recurso\./);
  assert.match(contractsControllerSource, /Sem permissao para excluir este recurso\./);
  assert.match(contractsControllerSource, /Registro nao encontrado\./);
  assert.match(contractsControllerSource, /serializeContracts\(await listResourcesByConfig\(contractsResource, req\.auth\)\)/);
  assert.match(contractsControllerSource, /res\.status\(201\)\.json\(serializeContract\(await createResourceByConfig\('contracts'/);
});

test('companies expoe CRUD proprio com serializer e guardas consistentes', () => {
  assert.match(companiesControllerSource, /router\.get\('\/companies'/);
  assert.match(companiesControllerSource, /router\.post\('\/companies'/);
  assert.match(companiesControllerSource, /router\.put\('\/companies\/:id'/);
  assert.match(companiesControllerSource, /router\.delete\('\/companies\/:id'/);
  assert.match(companiesControllerSource, /serializeCompanies\(await listCompanies\(req\.auth\)\)/);
  assert.match(companiesControllerSource, /serializeCompany\(await createCompany\(req\.auth, req\.body as Record<string, unknown>\)\)/);
  assert.match(companiesControllerSource, /sendErrorResponse\(res, notFoundError\('Registro nao encontrado\.', 'company_not_found'\)\)/);
});

test('freights expoe CRUD completo com serializer e guardas de recurso', () => {
  assert.match(freightsControllerSource, /router\.get\('\/freights'/);
  assert.match(freightsControllerSource, /router\.post\('\/freights'/);
  assert.match(freightsControllerSource, /router\.put\('\/freights\/:id'/);
  assert.match(freightsControllerSource, /router\.delete\('\/freights\/:id'/);
  assert.match(freightsControllerSource, /serializeFreights\(await listResourcesByConfig\(freightsResource, req\.auth\)\)/);
  assert.match(freightsControllerSource, /serializeFreight\(await createResourceByConfig\('freights'/);
  assert.match(freightsControllerSource, /const deleted = await removeResourceByConfig\('freights'/);
});

test('cargas expoe CRUD proprio e listagem por frete com guardas consistentes', () => {
  assert.match(cargasControllerSource, /router\.get\('\/cargas'/);
  assert.match(cargasControllerSource, /router\.get\('\/freights\/:id\/cargas'/);
  assert.match(cargasControllerSource, /router\.post\('\/cargas'/);
  assert.match(cargasControllerSource, /router\.put\('\/cargas\/:id'/);
  assert.match(cargasControllerSource, /router\.delete\('\/cargas\/:id'/);
  assert.match(cargasControllerSource, /Sem permissao para visualizar cargas\./);
  assert.match(cargasControllerSource, /Sem permissao para criar cargas\./);
  assert.match(cargasControllerSource, /Sem permissao para editar cargas\./);
  assert.match(cargasControllerSource, /Sem permissao para excluir cargas\./);
  assert.match(cargasControllerSource, /Carga nao encontrada\./);
});

test('expenses expoe CRUD completo com serializer e not found consistente', () => {
  assert.match(expensesControllerSource, /router\.get\('\/expenses'/);
  assert.match(expensesControllerSource, /router\.post\('\/expenses'/);
  assert.match(expensesControllerSource, /router\.put\('\/expenses\/:id'/);
  assert.match(expensesControllerSource, /router\.delete\('\/expenses\/:id'/);
  assert.match(expensesControllerSource, /serializeExpenses\(await listResourcesByConfig\(expensesResource, req\.auth\)\)/);
  assert.match(expensesControllerSource, /serializeExpense\(await createResourceByConfig\('expenses'/);
  assert.match(expensesControllerSource, /sendErrorResponse\(res, notFoundError\('Registro nao encontrado\.', 'expense_not_found'\)\)/);
});

test('payables expoe CRUD e acoes financeiras minimas com guardas consistentes', () => {
  assert.match(payablesControllerSource, /router\.get\('\/payables'/);
  assert.match(payablesControllerSource, /router\.post\('\/payables'/);
  assert.match(payablesControllerSource, /router\.put\('\/payables\/:id'/);
  assert.match(payablesControllerSource, /router\.delete\('\/payables\/:id'/);
  assert.match(payablesControllerSource, /router\.post\('\/payables\/:id\/pay'/);
  assert.match(payablesControllerSource, /router\.post\('\/payables\/:id\/overdue'/);
  assert.match(payablesControllerSource, /Sem permissao para visualizar contas a pagar\./);
  assert.match(payablesControllerSource, /Sem permissao para criar contas a pagar\./);
  assert.match(payablesControllerSource, /Sem permissao para editar contas a pagar\./);
  assert.match(payablesControllerSource, /Sem permissao para excluir contas a pagar\./);
  assert.match(payablesControllerSource, /Sem permissao para registrar pagamento\./);
  assert.match(payablesControllerSource, /Sem permissao para marcar atraso\./);
  assert.match(payablesControllerSource, /Conta a pagar nao encontrada\./);
});

test('resources genericos cobrem vehicles e providers com CRUD seguro', () => {
  assert.match(resourcesControllerSource, /new Set\(\['vehicles', 'providers'\]\)/);
  assert.match(resourcesControllerSource, /router\.get\('\/:resourceName'/);
  assert.match(resourcesControllerSource, /router\.post\('\/:resourceName'/);
  assert.match(resourcesControllerSource, /router\.put\('\/:resourceName\/:id'/);
  assert.match(resourcesControllerSource, /router\.delete\('\/:resourceName\/:id'/);
  assert.match(resourcesControllerSource, /Recurso nao encontrado\./);
  assert.match(resourcesControllerSource, /const created = await createResource\(req\.params\.resourceName, req\.auth, req\.body as Record<string, unknown>\)/);
  assert.match(resourcesControllerSource, /const deleted = await removeResource\(req\.params\.resourceName, req\.auth, req\.params\.id\)/);
});

test('revenues expoe listagem geracao cobranca recebimento e atraso', () => {
  assert.match(revenuesControllerSource, /router\.get\('\/'/);
  assert.match(revenuesControllerSource, /router\.post\('\/generate'/);
  assert.match(revenuesControllerSource, /router\.post\('\/:id\/charge'/);
  assert.match(revenuesControllerSource, /router\.post\('\/:id\/receive'/);
  assert.match(revenuesControllerSource, /router\.post\('\/:id\/overdue'/);
  assert.match(revenuesControllerSource, /Sem permissao para visualizar receitas\./);
  assert.match(revenuesControllerSource, /Sem permissao para gerar receitas\./);
  assert.match(revenuesControllerSource, /Sem permissao para gerar cobrancas\./);
  assert.match(revenuesControllerSource, /Sem permissao para atualizar o recebimento\./);
  assert.match(revenuesControllerSource, /Sem permissao para marcar atraso\./);
  assert.match(revenuesControllerSource, /Receita nao encontrada\./);
});

test('tenants expoe perfil do tenant e administracao de tenants da plataforma', () => {
  assert.match(tenantsControllerSource, /router\.get\('\/tenant-profile'/);
  assert.match(tenantsControllerSource, /router\.put\('\/tenant-profile'/);
  assert.match(tenantsControllerSource, /router\.get\('\/platform\/tenants'/);
  assert.match(tenantsControllerSource, /router\.post\('\/platform\/tenants'/);
  assert.match(tenantsControllerSource, /Sem permissao para visualizar o perfil da transportadora\./);
  assert.match(tenantsControllerSource, /Sem permissao para editar o perfil da transportadora\./);
  assert.match(tenantsControllerSource, /Sem permissao para visualizar transportadoras da plataforma\./);
  assert.match(tenantsControllerSource, /Sem permissao para criar transportadoras\./);
  assert.match(tenantsControllerSource, /Transportadora nao encontrada\./);
});

test('users expoe endpoint para criacao de usuarios no tenant', () => {
  assert.match(usersControllerSource, /router\.post\('\/users'/);
  assert.match(usersControllerSource, /Sem permissao para gerenciar usuarios neste tenant\./);
  assert.match(usersControllerSource, /createTenantUser\(req\.auth, req\.body as CreateTenantUserInput\)/);
  assert.match(usersControllerSource, /res\.status\(201\)\.json\(await createTenantUser/);
});
