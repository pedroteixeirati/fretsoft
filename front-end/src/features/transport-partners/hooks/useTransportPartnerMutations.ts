import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { transportPartnersApi } from '../services/transport-partners.api';
import { TransportPartner, TransportPartnerDraft } from '../types/transport-partner.types';

export function useTransportPartnerMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.transportPartners.all });
  };

  const createPartner = useMutation({
    mutationFn: (payload: TransportPartnerDraft) => transportPartnersApi.create(payload),
    onSuccess: invalidate,
  });

  const updatePartner = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TransportPartnerDraft> }) =>
      transportPartnersApi.update(id, payload),
    onSuccess: invalidate,
  });

  const deletePartner = useMutation({
    mutationFn: (id: string) => transportPartnersApi.remove(id),
    onSuccess: invalidate,
  });

  return {
    createPartner,
    updatePartner,
    deletePartner,
    isSubmitting: createPartner.isPending || updatePartner.isPending || deletePartner.isPending,
  };
}

export type { TransportPartner };
