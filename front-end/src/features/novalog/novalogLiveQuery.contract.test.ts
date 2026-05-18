import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sourcePaths = [
  'front-end/src/features/novalog/hooks/useNovalogQuery.ts',
  'front-end/src/features/novalog/hooks/useNovalogBillingsQuery.ts',
  'front-end/src/features/novalog/hooks/useNovalogReportsQuery.ts',
  'front-end/src/features/novalog/pages/NovalogOperationsPage.tsx',
  'front-end/src/features/novalog/pages/NovalogBillingsPage.tsx',
  'front-end/src/features/novalog/pages/NovalogReportsPage.tsx',
];

const sources = sourcePaths.map((path) => ({
  path,
  source: readFileSync(resolve(process.cwd(), path), 'utf8'),
}));

function countMatches(source: string, pattern: RegExp) {
  return source.match(pattern)?.length ?? 0;
}

describe('Novalog live query contract', () => {
  it('aplica a politica live compartilhada em toda query do contexto Novalog', () => {
    const totalUseQueries = sources.reduce((total, item) => total + countMatches(item.source, /useQuery\(\{/g), 0);
    const totalLiveOptions = sources.reduce((total, item) => total + countMatches(item.source, /getNovalogLiveQueryOptions\(/g), 0);

    expect(totalUseQueries).toBeGreaterThan(0);
    expect(totalLiveOptions).toBe(totalUseQueries);
  });

  it('mantem fornecedores e empresas do contexto Novalog com atualizacao automatica', () => {
    const operationsPage = sources.find((item) => item.path.endsWith('NovalogOperationsPage.tsx'))?.source ?? '';
    const billingsPage = sources.find((item) => item.path.endsWith('NovalogBillingsPage.tsx'))?.source ?? '';

    expect(operationsPage).toMatch(/providersQuery = useQuery\(\{[\s\S]*getNovalogLiveQueryOptions\(canReadProviders\)/);
    expect(operationsPage).toMatch(/companiesQuery = useQuery\(\{[\s\S]*getNovalogLiveQueryOptions\(canReadCompanies\)/);
    expect(billingsPage).toMatch(/companiesQuery = useQuery\(\{[\s\S]*getNovalogLiveQueryOptions\(canReadCompanies\)/);
  });

  it('mantem consultas condicionais sem polling quando nao estao habilitadas', () => {
    const reportsPage = sources.find((item) => item.path.endsWith('NovalogReportsPage.tsx'))?.source ?? '';

    expect(reportsPage).toMatch(/const canLoadReferenceMonthData = canAccessNovalogModule && Boolean\(referenceMonth\)/);
    expect(reportsPage).toMatch(/enabled: canLoadReferenceMonthData,[\s\S]*getNovalogLiveQueryOptions\(canLoadReferenceMonthData\)/);
  });
});
