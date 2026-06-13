import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nfseConfigApi } from '../services/nfse-config.api';
import { NfseConfigPayload } from '../types/nfse-config.types';

const NFSE_CONFIG_KEY = ['nfseConfig'] as const;

export function useNfseConfig(enabled: boolean) {
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: NFSE_CONFIG_KEY,
    queryFn: nfseConfigApi.get,
    enabled,
  });

  const saveConfig = useMutation({
    mutationFn: (payload: NfseConfigPayload) => nfseConfigApi.save(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(NFSE_CONFIG_KEY, data);
    },
  });

  return {
    config: configQuery.data ?? null,
    isLoading: configQuery.isLoading,
    error: configQuery.error ?? null,
    saveConfig,
  };
}
