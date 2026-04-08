import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { FirebaseProvider } from '../../context/FirebaseContext';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  routerProps?: MemoryRouterProps;
}

export function renderWithProviders(ui: React.ReactElement, options: ExtendedRenderOptions = {}) {
  const { routerProps, ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

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
