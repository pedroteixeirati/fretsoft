import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pageSource = readFileSync(resolve(process.cwd(), 'front-end/src/features/novalog/pages/NovalogOperationsPage.tsx'), 'utf8');
const filtersSource = readFileSync(resolve(process.cwd(), 'front-end/src/features/novalog/components/NovalogFilters.tsx'), 'utf8');
const hookSource = readFileSync(resolve(process.cwd(), 'front-end/src/features/novalog/hooks/useNovalogQuery.ts'), 'utf8');
const standardModalSource = readFileSync(resolve(process.cwd(), 'front-end/src/features/novalog/components/NovalogStandardEntryModal.tsx'), 'utf8');

describe('NovalogOperationsPage contract', () => {
  it('carrega todos os lancamentos por padrao e usa competencia como filtro', () => {
    expect(pageSource).toMatch(/useNovalogQuery\(canAccessNovalogModule\)/);
    expect(pageSource).toMatch(/useState\('all'\)/);
    expect(pageSource).toMatch(/Todas as competencias/);
    expect(pageSource).toMatch(/referenceMonthFilter === 'all'/);
    expect(pageSource).not.toMatch(/Competencia atual/);
  });

  it('mantem ordenacao nativa pelos registros mais recentes', () => {
    expect(hookSource).toMatch(/right\.createdAt\.localeCompare\(left\.createdAt\)/);
    expect(hookSource).not.toMatch(/left\.displayId.*Number\.MAX_SAFE_INTEGER/);
  });

  it('expoe competencia na barra de filtros da tabela', () => {
    expect(filtersSource).toMatch(/referenceMonthFilter/);
    expect(filtersSource).toMatch(/CustomSelect/);
    expect(filtersSource).toMatch(/onReferenceMonthFilterChange/);
  });

  it('nao expoe filtros de mineradora e siderurgica na tabela', () => {
    expect(filtersSource).not.toMatch(/Filtrar por mineradora/);
    expect(filtersSource).not.toMatch(/Filtrar por siderurgica/);
    expect(pageSource).not.toMatch(/originFilter/);
    expect(pageSource).not.toMatch(/destinationFilter/);
  });

  it('mantem ordem dos filtros como id, ticket, posto, data lancamento e competencia', () => {
    expect(filtersSource).toMatch(
      /placeholder="ID"[\s\S]*placeholder="Ticket"[\s\S]*placeholder="Posto"[\s\S]*placeholder="Data"[\s\S]*CustomSelect/,
    );
    expect(pageSource).toMatch(/ticketFilter/);
    expect(pageSource).toMatch(/operationDateFilter/);
    expect(pageSource).toMatch(/entry\.ticketNumber/);
    expect(pageSource).toMatch(/entry\.operationDate === operationDateFilter/);
    expect(filtersSource).not.toMatch(/Mostrando <span/);
  });

  it('exibe autor do lancamento no modal de edicao quando retornado pela API', () => {
    expect(standardModalSource).toMatch(/createdByName/);
    expect(standardModalSource).toMatch(/Criado por:/);
    expect(standardModalSource).toMatch(/toLocaleUpperCase\('pt-BR'\)/);
    expect(standardModalSource).toMatch(/subtitle=\{headerSubtitle\}/);
    expect(standardModalSource).not.toMatch(/Identificador/);
  });
});
