// app/settings/page.tsx - Settings Page
'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and application preferences.
          </p>
        </div>
        
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold">Settings Coming Soon</h3>
          <p className="text-muted-foreground mt-2">
            This feature is under development. You'll be able to update your profile,
            change preferences, and manage account settings here.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}