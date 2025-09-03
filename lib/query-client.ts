import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// Default options for all queries
const defaultOptions: DefaultOptions = {
  queries: {
    // Time before data is considered stale
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    // Time before cache is garbage collected
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    
    // Retry configuration
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch on window focus (good for real-time data)
    refetchOnWindowFocus: true,
    
    // Refetch on reconnect
    refetchOnReconnect: true,
    
    // Don't refetch on mount if data exists and is fresh
    refetchOnMount: true,
    
    // Background refetch interval (optional)
    refetchInterval: false, // Set to a number (ms) if you want periodic refetch
    
    // Network mode
    networkMode: 'online',
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,
    
    // Network mode for mutations
    networkMode: 'online',
    
    // Default error handler for mutations
    onError: (error: any) => {
      const message = error?.message || 'An unexpected error occurred';
      toast.error(message);
    },
  },
};

// Create and configure the query client
export const queryClient = new QueryClient({
  defaultOptions,
});

// Global error handler for queries
queryClient.setMutationDefaults(['default'], {
  mutationFn: async () => {
    throw new Error('Mutation function not implemented');
  },
});

// Custom hook to get the query client (useful for components)
export const getQueryClient = () => queryClient;

// Query key factories for consistent key management
export const queryKeys = {
  // Auth related queries
  auth: {
    me: ['auth', 'me'] as const,
    permissions: ['auth', 'permissions'] as const,
  },
  
  // Dashboard queries
  dashboard: {
    admin: ['dashboard', 'admin'] as const,
    client: ['dashboard', 'client'] as const,
    remplacant: ['dashboard', 'remplacant'] as const,
  },
  
  // User management queries
  users: {
    all: ['users'] as const,
    list: (filters?: Record<string, any>) => ['users', 'list', filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  
  // Garderies queries
  garderies: {
    all: ['garderies'] as const,
    list: (filters?: Record<string, any>) => ['garderies', 'list', filters] as const,
    detail: (id: string) => ['garderies', 'detail', id] as const,
  },
  
  // Staff/Remplacants queries
  remplacants: {
    all: ['remplacants'] as const,
    list: (filters?: Record<string, any>) => ['remplacants', 'list', filters] as const,
    detail: (id: string) => ['remplacants', 'detail', id] as const,
  },
  
  // Job offers and applications
  jobOffers: {
    all: ['jobOffers'] as const,
    list: (filters?: Record<string, any>) => ['jobOffers', 'list', filters] as const,
    detail: (id: string) => ['jobOffers', 'detail', id] as const,
  },
  
  applications: {
    all: ['applications'] as const,
    list: (filters?: Record<string, any>) => ['applications', 'list', filters] as const,
    detail: (id: string) => ['applications', 'detail', id] as const,
  },
  
  // Timesheets and schedules
  timesheets: {
    all: ['timesheets'] as const,
    list: (filters?: Record<string, any>) => ['timesheets', 'list', filters] as const,
    detail: (id: string) => ['timesheets', 'detail', id] as const,
  },
  schedules: {
    all: ['schedules'] as const,
    list: (filters?: Record<string, any>) => ['schedules', 'list', filters] as const,
    detail: (id: string) => ['schedules', 'detail', id] as const,
  },
  
  // Invoices and payments
  invoices: {
    all: ['invoices'] as const,
    list: (filters?: Record<string, any>) => ['invoices', 'list', filters] as const,
    detail: (id: string) => ['invoices', 'detail', id] as const,
  },
  
  // Availability
  availability: {
    all: ['availability'] as const,
    list: (filters?: Record<string, any>) => ['availability', 'list', filters] as const,
    detail: (id: string) => ['availability', 'detail', id] as const,
  },
  
  // Conversations and messages
  conversations: {
    all: ['conversations'] as const,
    list: () => ['conversations', 'list'] as const,
    messages: (conversationId: string) => ['conversations', conversationId, 'messages'] as const,
  },
  
  // Health check
  health: ['health'] as const,
} as const;

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all queries for a specific entity type
  invalidateEntity: async (entityType: keyof typeof queryKeys) => {
    await queryClient.invalidateQueries({ queryKey: [entityType] });
  },
  
  // Clear all cache data
  clearAll: () => {
    queryClient.clear();
  },
  
  // Remove specific query from cache
  removeQuery: (queryKey: any[]) => {
    queryClient.removeQueries({ queryKey });
  },
  
  // Prefetch data for better UX
  prefetchQuery: async (queryKey: any[], queryFn: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
    });
  },
  
  // Set query data manually (useful for optimistic updates)
  setQueryData: <T>(queryKey: any[], data: T) => {
    queryClient.setQueryData(queryKey, data);
  },
  
  // Get cached query data
  getQueryData: <T>(queryKey: any[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey);
  },
  
  // Optimistic update helper
  optimisticUpdate: <T>(
    queryKey: any[],
    updater: (oldData: T | undefined) => T,
    rollbackFn?: () => void
  ) => {
    const previousData = queryClient.getQueryData<T>(queryKey);
    
    queryClient.setQueryData(queryKey, updater);
    
    return {
      previousData,
      rollback: () => {
        queryClient.setQueryData(queryKey, previousData);
        rollbackFn?.();
      },
    };
  },
};

// Performance monitoring and debugging helpers (development only)
if (process.env.NODE_ENV === 'development') {
  // Log query cache changes
  queryClient.getQueryCache().subscribe((event) => {
    try {
      const key = event?.query?.queryKey ?? [];
      console.log('[React Query]', event.type, key);
    } catch (e) {
      // no-op
    }
  });
  
  // Log mutation events
  queryClient.getMutationCache().subscribe((event) => {
    try {
      const key = event?.mutation?.options?.mutationKey ?? [];
      console.log('[React Query Mutation]', event.type, key);
    } catch (e) {
      // no-op
    }
  });
}

export default queryClient;
