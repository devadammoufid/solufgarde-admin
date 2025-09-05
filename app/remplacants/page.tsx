// app/remplacants/page.tsx - Remplacants Management
'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ProtectedRoute, protectionConfigs } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { CreateUserDto, RemplacantEntity, UserEntity } from '@/types/api';
import { createUserSchema } from '@/lib/validations';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function RemplacantsPage() {
  const [search, setSearch] = useState('');
  const [openCreate, setOpenCreate] = useState(false);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.remplacants.list({ search }),
    queryFn: async () => {
      const res = await apiClient.getUsers({
        page: 1,
        limit: 50,
        search: search || undefined,
        role: 'remplacant',
        order: 'DESC',
        sortBy: 'createdAt',
      });
      return res;
    },
    staleTime: 60_000,
  });

  const queryClient = useQueryClient();

  const toggleActive = useMutation({
    mutationKey: ['remplacants', 'toggle-active'],
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => apiClient.updateUser(id, { isActive }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.remplacants.all as any });
      toast.success('Statut mis à jour');
    },
    onError: (e: any) => toast.error(e?.message || 'Échec de mise à jour'),
  });

  const columns = useMemo<ColumnDef<UserEntity>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Remplaçant',
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
      id: 'region',
      header: 'Région',
      cell: ({ row }) => <span className="text-sm">{row.original.remplacant?.region || '—'}</span>,
    },
    {
      id: 'experience',
      header: 'Expérience',
      cell: ({ row }) => <span className="text-sm">{row.original.remplacant?.yearsOfExperience ?? '—'} ans</span>,
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleActive.mutate({ id: row.original.id, isActive: !row.original.isActive })}
            disabled={toggleActive.isPending}
          >
            {row.original.isActive ? 'Désactiver' : 'Activer'}
          </Button>
        </div>
      ),
    },
  ], []);

  return (
    <ProtectedRoute {...protectionConfigs.adminOrClient}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Remplaçants</h1>
            <p className="text-muted-foreground">Gérer les remplaçants et leurs profils.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rafraîchir'}
            </Button>
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button>Nouveau remplaçant</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle>Créer un remplaçant</DialogTitle>
                </DialogHeader>
                <CreateRemplacantForm onCreated={() => { setOpenCreate(false); refetch(); }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Liste des remplaçants</CardTitle>
            <div className="flex items-center w-full gap-2 sm:w-auto">
              <SearchInput
                placeholder="Rechercher par nom, e-mail, région"
                value={search}
                onSearch={setSearch}
                className="w-full sm:w-80"
              />
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

function CreateRemplacantForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const schema = createUserSchema.pick({ firstName: true, lastName: true, email: true, phone: true, password: true }).extend({ role: z.literal('remplacant') });
  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '', role: 'remplacant' },
  });

  const mutation = useMutation({
    mutationKey: ['remplacants', 'create'],
    mutationFn: async (payload: CreateUserDto) => apiClient.createUser(payload),
    onSuccess: async () => {
      toast.success('Remplaçant créé');
      await queryClient.invalidateQueries({ queryKey: queryKeys.remplacants.all as any });
      onCreated();
    },
    onError: (e: any) => toast.error(e?.message || 'Échec de la création'),
  });

  const onSubmit = (values: FormValues) => {
    const payload: CreateUserDto = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      password: values.password,
      role: 'remplacant',
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
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Mot de passe</label>
          <Input type="password" {...form.register('password')} placeholder="Mot de passe temporaire" />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
          )}
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
