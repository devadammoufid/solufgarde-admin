
// app/reports/page.tsx - Reports Page
'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { protectionConfigs } from '@/components/auth/ProtectedRoute';

export default function ReportsPage() {
  return (
    <ProtectedRoute {...protectionConfigs.adminOrClient}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and view analytics and reports.
          </p>
        </div>
        
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold">Reporting Coming Soon</h3>
          <p className="text-muted-foreground mt-2">
            This feature is under development. You'll be able to generate reports
            on attendance, revenue, staff performance, and more here.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
