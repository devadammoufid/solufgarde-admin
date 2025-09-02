'use client';

import React, { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/query-client';

interface AppProvidersProps {
  children: React.ReactNode;
}

// Error Boundary Component
class QueryErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Query Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md mx-auto text-center space-y-4 p-6">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold text-foreground">
              Oops! Something went wrong
            </h1>
            <p className="text-muted-foreground">
              We encountered an unexpected error. Please refresh the page or contact support if the problem persists.
            </p>
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show minimal loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryErrorBoundary>
      {/* React Query Provider */}
      <QueryClientProvider client={queryClient}>
        {/* Theme Provider for dark/light mode */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="solugarde-theme"
        >
          {/* Authentication Provider */}
          <AuthProvider>
            {children}
            
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              gutter={8}
              containerClassName="z-[100]"
              toastOptions={{
                // Default toast styling
                className: 'bg-background text-foreground border border-border',
                duration: 4000,
                
                // Success toast styling
                success: {
                  className: 'bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800',
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                
                // Error toast styling
                error: {
                  className: 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800',
                  duration: 6000, // Longer for errors
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
                
                // Loading toast styling
                loading: {
                  className: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800',
                  iconTheme: {
                    primary: '#3b82f6',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
            
            {/* React Query Dev Tools (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools
                initialIsOpen={false}
                position="bottom-right"
                toggleButtonProps={{
                  style: {
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 99999,
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  },
                }}
              />
            )}
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </QueryErrorBoundary>
  );
};

// Custom hook to check if providers are ready
export const useProvidersReady = () => {
  const [isReady, setIsReady] = React.useState(false);
  
  React.useEffect(() => {
    // Simple check to ensure providers are initialized
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return isReady;
};

export default AppProviders;