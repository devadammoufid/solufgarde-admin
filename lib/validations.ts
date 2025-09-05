// lib/validations.ts - Zod Validation Schemas
import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const phoneSchema = z.string()
  .regex(/^[+]?[(]?\d{3}[)]?[-.\s]?\d{3}[-.\s]?\d{4}$/, 'Please enter a valid phone number')
  .optional();

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(['admin', 'client', 'remplacant']),
  garderieId: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// User management schemas
export const createUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema,
  role: z.enum(['admin', 'client', 'remplacant']),
  garderieId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().min(1, 'User ID is required'),
});

export const updateProfileSchema = z.object({
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  education: z.string().max(200, 'Education must be less than 200 characters').optional(),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  preferredAgeGroup: z.string().optional(),
  availability: z.string().optional(),
  region: z.string().optional(),
  mobility: z.boolean().optional(),
  hasDriverLicense: z.boolean().optional(),
  hasVehicle: z.boolean().optional(),
  languages: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  linkedIn: z.string().url('Please enter a valid LinkedIn URL').optional().or(z.literal('')),
  resumeUrl: z.string().url('Please enter a valid resume URL').optional().or(z.literal('')),
});

// Garderie schemas
export const createGarderieSchema = z.object({
  name: z.string().min(2, 'Garderie name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters').optional(),
  email: emailSchema.optional(),
  region: z.string().min(2, 'Region is required'),
  isActive: z.boolean().default(true),
});

export const updateGarderieSchema = createGarderieSchema.partial().extend({
  id: z.string().min(1, 'Garderie ID is required'),
});

// Job offer schemas
export const createJobOfferSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  startDate: z
    .string()
    .refine(date => !isNaN(Date.parse(date)), 'Invalid start date')
    .refine(date => {
      const d = new Date(date + 'T00:00:00')
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return d.getTime() > today.getTime()
    }, 'Start date must be after today'),
  endDate: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid end date'),
  region: z.string().min(2, 'Region is required'),
  garderieId: z.string().min(1, 'Garderie ID is required'),
  requirements: z.array(z.string()).optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive').optional(),
}).refine(data => {
  const start = new Date(data.startDate + 'T00:00:00')
  const end = new Date(data.endDate + 'T00:00:00')
  // end must be at least one day after start (>= start + 1 day)
  const minEnd = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return end.getTime() >= minEnd.getTime()
}, {
  message: 'End date must be at least one day after start date',
  path: ['endDate'],
});

// Application schemas
export const createApplicationSchema = z.object({
  jobOfferId: z.string().min(1, 'Job offer ID is required'),
  garderieId: z.string().min(1, 'Garderie ID is required'),
  note: z.string().max(500, 'Note must be less than 500 characters').optional(),
});

export const updateApplicationSchema = z.object({
  id: z.string().min(1, 'Application ID is required'),
  status: z.enum(['pending', 'accepted', 'rejected', 'canceled']),
  note: z.string().max(500, 'Note must be less than 500 characters').optional(),
});

// Timesheet schemas
export const createTimesheetSchema = z.object({
  garderieId: z.string().min(1, 'Garderie ID is required'),
  date: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date'),
  checkInAt: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid check-in time'),
  checkOutAt: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid check-out time').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
}).refine(data => {
  if (data.checkOutAt) {
    return new Date(data.checkOutAt) > new Date(data.checkInAt);
  }
  return true;
}, {
  message: 'Check-out time must be after check-in time',
  path: ['checkOutAt'],
});

// Search and filter schemas
export const searchParamsSchema = z.object({
  q: z.string().optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => parseInt(val) || 10).optional(),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  role: z.enum(['admin', 'client', 'remplacant']).optional(),
  status: z.string().optional(),
  region: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// Settings schemas
export const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.enum(['en', 'fr', 'es']).default('en'),
  timezone: z.string().default('America/Toronto'),
  dateFormat: z.enum(['MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd']).default('MM/dd/yyyy'),
  timeFormat: z.enum(['12h', '24h']).default('12h'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
  }),
});

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 5000000, 'File size must be less than 5MB')
    .refine(file => ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type), 
      'File must be JPEG, PNG, WebP, or PDF'),
});

// Scheduling schemas
export const createShiftSchema = z.object({
  garderieId: z.string().min(1, 'Garderie requise'),
  date: z.string().refine((v) => !isNaN(Date.parse(v)), 'Date invalide'),
  startTime: z.string().min(1, 'Heure de début requise'), // HH:mm
  endTime: z.string().min(1, 'Heure de fin requise'),
  role: z.string().optional(),
  hourlyRate: z
    .string()
    .optional()
    .refine((v) => v === undefined || v === '' || (!isNaN(Number(v)) && Number(v) >= 0), 'Taux invalide'),
  notes: z.string().max(500).optional(),
}).refine((data) => {
  // Compare times on the same day
  const start = new Date(`${data.date}T${data.startTime}:00`)
  const end = new Date(`${data.date}T${data.endTime}:00`)
  return end.getTime() > start.getTime()
}, {
  message: 'Heure de fin doit être après l\'heure de début',
  path: ['endTime'],
});

export type CreateShiftForm = z.infer<typeof createShiftSchema>;

// Export all schema types
export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
export type CreateUserForm = z.infer<typeof createUserSchema>;
export type UpdateUserForm = z.infer<typeof updateUserSchema>;
export type UpdateProfileForm = z.infer<typeof updateProfileSchema>;
export type CreateGarderieForm = z.infer<typeof createGarderieSchema>;
export type UpdateGarderieForm = z.infer<typeof updateGarderieSchema>;
export type CreateJobOfferForm = z.infer<typeof createJobOfferSchema>;
export type CreateApplicationForm = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationForm = z.infer<typeof updateApplicationSchema>;
export type CreateTimesheetForm = z.infer<typeof createTimesheetSchema>;
export type SearchParams = z.infer<typeof searchParamsSchema>;
export type SettingsForm = z.infer<typeof settingsSchema>;
export type FileUploadForm = z.infer<typeof fileUploadSchema>;
