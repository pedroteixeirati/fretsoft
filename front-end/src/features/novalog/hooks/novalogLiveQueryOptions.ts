export const NOVALOG_LIVE_QUERY_REFETCH_INTERVAL_MS = 15_000;

export function getNovalogLiveQueryOptions(enabled: boolean) {
  return {
    refetchInterval: enabled ? NOVALOG_LIVE_QUERY_REFETCH_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  };
}
