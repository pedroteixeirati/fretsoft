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
} as const;
