
// app/applications/page.tsx - Applications Page
'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ApplicationsPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">
            View and manage job applications.
          </p>
        </div>
        
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold">Applications Management Coming Soon</h3>
          <p className="text-muted-foreground mt-2">
            This feature is under development. You'll be able to review applications,
            accept or reject candidates, and manage the hiring process here.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
