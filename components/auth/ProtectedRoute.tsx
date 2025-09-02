'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/api';
import { cn } from '@/lib/utils';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  fallbackUrl?: string;
  showFallback?: boolean;
  className?: string;
}

interface AccessDeniedProps {
  reason: 'unauthenticated' | 'insufficient_role' | 'insufficient_permissions';
  requiredRoles?: UserRole[];
  userRole?: UserRole | null;
  onRetry?: () => void;
  className?: string;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  reason,
  requiredRoles,
  userRole,
  onRetry,
  className,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const getMessage = () => {
    switch (reason) {
      case 'unauthenticated':
        return {
          title: 'Authentification requise',
          description: 'Vous devez vous connecter pour accéder à cette page.',
          icon: Lock,
          action: 'Se connecter',
          actionHandler: () => router.push(`/login?redirect=${encodeURIComponent(pathname)}`),
        };
      case 'insufficient_role':
        return {
          title: 'Accès refusé',
          description: `Cette page nécessite le rôle ${requiredRoles?.join(' ou ')}. Votre rôle actuel est ${userRole}.`,
          icon: Shield,
          action: 'Aller au tableau de bord',
          actionHandler: () => router.push('/'),
        };
      case 'insufficient_permissions':
        return {
          title: 'Permissions insuffisantes',
          description: 'Vous ne disposez pas des permissions requises pour accéder à cette ressource.',
          icon: AlertTriangle,
          action: "Contacter l'administrateur",
          actionHandler: () => {
            // Could open a support modal or redirect to help page
            console.log('Contact administrator for access');
          },
        };
      default:
        return {
          title: 'Accès refusé',
          description: 'Vous n\'êtes pas autorisé à afficher cette page.',
          icon: Shield,
          action: 'Retour',
          actionHandler: () => router.back(),
        };
    }
  };

  const { title, description, icon: Icon, action, actionHandler } = getMessage();

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-background p-4",
      className
    )}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full">
              <Icon className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button onClick={actionHandler} className="w-full">
              {action}
            </Button>
            {onRetry && (
              <Button variant="outline" onClick={onRetry} className="w-full">
                Try Again
              </Button>
            )}
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <h4 className="text-sm font-medium mb-2">Debug Info (Development)</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Reason: {reason}</p>
                <p>User Role: {userRole || 'none'}</p>
                <p>Required Roles: {requiredRoles?.join(', ') || 'any'}</p>
                <p>Current Path: {pathname}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackUrl = '/login',
  showFallback = true,
  className,
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    role,
    refreshUserData 
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if user has required role
  const hasRequiredRole = () => {
    if (requiredRoles.length === 0) return true;
    if (!role) return false;
    return requiredRoles.includes(role);
  };

  // Check if user has required permissions
  const hasRequiredPermissions = () => {
    if (requiredPermissions.length === 0) return true;
    // This would check against user permissions from the backend
    // For now, we'll assume permissions are role-based
    return true; // Implement actual permission checking here
  };

  // Redirect to login if not authenticated and not showing fallback
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !showFallback) {
      const redirectUrl = `${fallbackUrl}?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, showFallback, fallbackUrl, pathname, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="loading-spinner h-8 w-8" />
          <p className="text-muted-foreground">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated
  if (!isAuthenticated) {
    if (!showFallback) return null; // Will redirect via useEffect
    
    return (
      <AccessDenied
        reason="unauthenticated"
        className={className}
        onRetry={refreshUserData}
      />
    );
  }

  // Show access denied if insufficient role
  if (!hasRequiredRole()) {
    if (!showFallback) {
      router.push('/');
      return null;
    }
    
    return (
      <AccessDenied
        reason="insufficient_role"
        requiredRoles={requiredRoles}
        userRole={role}
        className={className}
        onRetry={refreshUserData}
      />
    );
  }

  // Show access denied if insufficient permissions
  if (!hasRequiredPermissions()) {
    if (!showFallback) {
      router.push('/');
      return null;
    }
    
    return (
      <AccessDenied
        reason="insufficient_permissions"
        className={className}
        onRetry={refreshUserData}
      />
    );
  }

  // Render protected content
  return <div className={className}>{children}</div>;
};

// Higher-order component version for easier usage
export const withProtection = <P extends object>(
  Component: React.ComponentType<P>,
  protection: Omit<ProtectedRouteProps, 'children' | 'className'>
) => {
  const ProtectedComponent = (props: P & { className?: string }) => {
    const { className, ...componentProps } = props;
    
    return (
      <ProtectedRoute {...protection} className={className}>
        <Component {...(componentProps as P)} />
      </ProtectedRoute>
    );
  };

  ProtectedComponent.displayName = `withProtection(${Component.displayName || Component.name})`;
  
  return ProtectedComponent;
};

// Predefined protection configurations
export const protectionConfigs = {
  adminOnly: {
    requiredRoles: ['admin'] as UserRole[],
  },
  clientOnly: {
    requiredRoles: ['client'] as UserRole[],
  },
  remplacantOnly: {
    requiredRoles: ['remplacant'] as UserRole[],
  },
  adminOrClient: {
    requiredRoles: ['admin', 'client'] as UserRole[],
  },
  authenticated: {
    // No specific roles required, just authentication
  },
} as const;

export default ProtectedRoute;
