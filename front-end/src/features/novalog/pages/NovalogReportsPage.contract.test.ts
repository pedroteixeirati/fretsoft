import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pageSource = readFileSync(resolve(process.cwd(), 'front-end/src/features/novalog/pages/NovalogReportsPage.tsx'), 'utf8');
const routerSource = readFileSync(resolve(process.cwd(), 'front-end/src/app/router/AppRouter.tsx'), 'utf8');
const navigationSource = readFileSync(resolve(process.cwd(), 'front-end/src/features/navigation/config/nav.config.ts'), 'utf8');
const legacySidebarSource = readFileSync(resolve(process.cwd(), 'front-end/src/components/Sidebar.tsx'), 'utf8');

describe('NovalogReportsPage contract', () => {
  it('registra rota e item dedicado de navegacao para os relatorios Novalog', () => {
    expect(routerSource).toMatch(/import NovalogReports/);
    expect(routerSource).toMatch(/path="\/novalog\/relatorios" element=\{<NovalogReports \/>\}/);
    expect(navigationSource).toMatch(/navItem\('novalogReports', 'Relatorios Novalog', BarChart3\)/);
    expect(navigationSource).toMatch(/userProfile\?\.tenantSlug === 'novalog' \? null : navItem\('reports', 'Relatorios', BarChart3\)/);
    expect(legacySidebarSource).toMatch(/id: 'novalogReports', label: 'Relatorios Novalog'/);
    expect(legacySidebarSource).toMatch(/id: 'reports', label: 'Relatorios', icon: BarChart3, allowed: userProfile\?\.tenantSlug !== 'novalog'/);
  });

  it('preserva o layout-chave acordado para a nova tela', () => {
    expect(pageSource).toMatch(/Relatorios Novalog/);
    expect(pageSource).toMatch(/Saldo a receber por cliente/);
    expect(pageSource).toMatch(/Recebimentos/);
    expect(pageSource).toMatch(/Operacao/);
    expect(pageSource).toMatch(/Saldo total a receber/);
    expect(pageSource).toMatch(/Concentracao do saldo a receber/);
    expect(pageSource).toMatch(/Exportar/);
    expect(pageSource).toMatch(/disabled=\{activeTab !== 'balance'\}/);
    expect(pageSource).toMatch(/knownReferenceMonths/);
  });

  it('usa pagamentos efetivos do relatorio em vez de inferencia pelo status do recebivel', () => {
    expect(pageSource).toMatch(/useNovalogReportPaymentsQuery/);
    expect(pageSource).toMatch(/filteredPayments/);
    expect(pageSource).toMatch(/payment\.paymentDate/);
    expect(pageSource).toMatch(/payment\.amount/);
  });

  it('pagina as tabelas analiticas de saldo e recebimentos', () => {
    expect(pageSource).toMatch(/balanceCurrentPage/);
    expect(pageSource).toMatch(/receiptsCurrentPage/);
    expect(pageSource).toMatch(/paginatedClientBalanceRows/);
    expect(pageSource).toMatch(/paginatedPayments/);
    expect(pageSource).toMatch(/currentPage: safeBalanceCurrentPage/);
    expect(pageSource).toMatch(/currentPage: safeReceiptsCurrentPage/);
  });

  it('oferece exportacao da aba atual e do relatorio completo', () => {
    expect(pageSource).toMatch(/novalogReportsApi\.exportWorkbook/);
    expect(pageSource).toMatch(/getActiveTabLabel\(activeTab\)/);
    expect(pageSource).toMatch(/Relatorio completo/);
    expect(pageSource).toMatch(/type: 'tab' \| 'complete'/);
  });
});
