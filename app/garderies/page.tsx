// app/garderies/page.tsx - Garderies Management Page
'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { protectionConfigs } from '@/components/auth/ProtectedRoute';
import GarderieTable from '@/components/garderies/GarderieTable';

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

        <GarderieTable />
      </div>
    </ProtectedRoute>
  );
}
