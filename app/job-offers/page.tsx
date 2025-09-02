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
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { JobOfferEntity, CreateJobOfferDto } from '@/types/api';
import { Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { CANADIAN_PROVINCES } from '@/lib/constants';

export default function JobOffersPage() {
  const [region, setRegion] = useState('');
  const [startDate, setStartDate] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: queryKeys.jobOffers.list({ region: region || undefined, startDate: startDate || undefined, page: 1, limit: 50 }),
    queryFn: async () => {
      return apiClient.getJobOffers({
        region: region || undefined,
        startDate: startDate || undefined,
        page: 1,
        limit: 50,
      });
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const columns = useMemo<ColumnDef<JobOfferEntity>[]>(() => [
    {
      accessorKey: 'title',
      header: "Titre",
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
        try { return format(new Date(v), 'dd MMM yyyy', { locale: fr }); } catch { return v as string; }
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Link href={`/job-offers/${row.original.id}`}>
            <Button asChild={false} variant="outline" size="sm">Voir</Button>
          </Link>
          <Button variant="outline" size="sm">Modifier</Button>
        </div>
      ),
    },
  ], []);

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
    startDate: z.string().min(1, 'Date de début requise'),
    endDate: z.string().min(1, 'Date de fin requise'),
    region: z.string().refine((val) => CANADIAN_PROVINCES.some(p => p.code === val), 'Sélectionnez une région valide'),
    garderieId: z.string().min(1, 'Garderie requise'),
    hourlyRate: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : undefined))
      .refine((v) => v === undefined || (!isNaN(v) && v >= 0), 'Taux horaire invalide'),
  }).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'La date de fin doit être postérieure à la date de début',
    path: ['endDate'],
  });

  type CreateForm = z.infer<typeof createSchema>;
  const {
    register,
    handleSubmit,
    reset,
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
      hourlyRate: undefined,
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
    const payload: CreateJobOfferDto = {
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      region: data.region,
      garderieId: data.garderieId,
      hourlyRate: typeof data.hourlyRate === 'number' ? data.hourlyRate : undefined,
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
                  <Input type="date" {...register('startDate')} />
                  {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Fin</label>
                  <Input type="date" {...register('endDate')} />
                  {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
                </div>
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
