// app/staff/page.tsx - Staff Management Page
'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { protectionConfigs } from '@/components/auth/ProtectedRoute';

export default function StaffPage() {
  return (
    <ProtectedRoute {...protectionConfigs.adminOrClient}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage your daycare staff and substitute teachers.
          </p>
        </div>
        
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold">Staff Management Coming Soon</h3>
          <p className="text-muted-foreground mt-2">
            This feature is under development. You'll be able to manage staff, 
            assign roles, and track availability here.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
