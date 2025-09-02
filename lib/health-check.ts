import { apiClient } from './api-client';
import { toast } from 'react-hot-toast';

export interface HealthCheckResult {
  isHealthy: boolean;
  responseTime: number;
  error?: string;
  timestamp: Date;
  apiUrl: string;
}

export interface HealthCheckOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  showToasts?: boolean;
}

/**
 * Performs a health check on the API
 */
export async function performHealthCheck(
  options: HealthCheckOptions = {}
): Promise<HealthCheckResult> {
  const {
    timeout = 5000,
    retries = 3,
    retryDelay = 1000,
    showToasts = false,
  } = options;

  const startTime = Date.now();
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });

      // Race between API call and timeout
      const response = await Promise.race([
        apiClient.health(),
        timeoutPromise,
      ]);

      const responseTime = Date.now() - startTime;

      if (showToasts) {
        toast.success('API connection verified');
      }

      return {
        isHealthy: true,
        responseTime,
        timestamp: new Date(),
        apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'unknown',
      };
    } catch (error: any) {
      lastError = error?.message || 'Unknown error occurred';
      
      // If this is not the last attempt, wait before retrying
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        continue;
      }
    }
  }

  const responseTime = Date.now() - startTime;

  if (showToasts) {
    toast.error(`API health check failed: ${lastError}`);
  }

  return {
    isHealthy: false,
    responseTime,
    error: lastError,
    timestamp: new Date(),
    apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'unknown',
  };
}

/**
 * Continuous health monitoring class
 */
export class HealthMonitor {
  private interval: NodeJS.Timeout | null = null;
  private callbacks: Set<(result: HealthCheckResult) => void> = new Set();
  private lastResult: HealthCheckResult | null = null;
  private isRunning = false;

  constructor(
    private intervalMs: number = 30000, // 30 seconds
    private options: HealthCheckOptions = {}
  ) {}

  /**
   * Start monitoring
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    
    // Perform initial check
    this.performCheck();
    
    // Set up recurring checks
    this.interval = setInterval(() => {
      this.performCheck();
    }, this.intervalMs);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
  }

  /**
   * Add callback for health check results
   */
  onHealthChange(callback: (result: HealthCheckResult) => void): () => void {
    this.callbacks.add(callback);
    
    // If we have a last result, call the callback immediately
    if (this.lastResult) {
      callback(this.lastResult);
    }
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Get the last health check result
   */
  getLastResult(): HealthCheckResult | null {
    return this.lastResult;
  }

  /**
   * Check if currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  private async performCheck(): Promise<void> {
    try {
      const result = await performHealthCheck({
        ...this.options,
        showToasts: false, // Don't show toasts for background checks
      });

      this.lastResult = result;

      // Notify all callbacks
      this.callbacks.forEach(callback => {
        try {
          callback(result);
        } catch (error) {
          console.error('Health monitor callback error:', error);
        }
      });
    } catch (error) {
      console.error('Health monitor check error:', error);
    }
  }
}

/**
 * React hook for health monitoring
 */
export function useHealthMonitor(
  enabled: boolean = true,
  intervalMs: number = 30000
): {
  healthResult: HealthCheckResult | null;
  isMonitoring: boolean;
  performManualCheck: () => Promise<HealthCheckResult>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
} {
  const [healthResult, setHealthResult] = React.useState<HealthCheckResult | null>(null);
  const [monitor] = React.useState(() => new HealthMonitor(intervalMs));
  const [isMonitoring, setIsMonitoring] = React.useState(false);

  React.useEffect(() => {
    if (enabled) {
      monitor.start();
      setIsMonitoring(true);

      const unsubscribe = monitor.onHealthChange(setHealthResult);

      return () => {
        unsubscribe();
        monitor.stop();
        setIsMonitoring(false);
      };
    }
  }, [enabled, monitor]);

  const performManualCheck = React.useCallback(async () => {
    const result = await performHealthCheck({ showToasts: true });
    setHealthResult(result);
    return result;
  }, []);

  const startMonitoring = React.useCallback(() => {
    monitor.start();
    setIsMonitoring(true);
  }, [monitor]);

  const stopMonitoring = React.useCallback(() => {
    monitor.stop();
    setIsMonitoring(false);
  }, [monitor]);

  return {
    healthResult,
    isMonitoring,
    performManualCheck,
    startMonitoring,
    stopMonitoring,
  };
}

/**
 * Get health status color for UI components
 */
export function getHealthStatusColor(result: HealthCheckResult | null): {
  color: string;
  bgColor: string;
  textColor: string;
} {
  if (!result) {
    return {
      color: '#6b7280', // gray-500
      bgColor: '#f3f4f6', // gray-100
      textColor: '#374151', // gray-700
    };
  }

  if (result.isHealthy) {
    if (result.responseTime < 1000) {
      return {
        color: '#10b981', // green-500
        bgColor: '#d1fae5', // green-100
        textColor: '#065f46', // green-800
      };
    } else {
      return {
        color: '#f59e0b', // amber-500
        bgColor: '#fef3c7', // amber-100
        textColor: '#92400e', // amber-800
      };
    }
  } else {
    return {
      color: '#ef4444', // red-500
      bgColor: '#fee2e2', // red-100
      textColor: '#991b1b', // red-800
    };
  }
}

/**
 * Format health check result for display
 */
export function formatHealthResult(result: HealthCheckResult | null): string {
  if (!result) return 'Unknown';

  if (result.isHealthy) {
    return `Healthy (${result.responseTime}ms)`;
  } else {
    return `Unhealthy - ${result.error}`;
  }
}

// Create a singleton health monitor for the app
export const globalHealthMonitor = new HealthMonitor(60000); // Check every minute

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  globalHealthMonitor.start();
}