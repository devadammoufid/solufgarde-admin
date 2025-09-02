// app/garderies/page.tsx - Garderies Management Page
'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { protectionConfigs } from '@/components/auth/ProtectedRoute';

export default function GarderiesPage() {
  return (
    <ProtectedRoute {...protectionConfigs.adminOnly}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daycare Centers</h1>
          <p className="text-muted-foreground">
            Manage registered daycare centers in your network.
          </p>
        </div>
        
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold">Daycare Management Coming Soon</h3>
          <p className="text-muted-foreground mt-2">
            This feature is under development. You'll be able to add, edit, and 
            manage daycare centers here.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}