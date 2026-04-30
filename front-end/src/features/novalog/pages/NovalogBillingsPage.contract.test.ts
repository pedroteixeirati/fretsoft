import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pageSource = readFileSync(resolve(process.cwd(), 'front-end/src/features/novalog/pages/NovalogBillingsPage.tsx'), 'utf8');
const routerSource = readFileSync(resolve(process.cwd(), 'front-end/src/app/router/AppRouter.tsx'), 'utf8');
const navigationSource = readFileSync(resolve(process.cwd(), 'front-end/src/app/router/navigation.ts'), 'utf8');
const sidebarSource = readFileSync(resolve(process.cwd(), 'front-end/src/components/Sidebar.tsx'), 'utf8');

describe('NovalogBillingsPage contract', () => {
  it('registra rota e item de navegacao exclusivo para faturamentos Novalog', () => {
    expect(routerSource).toMatch(/import NovalogBillings/);
    expect(routerSource).toMatch(/path="\/novalog\/faturamentos" element=\{<NovalogBillings \/>\}/);
    expect(navigationSource).toMatch(/novalogBillings: '\/novalog\/faturamentos'/);
    expect(sidebarSource).toMatch(/id: 'novalogBillings', label: 'Faturamentos'/);
    expect(sidebarSource).toMatch(/allowed: canAccessNovalogOperations\(userProfile\)/);
  });

  it('mantem tela com KPIs, filtros e tabela de rastreabilidade por CT-e', () => {
    expect(pageSource).toMatch(/Total faturado/);
    expect(pageSource).toMatch(/Recebido/);
    expect(pageSource).toMatch(/Em aberto/);
    expect(pageSource).toMatch(/Em atraso/);
    expect(pageSource).toMatch(/CT-es/);
    expect(pageSource).toMatch(/Buscar faturamento/);
    expect(pageSource).toMatch(/statusOptions/);
    expect(pageSource).toMatch(/Ver detalhes/);
  });

  it('orquestra criacao, fechamento e baixa individual usando hooks da feature', () => {
    expect(pageSource).toMatch(/useNovalogBillingsQuery/);
    expect(pageSource).toMatch(/useNovalogBillingsMutations/);
    expect(pageSource).toMatch(/createBilling\.mutateAsync\(payload\)/);
    expect(pageSource).toMatch(/updateBilling\.mutateAsync\(\{ id: editingBilling\.id, payload \}\)/);
    expect(pageSource).toMatch(/closeBilling\.mutateAsync\(billing\.id\)/);
    expect(pageSource).toMatch(/markItemReceived\.mutateAsync\(itemId\)/);
    expect(pageSource).toMatch(/markItemOverdue\.mutateAsync\(itemId\)/);
    expect(pageSource).toMatch(/deleteItem\.mutateAsync\(deletingItem\.id\)/);
  });
});
