import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { 
  ApiResponse, 
  PaginatedResponse, 
  UserEntity, 
  GarderieEntity, 
  RemplacantEntity,
  JobOfferEntity,
  JobApplicationEntity,
  TimesheetEntity,
  InvoiceEntity,
  AvailabilityEntity,
  AuthResponseDto,
  LoginDto,
  RegisterDto,
  DashboardStats,
  CreateUserDto,
  UpdateUserDto,
  CreateGarderieDto,
  UpdateGarderieDto,
  UserQueryParams,
  GarderieQueryParams,
  RemplacantQueryParams,
  ApplicationQueryParams,
  TimesheetQueryParams,
  InvoiceQueryParams
} from '@/types/api';
import type { CreateJobOfferDto, UpdateJobOfferDto } from '@/types/api';

export class SolugardeApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://solugarde-dev-production.up.railway.app/api/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add JWT token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Try to refresh token
          const refreshed = await this.tryRefreshToken();
          if (refreshed) {
            // Retry original request with new token
            const token = this.getStoredToken();
            if (token) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }
          } else {
            // Refresh failed, redirect to login
            this.handleUnauthorized();
          }
        }
        
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('solugarde_access_token');
  }

  private getStoredRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('solugarde_refresh_token');
  }

  private setStoredTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('solugarde_access_token', accessToken);
    localStorage.setItem('solugarde_refresh_token', refreshToken);
  }

  private clearStoredTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('solugarde_access_token');
    localStorage.removeItem('solugarde_refresh_token');
    localStorage.removeItem('solugarde_user');
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await axios.post(`${this.baseURL}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${refreshToken}` }
      });
      
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      this.setStoredTokens(accessToken, newRefreshToken);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearStoredTokens();
      return false;
    }
  }

  private handleUnauthorized(): void {
    this.clearStoredTokens();
    // Only redirect if we're in the browser
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  private handleApiError(error: AxiosError): Error {
    if (error.response?.data) {
      const errorData = error.response.data as any;
      const message = errorData.message || errorData.error || 'An API error occurred';
      return new Error(message);
    }
    
    if (error.request) {
      return new Error('Network error: Unable to reach the server');
    }
    
    return new Error(error.message || 'An unexpected error occurred');
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  // Health check endpoint (no auth required)
  async health(): Promise<string> {
    return this.request<string>({
      method: 'GET',
      url: '/',
    });
  }

  // Authentication endpoints
  async login(credentials: LoginDto): Promise<AuthResponseDto> {
    return this.request<AuthResponseDto>({
      method: 'POST',
      url: '/auth/login',
      data: credentials,
    });
  }

  async register(userData: RegisterDto): Promise<UserEntity> {
    return this.request<UserEntity>({
      method: 'POST',
      url: '/auth/register',
      data: userData,
    });
  }

  async getMe(): Promise<UserEntity> {
    return this.request<UserEntity>({
      method: 'GET',
      url: '/auth/me',
    });
  }

  async logout(): Promise<void> {
    return this.request<void>({
      method: 'POST',
      url: '/auth/logout',
    });
  }

  async refreshToken(): Promise<AuthResponseDto> {
    // Use the refresh token directly; do NOT use the interceptor (access token may be expired)
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await axios.post(
      `${this.baseURL}/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } }
    );
    const { accessToken, refreshToken: newRefreshToken, user } = response.data as AuthResponseDto;
    this.setStoredTokens(accessToken, newRefreshToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('solugarde_user', JSON.stringify(user));
    }
    return response.data as AuthResponseDto;
  }

  // Dashboard endpoints
  async getAdminDashboard(): Promise<DashboardStats> {
    return this.request<DashboardStats>({
      method: 'GET',
      url: '/dashboard/admin',
    });
  }

  async getClientDashboard(): Promise<DashboardStats> {
    return this.request<DashboardStats>({
      method: 'GET',
      url: '/dashboard/client',
    });
  }

  async getRemplacantDashboard(): Promise<DashboardStats> {
    return this.request<DashboardStats>({
      method: 'GET',
      url: '/dashboard/remplacant',
    });
  }

  // User management endpoints
  async getUsers(params?: UserQueryParams): Promise<PaginatedResponse<UserEntity>> {
    return this.request<PaginatedResponse<UserEntity>>({
      method: 'GET',
      url: '/users',
      params,
    });
  }

  async getUserById(id: string): Promise<UserEntity> {
    return this.request<UserEntity>({
      method: 'GET',
      url: `/users/${id}`,
    });
  }

  async createUser(userData: CreateUserDto): Promise<UserEntity> {
    return this.request<UserEntity>({
      method: 'POST',
      url: '/users',
      data: userData,
    });
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<UserEntity> {
    return this.request<UserEntity>({
      method: 'PATCH',
      url: `/users/${id}`,
      data: userData,
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/users/${id}`,
    });
  }

  // Garderie (Daycare) management endpoints
  async getGarderies(params?: GarderieQueryParams): Promise<PaginatedResponse<GarderieEntity>> {
    return this.request<PaginatedResponse<GarderieEntity>>({
      method: 'GET',
      url: '/garderies',
      params,
    });
  }

  async getGarderieById(id: string): Promise<GarderieEntity> {
    return this.request<GarderieEntity>({
      method: 'GET',
      url: `/garderies/${id}`,
    });
  }

  async createGarderie(garderieData: CreateGarderieDto): Promise<GarderieEntity> {
    return this.request<GarderieEntity>({
      method: 'POST',
      url: '/garderies',
      data: garderieData,
    });
  }

  async updateGarderie(id: string, garderieData: UpdateGarderieDto): Promise<GarderieEntity> {
    return this.request<GarderieEntity>({
      method: 'PATCH',
      url: `/garderies/${id}`,
      data: garderieData,
    });
  }

  async deleteGarderie(id: string): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/garderies/${id}`,
    });
  }

  // Remplacant (Staff) management endpoints
  async getRemplacants(params?: RemplacantQueryParams): Promise<PaginatedResponse<RemplacantEntity>> {
    return this.request<PaginatedResponse<RemplacantEntity>>({
      method: 'GET',
      url: '/remplacants',
      params,
    });
  }

  async getRemplacantById(id: string): Promise<RemplacantEntity> {
    return this.request<RemplacantEntity>({
      method: 'GET',
      url: `/remplacants/${id}`,
    });
  }

  // Job applications endpoints
  async getApplications(params?: ApplicationQueryParams): Promise<PaginatedResponse<JobApplicationEntity>> {
    return this.request<PaginatedResponse<JobApplicationEntity>>({
      method: 'GET',
      url: '/applications',
      params,
    });
  }

  // Job offers endpoints
  async getJobOffers(params?: { region?: string; startDate?: string; garderieId?: string; page?: number; limit?: number }): Promise<PaginatedResponse<JobOfferEntity>> {
    return this.request<PaginatedResponse<JobOfferEntity>>({
      method: 'GET',
      url: '/job-offers',
      params,
    });
  }

  async getJobOfferById(id: string): Promise<JobOfferEntity> {
    return this.request<JobOfferEntity>({
      method: 'GET',
      url: `/job-offers/${id}`,
    });
  }

  async createJobOffer(data: CreateJobOfferDto): Promise<JobOfferEntity> {
    return this.request<JobOfferEntity>({
      method: 'POST',
      url: '/job-offers',
      data,
    });
  }

  async updateJobOffer(id: string, data: UpdateJobOfferDto): Promise<JobOfferEntity> {
    return this.request<JobOfferEntity>({
      method: 'PATCH',
      url: `/job-offers/${id}`,
      data,
    });
  }

  // Timesheet endpoints
  async getTimesheets(params?: TimesheetQueryParams): Promise<PaginatedResponse<TimesheetEntity>> {
    return this.request<PaginatedResponse<TimesheetEntity>>({
      method: 'GET',
      url: '/timesheets',
      params,
    });
  }

  async getTimesheetById(id: string): Promise<TimesheetEntity> {
    return this.request<TimesheetEntity>({
      method: 'GET',
      url: `/timesheets/${id}`,
    });
  }

  // Invoice endpoints
  async getInvoices(params?: InvoiceQueryParams): Promise<PaginatedResponse<InvoiceEntity>> {
    return this.request<PaginatedResponse<InvoiceEntity>>({
      method: 'GET',
      url: '/invoices',
      params,
    });
  }

  async getInvoiceById(id: string): Promise<InvoiceEntity> {
    return this.request<InvoiceEntity>({
      method: 'GET',
      url: `/invoices/${id}`,
    });
  }

  async markInvoiceAsPaid(id: string, paymentDate: string): Promise<InvoiceEntity> {
    return this.request<InvoiceEntity>({
      method: 'PATCH',
      url: `/invoices/${id}/mark-paid`,
      data: { paymentDate },
    });
  }

  // Availability endpoints
  async getAvailability(params?: {
    remplacantId?: string;
    dayOfWeek?: string;
    isRecurring?: boolean;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AvailabilityEntity>> {
    return this.request<PaginatedResponse<AvailabilityEntity>>({
      method: 'GET',
      url: '/availability',
      params,
    });
  }
}

// Export singleton instance
export const apiClient = new SolugardeApiClient();
export default apiClient;
