// hooks/useApi.ts - API Hooks
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'react-hot-toast';
import type { 
  UserEntity, 
  GarderieEntity, 
  RemplacantEntity, 
  UserQueryParams,
  GarderieQueryParams,
  CreateUserDto,
  UpdateUserDto,
  CreateGarderieDto,
  UpdateGarderieDto
} from '@/types/api';

// Health check hook
export function useHealthCheck() {
  return useQuery({
    queryKey: QUERY_KEYS.HEALTH,
    queryFn: () => apiClient.health(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
    retry: 3,
  });
}

// User management hooks
export function useUsers(params?: UserQueryParams) {
  return useQuery({
    queryKey: QUERY_KEYS.USERS.LIST(params),
    queryFn: () => apiClient.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUser(id: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.USERS.DETAIL(id),
    queryFn: () => apiClient.getUserById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: CreateUserDto) => apiClient.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success('User created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user');
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...userData }: UpdateUserDto & { id: string }) => 
      apiClient.updateUser(id, userData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.DETAIL(variables.id) });
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });
}

// Garderie management hooks
export function useGarderies(params?: GarderieQueryParams) {
  return useQuery({
    queryKey: QUERY_KEYS.GARDERIES.LIST(params),
    queryFn: () => apiClient.getGarderies(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGarderie(id: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.GARDERIES.DETAIL(id),
    queryFn: () => apiClient.getGarderieById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateGarderie() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (garderieData: CreateGarderieDto) => apiClient.createGarderie(garderieData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GARDERIES.ALL });
      toast.success('Garderie created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create garderie');
    },
  });
}

// Dashboard hooks
export function useAdminDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.ADMIN,
    queryFn: () => apiClient.getAdminDashboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

export function useClientDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.CLIENT,
    queryFn: () => apiClient.getClientDashboard(),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useRemplacantDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.REMPLACANT,
    queryFn: () => apiClient.getRemplacantDashboard(),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
