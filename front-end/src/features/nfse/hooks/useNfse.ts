import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nfseApi } from '../services/nfse.api';
import { NfseCreatePayload } from '../types/nfse.types';

const NFSE_KEY = ['nfse', 'list'] as const;

export function useNfse(enabled: boolean) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['nfse'] });

  const listQuery = useQuery({ queryKey: NFSE_KEY, queryFn: nfseApi.list, enabled });

  const createNfse = useMutation({ mutationFn: (payload: NfseCreatePayload) => nfseApi.create(payload), onSuccess: invalidate });
  const emitNfse = useMutation({ mutationFn: (id: string) => nfseApi.emit(id), onSuccess: invalidate });
  const syncNfse = useMutation({ mutationFn: (id: string) => nfseApi.sync(id), onSuccess: invalidate });
  const removeNfse = useMutation({ mutationFn: (id: string) => nfseApi.remove(id), onSuccess: invalidate });

  const documents = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  return {
    documents,
    isLoading: listQuery.isLoading,
    error: listQuery.error ?? null,
    createNfse,
    emitNfse,
    syncNfse,
    removeNfse,
  };
}
