'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Routes that don't need the main layout (e.g., login, public pages)
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/maintenance',
  '/404',
  '/500',
];

// Routes that require authentication but not the main layout
const authRoutes = [
  '/onboarding',
  '/setup',
];

interface AppTemplateProps {
  children: React.ReactNode;
}

export default function AppTemplate({ children }: AppTemplateProps) {
  const pathname = usePathname();
  
  // Check if current route is public (doesn't need authentication or layout)
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if current route is an auth route (needs authentication but not main layout)
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Public routes - render without authentication or layout
  if (isPublicRoute) {
    return <>{children}</>;
  }
  
  // Auth routes - require authentication but use minimal layout
  if (isAuthRoute) {
    return (
      <ProtectedRoute showFallback={true}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </ProtectedRoute>
    );
  }
  
  // Protected routes - require authentication and use main layout
  return (
    <ProtectedRoute showFallback={true}>
      <MainLayout>
        {children}
      </MainLayout>
    </ProtectedRoute>
  );
}