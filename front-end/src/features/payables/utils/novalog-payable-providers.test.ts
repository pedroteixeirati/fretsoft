import { describe, expect, it } from 'vitest';
import type { Provider } from '../../providers/types/provider.types';
import { getNovalogPayableProviderOptions } from './novalog-payable-providers';

let providerSequence = 0;

function makeProvider(overrides: Partial<Provider>): Provider {
  providerSequence += 1;

  return {
    id: overrides.id ?? `provider-${providerSequence}`,
    name: overrides.name ?? 'Fornecedor',
    type: overrides.type ?? 'Outros',
    usageType: overrides.usageType ?? 'operational',
    status: overrides.status ?? 'Ativo',
    contact: overrides.contact ?? '',
    email: overrides.email ?? '',
    address: overrides.address ?? '',
  };
}

describe('getNovalogPayableProviderOptions', () => {
  it('lista apenas fornecedores ativos financeiros ou ambos para o contas a pagar da NovaLog', () => {
    const options = getNovalogPayableProviderOptions([
      makeProvider({ name: 'Operacional', usageType: 'operational' }),
      makeProvider({ name: 'Financeiro', usageType: 'financial' }),
      makeProvider({ name: 'Ambos', usageType: 'both' }),
      makeProvider({ name: 'Inativo', usageType: 'financial', status: 'Inativo' }),
    ]);

    expect(options).toEqual([
      { value: 'Ambos', label: 'Ambos' },
      { value: 'Financeiro', label: 'Financeiro' },
    ]);
  });

  it('preserva o fornecedor ja salvo quando ele nao esta mais nas opcoes ativas', () => {
    const options = getNovalogPayableProviderOptions(
      [makeProvider({ name: 'Financeiro', usageType: 'financial' })],
      'Fornecedor legado',
    );

    expect(options[0]).toEqual({ value: 'Fornecedor legado', label: 'Fornecedor legado' });
    expect(options).toContainEqual({ value: 'Financeiro', label: 'Financeiro' });
  });
});
