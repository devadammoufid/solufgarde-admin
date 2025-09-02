// types/global.ts - Global Type Definitions

// Generic utility types
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Common status types
export type Status = 'active' | 'inactive' | 'pending' | 'archived';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Common API response wrapper
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success: boolean;
  timestamp?: string;
}

// Pagination types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Filter and sort types
export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  label: string;
}

// Navigation types
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
  roles?: string[];
  disabled?: boolean;
}

export interface Breadcrumb {
  label: string;
  href?: string;
}

// Form types
export interface FormFieldError {
  message: string;
  type: string;
}

export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  errors: Record<string, FormFieldError>;
}

// Table types
export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableAction<T = any> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive' | 'outline';
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
}

// Modal and dialog types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
}

// Toast notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// File upload types
export interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  [key: string]: any;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  filters: SearchFilters;
  suggestions?: string[];
}

// Dashboard types
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'stat' | 'chart' | 'table' | 'custom';
  size: 'sm' | 'md' | 'lg' | 'xl';
  data?: any;
  loading?: boolean;
  error?: string;
  refreshable?: boolean;
  configurable?: boolean;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  columns: number;
  roles?: string[];
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

// Permission types
export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  description?: string;
}

// Audit trail types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { from: any; to: any }>;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Time zone and date types
export type TimeZone = string;
export type DateFormat = 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd';
export type TimeFormat = '12h' | '24h';

// Language and localization types
export type Locale = 'en' | 'fr' | 'es';
export type TranslationKey = string;

// Application settings types
export interface AppSettings {
  theme: Theme;
  language: Locale;
  timezone: TimeZone;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// Generic component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

// API endpoint types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  requiresAuth?: boolean;
  roles?: string[];
  rateLimit?: number;
}

// Export commonly used React types for convenience
export type {
  ComponentProps,
  ComponentType,
  ReactElement,
  ReactNode,
  FC,
  PropsWithChildren,
} from 'react';