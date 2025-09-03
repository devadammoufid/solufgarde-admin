// app/job-offers/page.tsx - Offres d'emploi
'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { ProtectedRoute, protectionConfigs } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { JobOfferEntity, CreateJobOfferDto, UpdateJobOfferDto, JobOfferStatus } from '@/types/api';
import { Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { CANADIAN_PROVINCES } from '@/lib/constants';
import { DatePicker } from '@/components/ui/date-picker';
import { useAuth } from '@/contexts/AuthContext';

export default function JobOffersPage() {
  const [region, setRegion] = useState('');
  const [startDate, setStartDate] = useState('');
  const [garderieId, setGarderieId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const { isAdmin, user } = useAuth();

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: queryKeys.jobOffers.list({ region: region || undefined, startDate: startDate || undefined, garderieId: garderieId || undefined, page: 1, limit: 50 }),
    queryFn: async () => {
      return apiClient.getJobOffers({
        region: region || undefined,
        startDate: startDate || undefined,
        garderieId: garderieId || undefined,
        page: 1,
        limit: 50,
      });
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationKey: ['jobOffers', 'status'],
    mutationFn: async ({ id, status }: { id: string; status: JobOfferStatus }) =>
      apiClient.updateJobOffer(id, { status } as UpdateJobOfferDto),
    onSuccess: async () => {
      toast.success('Statut mis à jour');
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobOffers.all });
    },
    onError: (e: any) => toast.error(e?.message || 'Échec de la mise à jour du statut'),
  });

  const onUpdateStatus = (id: string, status: JobOfferStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const columns = useMemo<ColumnDef<JobOfferEntity>[]>(() => {
    return [
      {
        accessorKey: 'title',
        header: 'Titre',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.title}</span>
            <span className="text-xs text-muted-foreground">{row.original.garderie?.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'region',
        header: 'Région',
        cell: ({ getValue }) => getValue<string>() || '—',
      },
      {
        id: 'status',
        header: 'Statut',
        cell: ({ row }) => {
          const s = (row.original.status || 'draft') as JobOfferStatus;
          const map: Record<JobOfferStatus, any> = {
            draft: 'draft',
            published: 'published',
            closed: 'inactive',
            archived: 'inactive',
          };
          return <StatusBadge status={map[s]} size="sm" />;
        },
      },
      {
        id: 'dates',
        header: 'Période',
        cell: ({ row }) => {
          const s = row.original.startDate ? format(new Date(row.original.startDate), 'dd MMM yyyy', { locale: fr }) : '—';
          const e = row.original.endDate ? format(new Date(row.original.endDate), 'dd MMM yyyy', { locale: fr }) : '—';
          return <span className="text-sm">{s} → {e}</span>;
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Créée le',
        cell: ({ getValue }) => {
          const v = getValue<string | undefined>();
          if (!v) return '—';
          try {
            return format(new Date(v), 'dd MMM yyyy', { locale: fr });
          } catch {
            return v as string;
          }
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const id = row.original.id;
          const status = (row.original.status || 'draft') as JobOfferStatus;
          const canPublish = status === 'draft';
          const canClose = status === 'published';
          return (
            <div className="flex gap-2">
              <Link href={`/job-offers/${id}`}>
                <Button asChild={false} variant="outline" size="sm">Voir</Button>
              </Link>
              {canPublish && (
                <Button size="sm" onClick={() => onUpdateStatus(id, 'published')}>Publier</Button>
              )}
              {canClose && (
                <Button variant="destructive" size="sm" onClick={() => onUpdateStatus(id, 'closed')}>Fermer</Button>
              )}
            </div>
          );
        },
      },
    ];
  }, []);

  // Garderies for select list
  const { data: garderies } = useQuery({
    queryKey: queryKeys.garderies.list({ page: 1, limit: 100, isActive: true }),
    queryFn: () => apiClient.getGarderies({ page: 1, limit: 100, isActive: true }),
    staleTime: 5 * 60_000,
  });

  // Create form schema (French messages)
  const createSchema = z.object({
    title: z.string().min(5, 'Le titre doit comporter au moins 5 caractères'),
    description: z.string().min(20, 'La description doit comporter au moins 20 caractères'),
    startDate: z
      .string()
      .min(1, 'Date de début requise')
      .refine((v) => !isNaN(Date.parse(v)), 'Date de début invalide')
      .refine((v) => {
        const d = new Date(v + 'T00:00:00')
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        return d.getTime() > today.getTime()
      }, 'La date de début doit être postérieure à aujourd\'hui'),
    endDate: z
      .string()
      .min(1, 'Date de fin requise')
      .refine((v) => !isNaN(Date.parse(v)), 'Date de fin invalide'),
    region: z.string().refine((val) => CANADIAN_PROVINCES.some(p => p.code === val), 'Sélectionnez une région valide'),
    garderieId: z.string().min(1, 'Garderie requise'),
    hourlyRate: z
      .string()
      .optional()
      .refine((v) => v === undefined || v === '' || (!isNaN(Number(v)) && Number(v) >= 0), 'Taux horaire invalide'),
  }).refine((data) => {
    const start = new Date(data.startDate + 'T00:00:00')
    const end = new Date(data.endDate + 'T00:00:00')
    const minEnd = new Date(start.getTime() + 24 * 60 * 60 * 1000)
    return end.getTime() >= minEnd.getTime()
  }, {
    message: 'La date de fin doit être au moins un jour après la date de début',
    path: ['endDate'],
  });

  type CreateForm = z.infer<typeof createSchema>;
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      region: '',
      garderieId: '',
      hourlyRate: '',
    },
  });

  const createMutation = useMutation({
    mutationKey: ['jobOffers', 'create'],
    mutationFn: async (payload: CreateJobOfferDto) => apiClient.createJobOffer(payload),
    onSuccess: async () => {
      toast.success('Offre créée');
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobOffers.all });
      setShowCreate(false);
      reset();
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Échec de la création');
    },
  });

  const onCreateSubmit = handleSubmit(async (data) => {
    // For clients, force garderieId to their own
    const resolvedGarderieId = isAdmin ? data.garderieId : (user?.garderie?.id || '');
    if (!resolvedGarderieId) {
      toast.error('Aucune garderie associée à votre compte');
      return;
    }
    const payload: CreateJobOfferDto = {
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      region: data.region,
      garderieId: resolvedGarderieId,
      hourlyRate: data.hourlyRate ? Number(data.hourlyRate) : undefined,
      status: 'draft',
    };
    await createMutation.mutateAsync(payload);
  });

  return (
    <ProtectedRoute {...protectionConfigs.adminOrClient}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Offres d'emploi</h1>
            <p className="text-muted-foreground">Gérez et suivez vos offres publiées.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowCreate((v) => !v)} className="gap-2">
              <Plus className="h-4 w-4" />
              {showCreate ? 'Fermer' : 'Nouvelle offre'}
            </Button>
          </div>
        </div>

        {showCreate && (
          <Card>
            <CardHeader>
              <CardTitle>Créer une offre</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onCreateSubmit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Titre</label>
                  <Input {...register('title')} />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Région</label>
                  <select
                    {...register('region')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Sélectionner...</option>
                    {CANADIAN_PROVINCES.map((r) => (
                      <option key={r.code} value={r.code}>{r.name}</option>
                    ))}
                  </select>
                  {errors.region && <p className="text-xs text-destructive">{errors.region.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Début</label>
                  <Controller
                    control={control}
                    name="startDate"
                    render={({ field }) => {
                      const selected = field.value ? new Date(field.value + 'T00:00:00') : undefined
                      const now = new Date()
                      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                      return (
                        <DatePicker
                          date={selected}
                          onChange={(d) => {
                            const next = d ? format(d, 'yyyy-MM-dd') : ''
                            field.onChange(next)
                            const endVal = watch('endDate')
                            if (endVal) {
                              const startD = next ? new Date(next + 'T00:00:00') : undefined
                              const endD = new Date(endVal + 'T00:00:00')
                              if (!startD || endD.getTime() <= startD.getTime()) {
                                setValue('endDate', '', { shouldValidate: true, shouldDirty: true })
                              }
                            }
                          }}
                          disabled={(d) => d.getTime() <= today.getTime()}
                        />
                      )
                    }}
                  />
                  {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Fin</label>
                  <Controller
                    control={control}
                    name="endDate"
                    render={({ field }) => {
                      const selected = field.value ? new Date(field.value + 'T00:00:00') : undefined
                      const startVal = watch('startDate') as string | undefined
                      const start = startVal ? new Date(startVal + 'T00:00:00') : undefined
                      const now = new Date()
                      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                      const min = start ? start : today
                      return (
                        <DatePicker
                          date={selected}
                          onChange={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                          disabled={(d) => d.getTime() <= min.getTime()}
                        />
                      )
                    }}
                  />
                  {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
                </div>
                
                {isAdmin ? (
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Garderie</label>
                    <select
                      {...register('garderieId')}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Sélectionner...</option>
                      {garderies?.data?.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    {errors.garderieId && <p className="text-xs text-destructive">{errors.garderieId.message}</p>}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Garderie</label>
                    <Input value={user?.garderie?.name || ''} readOnly disabled />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Taux horaire (CAD)</label>
                  <Input type="number" step="0.01" min="0" {...register('hourlyRate')} />
                  {errors.hourlyRate && <p className="text-xs text-destructive">{errors.hourlyRate.message as any}</p>}
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm text-muted-foreground">Description</label>
                  <textarea
                    {...register('description')}
                    className="w-full min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                    {createMutation.isPending ? 'Création...' : 'Créer'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { reset(); setShowCreate(false); }}>Annuler</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Offres</CardTitle>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Toutes les régions</option>
                {CANADIAN_PROVINCES.map((r) => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </select>
              {isAdmin && (
                <select
                  value={garderieId}
                  onChange={(e) => setGarderieId(e.target.value)}
                  className="w-full sm:w-60 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Toutes les garderies</option>
                  {garderies?.data?.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              )}
              <Input
                type="date"
                placeholder="À partir du"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-56"
              />
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
                <p className="text-sm text-destructive">{(error as Error)?.message || "Échec du chargement des offres."}</p>
              </div>
            ) : (
              <DataTable<JobOfferEntity, unknown>
                columns={columns}
                data={data?.data ?? []}
                searchable={true}
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
