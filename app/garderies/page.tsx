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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { createGarderieSchema } from '@/lib/validations';
import type { CreateGarderieDto, CreateUserDto } from '@/types/api';
import { toast } from 'react-hot-toast';
 

type StatusFilter = 'all' | 'active' | 'inactive';

export default function GarderiesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [openCreate, setOpenCreate] = useState(false);

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
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nouvelle garderie
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Créer une garderie</DialogTitle>
                </DialogHeader>
                <CreateGarderieForm onCreated={() => { setOpenCreate(false); refetch(); }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Garderies</CardTitle>
            <div className="flex items-center w-full gap-2 sm:w-auto">
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
                {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rafraîchir'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <div className="p-4 border rounded-md border-destructive/20 bg-destructive/5">
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

function CreateGarderieForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof createGarderieSchema> & { createClient?: boolean; clientFirstName?: string; clientLastName?: string; clientEmail?: string; clientPhone?: string; clientPassword?: string }>({
    resolver: zodResolver(createGarderieSchema.merge(z.object({
      createClient: z.boolean().optional(),
      clientFirstName: z.string().optional(),
      clientLastName: z.string().optional(),
      clientEmail: z.string().email().optional(),
      clientPhone: z.string().optional(),
      clientPassword: z.string().min(8).optional(),
    }))),
    defaultValues: { name: '', address: '', email: '', region: '', isActive: true, createClient: false },
  });

  const create = useMutation({
    mutationKey: ['garderies', 'create'],
    mutationFn: async (payload: CreateGarderieDto) => apiClient.createGarderie(payload),
  });

  const onSubmit = async (values: z.infer<typeof createGarderieSchema> & { createClient?: boolean; clientFirstName?: string; clientLastName?: string; clientEmail?: string; clientPhone?: string; clientPassword?: string }) => {
    try {
      const garderie = await create.mutateAsync({
        name: values.name,
        address: values.address || undefined,
        email: values.email || undefined,
        region: values.region,
        isActive: values.isActive,
      });
      if (values.createClient && values.clientEmail && values.clientPassword && values.clientFirstName && values.clientLastName) {
        const payload: CreateUserDto = {
          firstName: values.clientFirstName,
          lastName: values.clientLastName,
          email: values.clientEmail,
          phone: values.clientPhone,
          password: values.clientPassword,
          role: 'client',
          garderieId: garderie.id,
        };
        await apiClient.createUser(payload);
      }
      toast.success('Garderie créée');
      await queryClient.invalidateQueries({ queryKey: queryKeys.garderies.all as any });
      onCreated();
    } catch (e: any) {
      toast.error(e?.message || 'Échec de la création');
    }
  };

  const watchCreateClient = form.watch('createClient');

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Nom</label>
          <Input {...form.register('name')} placeholder="Nom de la garderie" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Région</label>
          <Input {...form.register('region')} placeholder="Région" />
        </div>
        <div>
          <label className="text-sm font-medium">E-mail</label>
          <Input type="email" {...form.register('email')} placeholder="email@exemple.com" />
        </div>
        <div>
          <label className="text-sm font-medium">Adresse</label>
          <Input {...form.register('address')} placeholder="Adresse" />
        </div>
        <div className="sm:col-span-2">
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" className="h-4 w-4" {...form.register('createClient')} />
            Créer aussi un compte client principal
          </label>
        </div>
        {watchCreateClient && (
          <>
            <div>
              <label className="text-sm font-medium">Prénom (client)</label>
              <Input {...form.register('clientFirstName')} placeholder="Prénom" />
            </div>
            <div>
              <label className="text-sm font-medium">Nom (client)</label>
              <Input {...form.register('clientLastName')} placeholder="Nom" />
            </div>
            <div>
              <label className="text-sm font-medium">E-mail (client)</label>
              <Input type="email" {...form.register('clientEmail')} placeholder="email@exemple.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Téléphone (client)</label>
              <Input {...form.register('clientPhone')} placeholder="+1 (555) 123-4567" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Mot de passe (client)</label>
              <Input type="password" {...form.register('clientPassword')} placeholder="Mot de passe temporaire" />
            </div>
          </>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => form.reset()}>Réinitialiser</Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
