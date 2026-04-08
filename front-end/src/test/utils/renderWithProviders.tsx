import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { FirebaseProvider } from '../../context/FirebaseContext';
import { createAppQueryClient } from '../../shared/lib/query-client';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  routerProps?: MemoryRouterProps;
}

export function renderWithProviders(ui: React.ReactElement, options: ExtendedRenderOptions = {}) {
  const { routerProps, ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    const queryClient = createAppQueryClient();

    return (
      <MemoryRouter {...routerProps}>
        <QueryClientProvider client={queryClient}>
          <FirebaseProvider>{children}</FirebaseProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
