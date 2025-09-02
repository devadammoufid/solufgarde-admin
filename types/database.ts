// types/database.ts - Database Types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface AuditableEntity extends BaseEntity {
  createdBy?: string;
  updatedBy?: string;
}

export interface SoftDeletableEntity extends BaseEntity {
  isDeleted: boolean;
  deletedBy?: string;
}

export interface TimestampEntity {
  createdAt: string;
  updatedAt: string;
}

// Database table interfaces
export interface UsersTable extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: 'admin' | 'client' | 'remplacant';
  isActive: boolean;
  isBanned: boolean;
  onboardingComplete: boolean;
  consentAccepted: boolean;
  provider: string;
  providerId: string;
  passwordHash?: string;
  lastLoginAt?: string;
  garderieId?: string;
}

export interface GarderiesTable extends BaseEntity {
  name: string;
  address?: string;
  email?: string;
  region?: string;
  isActive: boolean;
  ownerId: string;
}

export interface RemplacantsTable extends BaseEntity {
  userId: string;
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
}

export interface JobOffersTable extends BaseEntity {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  region: string;
  garderieId: string;
  createdBy: string;
  isActive: boolean;
}

export interface ApplicationsTable extends BaseEntity {
  remplacantId: string;
  garderieId: string;
  jobOfferId?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'canceled';
  note?: string;
  appliedAt: string;
  decisionAt?: string;
  decisionBy?: string;
}
