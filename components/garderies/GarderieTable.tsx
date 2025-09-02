'use client';

import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useGarderies } from '@/hooks/useApi';
import type { GarderieEntity } from '@/types/api';

export default function GarderieTable() {
  const { data, isLoading, isError, error } = useGarderies({ limit: 50 });

  const columns = useMemo<ColumnDef<GarderieEntity>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'region',
        header: 'Region',
      },
      {
        id: 'users',
        header: 'Users',
        cell: ({ row }) => {
          const count = row.original.userCount ?? row.original.users?.length ?? 0;
          return <span>{count}</span>;
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.isActive ? 'active' : 'inactive'} />,
      },
    ],
    []
  );

  if (isLoading) return <LoadingSpinner text="Loading garderies..." />;
  if (isError)
    return (
      <div className="text-sm text-destructive">
        {error instanceof Error ? error.message : 'Failed to load garderies'}
      </div>
    );

  return <DataTable columns={columns} data={data?.data || []} searchable filterable />;
}
