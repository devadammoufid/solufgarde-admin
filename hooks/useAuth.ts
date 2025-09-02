// hooks/useAuth.ts - JWT-Based Authentication Hook
'use client';

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/auth';

// Re-export the useAuth hook from context with additional utilities
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Additional utility functions
  const hasRole = (requiredRole: UserRole): boolean => {
    return context.role === requiredRole;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return context.role ? roles.includes(context.role) : false;
  };

  const hasPermission = (permission: string): boolean => {
    // Implementation would check user permissions
    // For now, return true for authenticated users
    return context.isAuthenticated;
  };

  const canAccess = (resource: string, action: string): boolean => {
    // Role-based access control logic
    if (!context.isAuthenticated) return false;

    // Admin can access everything
    if (context.isAdmin) return true;

    // Define access rules based on resource and action
    const accessRules: Record<string, Record<string, UserRole[]>> = {
      users: {
        create: ['admin'],
        read: ['admin', 'client'],
        update: ['admin'],
        delete: ['admin'],
      },
      garderies: {
        create: ['admin'],
        read: ['admin'],
        update: ['admin'],
        delete: ['admin'],
      },
      staff: {
        create: ['admin', 'client'],
        read: ['admin', 'client'],
        update: ['admin', 'client'],
        delete: ['admin', 'client'],
      },
      applications: {
        create: ['remplacant'],
        read: ['admin', 'client', 'remplacant'],
        update: ['admin', 'client'],
        delete: ['admin'],
      },
      timesheets: {
        create: ['remplacant'],
        read: ['admin', 'client', 'remplacant'],
        update: ['admin', 'client'],
        delete: ['admin'],
      },
      invoices: {
        create: ['admin', 'client'],
        read: ['admin', 'client', 'remplacant'],
        update: ['admin', 'client'],
        delete: ['admin'],
      },
    };

    const resourceRules = accessRules[resource];
    if (!resourceRules) return false;

    const actionRules = resourceRules[action];
    if (!actionRules) return false;

    return context.role ? actionRules.includes(context.role) : false;
  };

  const getDisplayName = (): string => {
    if (!context.user) return 'Guest';
    return `${context.user.firstName} ${context.user.lastName}`;
  };

  const getInitials = (): string => {
    if (!context.user) return 'G';
    return `${context.user.firstName?.[0] || ''}${context.user.lastName?.[0] || ''}`.toUpperCase();
  };

  const isProfileComplete = (): boolean => {
    return context.user?.profile?.profileCompleted || false;
  };

  const requiresOnboarding = (): boolean => {
    return context.isAuthenticated && !context.user?.onboardingComplete;
  };

  const getPermissions = (): string[] => {
    // In a real app, this would come from the user's permissions
    // For now, return basic permissions based on role
    const rolePermissions: Record<UserRole, string[]> = {
      admin: ['*'], // Admin has all permissions
      client: ['manage_staff', 'view_reports', 'manage_schedules'],
      remplacant: ['apply_jobs', 'view_applications', 'submit_timesheets'],
    };

    return context.role ? rolePermissions[context.role] || [] : [];
  };

  const getRoleName = (): string => {
    const roleNames: Record<UserRole, string> = {
      admin: 'Administrator',
      client: 'Daycare Manager',
      remplacant: 'Substitute Staff',
    };
    return context.role ? roleNames[context.role] : 'User';
  };

  const isTokenValid = (): boolean => {
    return context.hasValidToken();
  };

  const getToken = (): string | null => {
    return context.getAuthToken();
  };

  return {
    // Original context methods and properties
    ...context,
    
    // Additional utility methods
    hasRole,
    hasAnyRole,
    hasPermission,
    canAccess,
    getDisplayName,
    getInitials,
    isProfileComplete,
    requiresOnboarding,
    getPermissions,
    getRoleName,
    isTokenValid,
    getToken,
  };
}

export default useAuth;