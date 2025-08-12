import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys factory for consistent cache management
export const queryKeys = {
  // Master data queries
  branches: () => ['branches'] as const,
  salesAgents: () => ['sales-agents'] as const,
  targetCountries: () => ['target-countries'] as const,
  destinationCountries: () => ['destination-countries'] as const,
  platforms: () => ['platforms'] as const,
  mediaBuyers: () => ['media-buyers'] as const,
  
  // Analytics queries
  analytics: (reportType: string, filters: any) => 
    ['analytics', reportType, filters] as const,
  
  // User queries
  users: () => ['users'] as const,
};

// Prefetch function for critical data
export const prefetchMasterData = async () => {
  const promises = [
    queryClient.prefetchQuery({
      queryKey: queryKeys.branches(),
      queryFn: () => fetch('/api/master-data/branches').then(res => res.json()),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.salesAgents(),
      queryFn: () => fetch('/api/master-data/agents').then(res => res.json()),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.targetCountries(),
      queryFn: () => fetch('/api/master-data/target-countries').then(res => res.json()),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.destinationCountries(),
      queryFn: () => fetch('/api/master-data/destination-countries').then(res => res.json()),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.platforms(),
      queryFn: () => fetch('/api/master-data/platforms').then(res => res.json()),
    }),
  ];

  try {
    await Promise.all(promises);
    console.log('Master data prefetched successfully');
  } catch (error) {
    console.warn('Failed to prefetch some master data:', error);
  }
};