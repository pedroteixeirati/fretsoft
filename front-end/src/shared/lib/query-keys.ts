export const queryKeys = {
  expenses: {
    all: ['expenses'] as const,
    list: () => ['expenses', 'list'] as const,
  },
  payables: {
    all: ['payables'] as const,
    list: () => ['payables', 'list'] as const,
  },
  vehicles: {
    all: ['vehicles'] as const,
    list: () => ['vehicles', 'list'] as const,
  },
  providers: {
    all: ['providers'] as const,
    list: () => ['providers', 'list'] as const,
  },
  companies: {
    all: ['companies'] as const,
    list: () => ['companies', 'list'] as const,
  },
  cargas: {
    all: ['cargas'] as const,
    list: () => ['cargas', 'list'] as const,
    freight: (freightId: string) => ['cargas', 'freight', freightId] as const,
  },
  novalog: {
    all: ['novalog'] as const,
    list: (filters?: { referenceMonth?: string }) => ['novalog', 'list', filters ?? {}] as const,
    referenceMonths: () => ['novalog', 'referenceMonths'] as const,
  },
  novalogBillings: {
    all: ['novalogBillings'] as const,
    list: () => ['novalogBillings', 'list'] as const,
    detail: (id: string) => ['novalogBillings', 'detail', id] as const,
  },
  novalogReports: {
    all: ['novalogReports'] as const,
    payments: () => ['novalogReports', 'payments'] as const,
  },
} as const;
