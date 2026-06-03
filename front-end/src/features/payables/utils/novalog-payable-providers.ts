import type { Provider } from '../../providers/types/provider.types';

export function getNovalogPayableProviderOptions(providers: Provider[], currentProviderName = '') {
  const financialProviders = providers
    .filter((provider) => {
      const usageType = provider.usageType || 'operational';
      const isActive = provider.status.trim().toLowerCase() === 'ativo';
      return isActive && (usageType === 'financial' || usageType === 'both');
    })
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
    .map((provider) => ({ value: provider.name, label: provider.name }));

  const normalizedCurrentProviderName = currentProviderName.trim();
  if (
    !normalizedCurrentProviderName ||
    financialProviders.some((option) => option.value === normalizedCurrentProviderName)
  ) {
    return financialProviders;
  }

  return [{ value: normalizedCurrentProviderName, label: normalizedCurrentProviderName }, ...financialProviders];
}
