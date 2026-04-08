import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { FirebaseProvider } from '../../context/FirebaseContext';
import { createAppQueryClient } from '../../shared/lib/query-client';

interface AppProvidersProps {
  children: React.ReactNode;
}

const queryClient = createAppQueryClient();

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseProvider>{children}</FirebaseProvider>
    </QueryClientProvider>
  );
}
