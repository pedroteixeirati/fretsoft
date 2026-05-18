import { describe, expect, it } from 'vitest';
import { getNovalogLiveQueryOptions, NOVALOG_LIVE_QUERY_REFETCH_INTERVAL_MS } from './novalogLiveQueryOptions';

describe('novalogLiveQueryOptions', () => {
  it('habilita polling e refetch em foco quando a query esta ativa', () => {
    expect(getNovalogLiveQueryOptions(true)).toEqual({
      refetchInterval: NOVALOG_LIVE_QUERY_REFETCH_INTERVAL_MS,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    });
  });

  it('desliga polling quando a query esta desabilitada', () => {
    expect(getNovalogLiveQueryOptions(false)).toEqual({
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    });
  });
});
