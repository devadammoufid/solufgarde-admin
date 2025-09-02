// app/schedules/page.tsx - Schedules Page
'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function SchedulesPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedules</h1>
          <p className="text-muted-foreground">
            Manage staff schedules and attendance tracking.
          </p>
        </div>
        
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold">Schedule Management Coming Soon</h3>
          <p className="text-muted-foreground mt-2">
            This feature is under development. You'll be able to create schedules,
            track attendance, and manage staff assignments here.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}