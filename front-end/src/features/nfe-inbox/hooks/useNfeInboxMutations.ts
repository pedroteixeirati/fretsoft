import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { nfeInboxApi } from '../services/nfe-inbox.api';
import { GeneratePayablePayload } from '../types/nfe-inbox.types';

export function useNfeInboxMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.nfeInbox.all });
  };

  const importXml = useMutation({
    mutationFn: (xml: string) => nfeInboxApi.import(xml),
    onSuccess: invalidate,
  });

  const generatePayable = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GeneratePayablePayload }) =>
      nfeInboxApi.generatePayable(id, payload),
    onSuccess: async () => {
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: queryKeys.payables.all });
    },
  });

  const ignoreReceipt = useMutation({
    mutationFn: (id: string) => nfeInboxApi.ignore(id),
    onSuccess: invalidate,
  });

  return { importXml, generatePayable, ignoreReceipt };
}
