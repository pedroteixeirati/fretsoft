import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transportLinesApi } from '../services/transport-lines.api';
import { TransportLine } from '../types/transport-line.types';

const KEY = ['transportLines', 'list'] as const;
export type TransportLinePayload = Omit<TransportLine, 'id' | 'displayId' | 'companyName' | 'vehicleName' | 'vehiclePlate' | 'driverName' | 'createdAt' | 'updatedAt'>;

export function useTransportLines(enabled: boolean) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['transportLines'] });

  const listQuery = useQuery({ queryKey: KEY, queryFn: transportLinesApi.list, enabled });
  const createLine = useMutation({ mutationFn: (payload: TransportLinePayload) => transportLinesApi.create(payload as Omit<TransportLine, 'id'>), onSuccess: invalidate });
  const updateLine = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: TransportLinePayload }) => transportLinesApi.update(id, payload), onSuccess: invalidate });
  const deleteLine = useMutation({ mutationFn: (id: string) => transportLinesApi.remove(id), onSuccess: invalidate });

  const lines = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  return { lines, isLoading: listQuery.isLoading, error: listQuery.error ?? null, createLine, updateLine, deleteLine };
}
