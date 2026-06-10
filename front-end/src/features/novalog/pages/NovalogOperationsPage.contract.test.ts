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

  it('mantem ordem dos filtros como id, ticket, posto, data, usuario e competencia', () => {
    expect(filtersSource).toMatch(
      /placeholder="ID"[\s\S]*placeholder="Ticket"[\s\S]*placeholder="Posto"[\s\S]*NovalogDateRangeFilter[\s\S]*UserRound[\s\S]*CustomSelect/,
    );
    expect(pageSource).toMatch(/ticketFilter/);
    expect(pageSource).toMatch(/operationDateFromFilter/);
    expect(pageSource).toMatch(/operationDateToFilter/);
    expect(pageSource).toMatch(/userFilter/);
    expect(pageSource).toMatch(/entry\.ticketNumber/);
    expect(pageSource).toMatch(/const entryCreationDate = getEntryCreationDate\(entry\)/);
    expect(pageSource).toMatch(/entryCreationDate >= operationDateFromFilter/);
    expect(pageSource).toMatch(/entryCreationDate <= operationDateToFilter/);
    expect(pageSource).toMatch(/timeZone: 'America\/Sao_Paulo'/);
    expect(pageSource).toMatch(/entry\.createdByUserId === userFilter/);
    expect(filtersSource).not.toMatch(/Mostrando <span/);
  });

  it('carrega apenas usuarios operacionais da Novalog para o filtro de usuario', () => {
    expect(pageSource).toMatch(/usersApi\.list/);
    expect(pageSource).toMatch(/queryKeys\.users\.list/);
    expect(pageSource).toMatch(/user\.tenantSlug === 'novalog' && user\.role === 'operational'/);
    expect(filtersSource).toMatch(/placeholder="Usuario"/);
  });

  it('exibe autor do lancamento no modal de edicao quando retornado pela API', () => {
    expect(standardModalSource).toMatch(/createdByName/);
    expect(standardModalSource).toMatch(/Criado por:/);
    expect(standardModalSource).toMatch(/toLocaleUpperCase\('pt-BR'\)/);
    expect(standardModalSource).toMatch(/subtitle=\{headerSubtitle\}/);
    expect(standardModalSource).not.toMatch(/Identificador/);
  });
});
