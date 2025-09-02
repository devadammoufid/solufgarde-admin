// types/auth.ts - Authentication Types
export type AuthProvider = 'email' | 'google' | 'microsoft' | 'apple';
export type UserRole = 'admin' | 'client' | 'remplacant';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  provider: AuthProvider;
  providerId?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  phone?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  profile?: UserProfile;
  permissions?: string[];
  garderie?: {
    id: string;
    name: string;
  };
}

export interface UserProfile {
  id: string;
  bio?: string;
  education?: string;
  yearsOfExperience?: number;
  preferredAgeGroup?: string;
  availability?: string;
  region?: string;
  mobility?: boolean;
  hasDriverLicense?: boolean;
  hasVehicle?: boolean;
  languages?: string[];
  certifications?: string[];
  linkedIn?: string;
  resumeUrl?: string;
  profileCompleted: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: 'Bearer';
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
  issuedAt: Date;
  expiresAt: Date;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  garderieId?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
}

export interface EmailVerification {
  token: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
}

