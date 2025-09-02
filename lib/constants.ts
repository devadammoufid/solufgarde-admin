// lib/constants.ts - Application Constants
export const APP_NAME = 'Solugarde Admin';
export const APP_DESCRIPTION = 'Daycare Staff Management Platform';
export const APP_VERSION = '1.0.0';

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://solugarde-dev-production.up.railway.app/api/v1';
export const API_TIMEOUT = 30000; // 30 seconds

// Firebase Configuration Keys
export const FIREBASE_CONFIG_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client', 
  REMPLACANT: 'remplacant',
} as const;

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.CLIENT]: 'Daycare Manager',
  [USER_ROLES.REMPLACANT]: 'Substitute Staff',
} as const;

export const ROLE_DESCRIPTIONS = {
  [USER_ROLES.ADMIN]: 'Full system access and management',
  [USER_ROLES.CLIENT]: 'Manage daycare operations and staff',
  [USER_ROLES.REMPLACANT]: 'Apply for substitute positions',
} as const;

// Application Status
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELED: 'canceled',
} as const;

export const STATUS_LABELS = {
  [APPLICATION_STATUS.PENDING]: 'Pending Review',
  [APPLICATION_STATUS.ACCEPTED]: 'Accepted',
  [APPLICATION_STATUS.REJECTED]: 'Rejected',
  [APPLICATION_STATUS.CANCELED]: 'Canceled',
} as const;

// Invoice Status
export const INVOICE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
} as const;

// Days of the week
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

// Languages
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
] as const;

// Canadian Provinces (for regions)
export const CANADIAN_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
] as const;

// File upload limits
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  FULL: 'EEEE, MMMM dd, yyyy',
  TIME: 'HH:mm',
  DATETIME: 'MMM dd, yyyy HH:mm',
} as const;

// Theme configuration
export const THEME = {
  DEFAULT: 'system',
  OPTIONS: ['light', 'dark', 'system'],
} as const;

// Query keys for React Query
export const QUERY_KEYS = {
  HEALTH: ['health'],
  AUTH: {
    ME: ['auth', 'me'],
    PERMISSIONS: ['auth', 'permissions'],
  },
  USERS: {
    ALL: ['users'],
    LIST: (filters?: Record<string, any>) => ['users', 'list', filters],
    DETAIL: (id: string) => ['users', 'detail', id],
  },
  GARDERIES: {
    ALL: ['garderies'],
    LIST: (filters?: Record<string, any>) => ['garderies', 'list', filters],
    DETAIL: (id: string) => ['garderies', 'detail', id],
  },
  APPLICATIONS: {
    ALL: ['applications'],
    LIST: (filters?: Record<string, any>) => ['applications', 'list', filters],
    DETAIL: (id: string) => ['applications', 'detail', id],
  },
  TIMESHEETS: {
    ALL: ['timesheets'],
    LIST: (filters?: Record<string, any>) => ['timesheets', 'list', filters],
    DETAIL: (id: string) => ['timesheets', 'detail', id],
  },
  INVOICES: {
    ALL: ['invoices'],
    LIST: (filters?: Record<string, any>) => ['invoices', 'list', filters],
    DETAIL: (id: string) => ['invoices', 'detail', id],
  },
  DASHBOARD: {
    ADMIN: ['dashboard', 'admin'],
    CLIENT: ['dashboard', 'client'],
    REMPLACANT: ['dashboard', 'remplacant'],
  },
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'solugarde_auth_token',
  REFRESH_TOKEN: 'solugarde_refresh_token',
  USER_PREFERENCES: 'solugarde_user_preferences',
  SIDEBAR_COLLAPSED: 'solugarde_sidebar_collapsed',
  THEME: 'solugarde_theme',
  LANGUAGE: 'solugarde_language',
  REMEMBER_EMAIL: 'solugarde_remember_email',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Welcome back!',
  LOGOUT: 'Logged out successfully',
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  SAVED: 'Changes saved successfully',
  EMAIL_SENT: 'Email sent successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
} as const;

// Feature flags (for development/production toggles)
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
  ENABLE_SENTRY: process.env.NODE_ENV === 'production',
  ENABLE_DEV_TOOLS: process.env.NODE_ENV === 'development',
  ENABLE_HEALTH_MONITORING: true,
  ENABLE_REAL_TIME_UPDATES: false, // WebSocket features
} as const;

// Environment configuration
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;
