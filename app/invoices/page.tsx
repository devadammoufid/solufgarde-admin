
// app/invoices/page.tsx - Invoices Page
'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function InvoicesPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage invoices and payment tracking.
          </p>
        </div>
        
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold">Invoice Management Coming Soon</h3>
          <p className="text-muted-foreground mt-2">
            This feature is under development. You'll be able to generate invoices,
            track payments, and manage billing here.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}