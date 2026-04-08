import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readModule(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

const reportsSource = readModule('front-end/src/pages/Reports.tsx');
const reportsLayoutSource = readModule('front-end/src/pages/reports/ReportsLayout.tsx');
const reportsDataSource = readModule('front-end/src/pages/reports/useReportsData.ts');
const reportsFinancialSource = readModule('front-end/src/pages/reports/ReportsFinancial.tsx');
const reportsOperationalSource = readModule('front-end/src/pages/reports/ReportsOperational.tsx');
const reportsManagerialSource = readModule('front-end/src/pages/reports/ReportsManagerial.tsx');
const reportsSharedComponentsSource = readModule('front-end/src/pages/reports/ReportsSharedComponents.tsx');

test('relatorios orquestra visoes por dominio a partir do shell compartilhado', () => {
  assert.match(reportsSource, /import ReportsLayout from '\.\/reports\/ReportsLayout'/);
  assert.match(reportsSource, /import ReportsFinancial from '\.\/reports\/ReportsFinancial'/);
  assert.match(reportsSource, /import ReportsOperational from '\.\/reports\/ReportsOperational'/);
  assert.match(reportsSource, /import ReportsManagerial from '\.\/reports\/ReportsManagerial'/);
  assert.match(reportsSource, /switch \(data\.activeTab\)/);
  assert.match(reportsSource, /case 'financial'/);
  assert.match(reportsSource, /case 'operational'/);
  assert.match(reportsSource, /case 'managerial'/);
  assert.match(reportsSource, /onResetFilters=\{data\.resetFilters\}/);
  assert.match(reportsSource, /onRefresh=\{\(\) => void data\.loadReports\('refresh'\)\}/);
});

test('layout dos relatorios concentra shell analitico filtros e navegacao interna', () => {
  assert.match(reportsLayoutSource, /Relatorios Avancados/);
  assert.match(reportsLayoutSource, /Leitura operacional, financeira e gerencial com foco nas decisoes da transportadora\./);
  assert.match(reportsLayoutSource, /REPORT_TABS\.map/);
  assert.match(reportsLayoutSource, /activeTabMeta\?\.label/);
  assert.match(reportsLayoutSource, /onResetFilters/);
  assert.match(reportsLayoutSource, /Limpar filtros/);
  assert.match(reportsLayoutSource, /Visao atual/);
  assert.match(reportsLayoutSource, /Todos os veiculos/);
  assert.match(reportsLayoutSource, /Todas as empresas/);
});

test('hook compartilhado de relatorios centraliza filtros estados e agregacoes', () => {
  assert.match(reportsDataSource, /const \[activeTab, setActiveTab\] = useState<ReportTab>\('financial'\)/);
  assert.match(reportsDataSource, /const \[startDate, setStartDate\]/);
  assert.match(reportsDataSource, /const \[vehicleFilter, setVehicleFilter\] = useState\('all'\)/);
  assert.match(reportsDataSource, /const \[companyFilter, setCompanyFilter\] = useState\('all'\)/);
  assert.match(reportsDataSource, /Promise\.allSettled/);
  assert.match(reportsDataSource, /setLoadError\('Alguns dados do relatorio nao puderam ser atualizados\./);
  assert.match(reportsDataSource, /const routeRanking = useMemo/);
  assert.match(reportsDataSource, /const vehiclePerformance = useMemo/);
  assert.match(reportsDataSource, /const companyPerformance = useMemo/);
  assert.match(reportsDataSource, /const resetFilters = \(\) =>/);
  assert.match(reportsDataSource, /filteredExpenses, filteredFreights, filteredContracts, totalOperationalCosts/);
  assert.match(reportsDataSource, /setVehicleFilter\('all'\)/);
  assert.match(reportsDataSource, /setCompanyFilter\('all'\)/);
});

test('visao financeira fica isolada com leitura de caixa e rentabilidade', () => {
  assert.match(reportsFinancialSource, /Nenhuma movimentacao financeira encontrada/);
  assert.match(reportsFinancialSource, /Fretes faturados/);
  assert.match(reportsFinancialSource, /Contratos faturados/);
  assert.match(reportsFinancialSource, /Contas pagas no periodo/);
  assert.match(reportsFinancialSource, /Saldo realizado/);
  assert.match(reportsFinancialSource, /Composicao financeira/);
  assert.match(reportsFinancialSource, /Indicadores de saida/);
  assert.match(reportsFinancialSource, /Rentabilidade por veiculo/);
});

test('visao operacional fica restrita ao uso da frota e rotas recorrentes', () => {
  assert.match(reportsOperationalSource, /Nenhuma viagem encontrada no periodo/);
  assert.match(reportsOperationalSource, /Viagens no periodo/);
  assert.match(reportsOperationalSource, /Frota ativa/);
  assert.match(reportsOperationalSource, /Alertas de manutencao/);
  assert.match(reportsOperationalSource, /Rotas diferentes/);
  assert.match(reportsOperationalSource, /Rotas mais frequentes/);
  assert.match(reportsOperationalSource, /Utilizacao da frota/);
  assert.doesNotMatch(reportsOperationalSource, /Rotas com maior faturamento/);
});

test('visao gerencial consolida empresas contratos carteira e resumo executivo', () => {
  assert.match(reportsManagerialSource, /Ainda nao ha dados gerenciais suficientes/);
  assert.match(reportsManagerialSource, /Empresas ativas/);
  assert.match(reportsManagerialSource, /Contratos ativos/);
  assert.match(reportsManagerialSource, /Carteira recorrente mensal/);
  assert.match(reportsManagerialSource, /Contas vencidas/);
  assert.match(reportsManagerialSource, /Empresas com maior receita contratada/);
  assert.match(reportsManagerialSource, /Resumo executivo/);
});

test('componentes compartilhados oferecem blocos reutilizaveis e estado vazio padrao', () => {
  assert.match(reportsSharedComponentsSource, /export function Panel/);
  assert.match(reportsSharedComponentsSource, /export function MetricBox/);
  assert.match(reportsSharedComponentsSource, /export function ProgressRow/);
  assert.match(reportsSharedComponentsSource, /export function ExecutiveRow/);
  assert.match(reportsSharedComponentsSource, /export function EmptyText/);
  assert.match(reportsSharedComponentsSource, /export function ReportsEmptyState/);
});
