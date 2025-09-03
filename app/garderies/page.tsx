// app/garderies/page.tsx - Garderies Management Page
'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import { ProtectedRoute, protectionConfigs } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { GarderieEntity } from '@/types/api';
import { Plus, Loader2 } from 'lucide-react';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function GarderiesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.garderies.list({ search, status }),
    queryFn: async () => {
      const res = await apiClient.getGarderies({
        page: 1,
        limit: 50,
        search: search || undefined,
        isActive: status === 'all' ? undefined : status === 'active',
      });
      return res;
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const columns = useMemo<ColumnDef<GarderieEntity>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const g = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{g.name}</span>
            {g.region && (
              <span className="text-xs text-muted-foreground">{g.region}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => {
        const v = getValue<string | undefined>();
        return v ? <span className="text-sm">{v}</span> : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      id: 'users',
      header: 'Users',
      cell: ({ row }) => {
        const g = row.original;
        const count = typeof g.userCount === 'number' ? g.userCount : (Array.isArray(g.users) ? g.users.length : 0);
        return <span className="text-sm">{count}</span>;
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive ? 'active' : 'inactive'} size="sm" />
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => {
        const v = getValue<string | undefined>();
        if (!v) return <span className="text-muted-foreground">—</span>;
        try {
          return <span className="text-sm">{format(new Date(v), 'yyyy-MM-dd')}</span>;
        } catch {
          return <span className="text-sm">{v}</span>;
        }
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/garderies/${row.original.id}`}>Voir</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/garderies/${row.original.id}`}>Modifier</a>
          </Button>
        </div>
      ),
    },
  ], [/* deps: none for static columns */]);

  return (
    <ProtectedRoute {...protectionConfigs.adminOnly}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Garderies</h1>
            <p className="text-muted-foreground">Gérer les garderies enregistrées dans votre réseau.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => alert('Formulaire de création à venir')}
              className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle garderie
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Garderies</CardTitle>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <SearchInput
                placeholder="Rechercher par nom, e-mail, région"
                value={search}
                onSearch={setSearch}
                className="w-full sm:w-80"
              />
              <div className="flex items-center gap-1">
                <Button
                  variant={status === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatus('all')}
                >
                  Tous
                </Button>
                <Button
                  variant={status === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatus('active')}
                >
                  Actives
                </Button>
                <Button
                  variant={status === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatus('inactive')}
                >
                  Inactives
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rafraîchir'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">
                  {(error as Error)?.message || 'Échec du chargement des garderies.'}
                </p>
              </div>
            ) : (
              <DataTable<GarderieEntity, unknown>
                columns={columns}
                data={data?.data ?? []}
                searchable={false}
                filterable={true}
                pagination={true}
                pageSize={10}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
