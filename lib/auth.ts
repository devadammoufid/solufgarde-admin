
// lib/auth.ts - Auth Utilities
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';
import type { UserRole } from '@/types/auth';

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const getCurrentUserToken = async (): Promise<string | null> => {
  const user = getCurrentUser();
  if (!user) return null;
  
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting user token:', error);
    return null;
  }
};

export const getCurrentUserClaims = async () => {
  const user = getCurrentUser();
  if (!user) return null;
  
  try {
    const tokenResult = await user.getIdTokenResult();
    return tokenResult.claims;
  } catch (error) {
    console.error('Error getting user claims:', error);
    return null;
  }
};

export const hasRole = (userRole: UserRole | null, requiredRole: UserRole): boolean => {
  return userRole === requiredRole;
};

export const hasAnyRole = (userRole: UserRole | null, roles: UserRole[]): boolean => {
  return userRole ? roles.includes(userRole) : false;
};

export const isAdmin = (userRole: UserRole | null): boolean => {
  return userRole === 'admin';
};

export const isClient = (userRole: UserRole | null): boolean => {
  return userRole === 'client';
};

export const isRemplacant = (userRole: UserRole | null): boolean => {
  return userRole === 'remplacant';
};

export const getUserDisplayName = (user: {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
}): string => {
  if (user.displayName) return user.displayName;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  return user.email || 'User';
};

export const getUserInitials = (user: {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
}): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.displayName) {
    const names = user.displayName.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  }
  if (user.email) {
    return user.email[0].toUpperCase();
  }
  return 'U';
};