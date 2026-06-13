import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driversApi } from '../services/drivers.api';
import { Driver } from '../types/driver.types';

const KEY = ['drivers', 'list'] as const;
export type DriverPayload = Omit<Driver, 'id' | 'displayId' | 'createdAt' | 'updatedAt'>;

export function useDrivers(enabled: boolean) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['drivers'] });

  const listQuery = useQuery({ queryKey: KEY, queryFn: driversApi.list, enabled });
  const createDriver = useMutation({ mutationFn: (payload: DriverPayload) => driversApi.create(payload as Omit<Driver, 'id'>), onSuccess: invalidate });
  const updateDriver = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: DriverPayload }) => driversApi.update(id, payload), onSuccess: invalidate });
  const deleteDriver = useMutation({ mutationFn: (id: string) => driversApi.remove(id), onSuccess: invalidate });

  const drivers = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  return { drivers, isLoading: listQuery.isLoading, error: listQuery.error ?? null, createDriver, updateDriver, deleteDriver };
}
