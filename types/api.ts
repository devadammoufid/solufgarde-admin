// Base API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User Management Types
export type UserRole = 'admin' | 'client' | 'remplacant';

export interface UserEntity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: UserRole;
  isActive: boolean;
  isBanned: boolean;
  onboardingComplete: boolean;
  consentAccepted: boolean;
  provider: string;
  providerId: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  remplacant?: RemplacantEntity;
  profile?: UserProfileEntity;
  garderie?: GarderieEntity;
}

export interface UserProfileEntity {
  id: string;
  user: UserEntity;
  bio?: string;
  education?: string;
  yearsOfExperience?: number;
  preferredAgeGroup?: string;
  availability?: string;
  mobility?: boolean;
  hasDriverLicense?: boolean;
  hasVehicle?: boolean;
  languages?: string[];
  certifications?: string[];
  linkedIn?: string;
  resumeUrl?: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Garderie (Daycare) Management Types
export interface GarderieEntity {
  id: string;
  name: string;
  address?: string;
  email?: string;
  region?: string;
  isActive: boolean;
  users: UserEntity[];
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Remplacant (Staff/Substitute) Types
export interface RemplacantEntity {
  id: string;
  user: UserEntity;
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
  resumeUrl?: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Job Offers and Applications
export interface JobOfferEntity {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  region: string;
  garderie: GarderieEntity;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'canceled';

export interface JobApplicationEntity {
  id: string;
  remplacant: RemplacantEntity;
  garderie: GarderieEntity;
  jobOffer?: JobOfferEntity;
  status: ApplicationStatus;
  note?: string;
  appliedAt: string;
  decisionAt?: string;
  updatedAt: string;
}

// Timesheet and Invoice Types
export interface TimesheetEntity {
  id: string;
  garderie: GarderieEntity;
  remplacant: RemplacantEntity;
  date: string;
  checkInAt: string;
  checkOutAt?: string;
  totalHours: number;
  notes?: string;
  isVerified: boolean;
  verifiedBy?: UserEntity;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'pending' | 'sent' | 'paid' | 'overdue';

export interface InvoiceEntity {
  id: string;
  client: UserEntity;
  remplacant: RemplacantEntity;
  timesheet: TimesheetEntity;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subTotal: number;
  taxes: number;
  totalAmount: number;
  currency: string;
  notes?: any;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Availability Types
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface AvailabilityEntity {
  id: string;
  remplacant: RemplacantEntity;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isRecurring: boolean;
  availableDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication Types
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserEntity;
}

// Dashboard Types
export interface DashboardStats {
  totalUsers?: number;
  activeStaff?: number;
  totalGarderies?: number;
  pendingApplications?: number;
  todaySchedules?: number;
  unpaidInvoices?: number;
  totalRevenue?: number;
  thisMonthHours?: number;
}

// API Request Types
export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  garderieId?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
  isBanned?: boolean;
}

export interface CreateGarderieDto {
  name: string;
  address?: string;
  email?: string;
  region?: string;
  isActive?: boolean;
}

export interface UpdateGarderieDto {
  name?: string;
  address?: string;
  email?: string;
  region?: string;
  isActive?: boolean;
}

export interface CreateTimesheetDto {
  garderieId: string;
  date: string; // YYYY-MM-DD
  checkInAt: string; // ISO datetime
  checkOutAt?: string; // ISO datetime
  notes?: string;
}

export interface UpdateTimesheetDto {
  isVerified?: boolean;
}

export interface CreateInvoiceDto {
  timesheetId: string;
  dueDate?: string;
  notes?: string;
}

export interface MarkInvoicePaidDto {
  paymentDate: string;
}

// Query Parameters Types
export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  sortBy?: 'createdAt' | 'firstName' | 'lastName' | 'email';
  order?: 'ASC' | 'DESC';
}

export interface GarderieQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'name';
  order?: 'ASC' | 'DESC';
}

export interface RemplacantQueryParams {
  page?: number;
  limit?: number;
  language?: string;
  region?: string;
  availability?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  order?: 'ASC' | 'DESC';
}

export interface ApplicationQueryParams {
  page?: number;
  limit?: number;
  garderieId?: string;
  jobOfferId?: string;
  status?: ApplicationStatus;
}

export interface TimesheetQueryParams {
  userId?: string;
  garderieId?: string;
  verified?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceQueryParams {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
}