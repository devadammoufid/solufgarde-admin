// app/timesheets/page.tsx - Timesheets Page
'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function TimesheetsPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timesheets</h1>
          <p className="text-muted-foreground">
            Track working hours and approve timesheets.
          </p>
        </div>
        
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold">Timesheet Management Coming Soon</h3>
          <p className="text-muted-foreground mt-2">
            This feature is under development. You'll be able to submit timesheets,
            approve hours, and track payroll here.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
