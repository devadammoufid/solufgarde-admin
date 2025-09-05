// app/users/page.tsx - Users Management Page
'use client';

import React from 'react';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

import { ProtectedRoute, protectionConfigs } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { CreateUserDto, UpdateUserDto, GarderieEntity, PaginatedResponse, UserEntity, UserRole } from '@/types/api';
import { createUserSchema } from '@/lib/validations';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [role, setRole] = useState<UserRole | 'all'>('all');
  const [openCreate, setOpenCreate] = useState(false);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.users.list({ search, status, role }),
    queryFn: async () => {
      const res = await apiClient.getUsers({
        page: 1,
        limit: 50,
        search: search || undefined,
        role: role === 'all' ? undefined : role,
        order: 'DESC',
        sortBy: 'createdAt',
      });
      return res;
    },
    staleTime: 60_000,
  });

  const { data: garderies } = useQuery({
    queryKey: queryKeys.garderies.list({ page: 1, limit: 100 }),
    queryFn: async () => apiClient.getGarderies({ page: 1, limit: 100, order: 'ASC', sortBy: 'name' }),
    staleTime: 5 * 60_000,
  });

  const columns = useMemo<ColumnDef<UserEntity>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Utilisateur',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{u.firstName} {u.lastName}</span>
            <span className="text-xs text-muted-foreground">{u.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Rôle',
      cell: ({ getValue }) => <span className="text-sm capitalize">{String(getValue())}</span>,
    },
    {
      id: 'garderie',
      header: 'Garderie',
      cell: ({ row }) => <span className="text-sm">{row.original.garderie?.name || '—'}</span>,
    },
    {
      id: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive ? 'active' : 'inactive'} size="sm" />
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Créé',
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
        <EditUserDialog user={row.original} garderies={garderies?.data || []} onUpdated={() => refetch()} />
      ),
    },
  ], []);

  return (
    <ProtectedRoute {...protectionConfigs.adminOnly}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
            <p className="text-muted-foreground">Gérer les comptes et l'affectation aux garderies.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rafraîchir'}
            </Button>
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button>Créer un utilisateur</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle>Nouveau compte</DialogTitle>
                </DialogHeader>
                <CreateUserForm onCreated={() => { setOpenCreate(false); refetch(); }} garderies={garderies?.data || []} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Liste des utilisateurs</CardTitle>
            <div className="flex items-center w-full gap-2 sm:w-auto">
              <SearchInput
                placeholder="Rechercher par nom, e-mail"
                value={search}
                onSearch={setSearch}
                className="w-full sm:w-80"
              />
              <select
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="all">Tous rôles</option>
                <option value="admin">Admin</option>
                <option value="client">Client</option>
                <option value="remplacant">Remplaçant</option>
              </select>
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
                  Actifs
                </Button>
                <Button
                  variant={status === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatus('inactive')}
                >
                  Inactifs
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <div className="p-4 border rounded-md border-destructive/20 bg-destructive/5">
                <p className="text-sm text-destructive">{(error as Error)?.message || 'Échec du chargement.'}</p>
              </div>
            ) : (
              <DataTable<UserEntity, unknown>
                columns={columns}
                data={(data?.data || []).filter(u => status === 'all' ? true : status === 'active' ? u.isActive : !u.isActive)}
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

function CreateUserForm({ onCreated, garderies }: { onCreated: () => void; garderies: GarderieEntity[] }) {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'client',
      garderieId: '',
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationKey: ['users', 'create'],
    mutationFn: async (payload: CreateUserDto) => apiClient.createUser(payload),
    onSuccess: async () => {
      toast.success('Utilisateur créé');
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all as any });
      onCreated();
    },
    onError: (e: any) => toast.error(e?.message || 'Échec de la création'),
  });

  const onSubmit = (values: z.infer<typeof createUserSchema>) => {
    const payload: CreateUserDto = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      password: values.password,
      role: values.role,
      garderieId: values.garderieId || undefined,
    };
    mutation.mutate(payload);
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Prénom</label>
          <Input {...form.register('firstName')} placeholder="Prénom" />
          {form.formState.errors.firstName && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Nom</label>
          <Input {...form.register('lastName')} placeholder="Nom" />
          {form.formState.errors.lastName && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.lastName.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">E-mail</label>
          <Input type="email" {...form.register('email')} placeholder="email@exemple.com" />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Téléphone</label>
          <Input {...form.register('phone')} placeholder="+1 (555) 123-4567" />
          {form.formState.errors.phone && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.phone.message as string}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Mot de passe</label>
          <Input type="password" {...form.register('password')} placeholder="Mot de passe temporaire" />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Rôle</label>
          <select
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            {...form.register('role')}
          >
            <option value="client">Client</option>
            <option value="remplacant">Remplaçant</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Garderie (optionnel)</label>
          <select
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            {...form.register('garderieId')}
          >
            <option value="">— Non assigné —</option>
            {garderies.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => form.reset()}>Réinitialiser</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
        </Button>
      </div>
    </form>
  );
}

function EditUserDialog({ user, garderies, onUpdated }: { user: UserEntity; garderies: GarderieEntity[]; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  // Fallback fetch if parent didn't have garderies yet
  const { data: garderiesFallback } = useQuery({
    queryKey: queryKeys.garderies.list({ page: 1, limit: 100 }),
    queryFn: async () => apiClient.getGarderies({ page: 1, limit: 100, order: 'ASC', sortBy: 'name' }),
    enabled: (garderies?.length || 0) === 0,
    staleTime: 5 * 60_000,
  });
  const garderieList = (garderies?.length ? garderies : (garderiesFallback?.data || []));
  const form = useForm<UpdateUserDto>({
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      garderieId: user.garderie?.id,
    },
  });

  const mutation = useMutation({
    mutationKey: ['users', 'update', user.id],
    mutationFn: async (payload: UpdateUserDto) => apiClient.updateUser(user.id, payload),
    onSuccess: async () => {
      toast.success('Utilisateur mis à jour');
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all as any });
      onUpdated();
      setOpen(false);
    },
    onError: (e: any) => toast.error(e?.message || 'Échec de la mise à jour'),
  });

  const onSubmit = (values: UpdateUserDto) => {
    mutation.mutate({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      role: values.role,
      // RHF select returns string; normalize to boolean
      isActive: typeof values.isActive === 'string' ? values.isActive === 'true' : values.isActive,
      garderieId: values.garderieId || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Modifier</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Prénom</label>
              <Input {...form.register('firstName')} />
            </div>
            <div>
              <label className="text-sm font-medium">Nom</label>
              <Input {...form.register('lastName')} />
            </div>
            <div>
              <label className="text-sm font-medium">E-mail</label>
              <Input type="email" {...form.register('email')} />
            </div>
            <div>
              <label className="text-sm font-medium">Téléphone</label>
              <Input {...form.register('phone')} />
            </div>
            <div>
              <label className="text-sm font-medium">Rôle</label>
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" {...form.register('role')}>
                <option value="admin">Admin</option>
                <option value="client">Client</option>
                <option value="remplacant">Remplaçant</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Statut</label>
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" {...form.register('isActive')}>
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Garderie</label>
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" {...form.register('garderieId')}>
                <option value="">— Non assigné —</option>
                {garderieList.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
