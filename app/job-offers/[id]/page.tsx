// app/job-offers/[id]/page.tsx - Détail d'une offre d'emploi
'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { ProtectedRoute, protectionConfigs } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { JobOfferEntity, JobApplicationEntity, UpdateJobOfferDto, JobOfferStatus } from '@/types/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CANADIAN_PROVINCES } from '@/lib/constants';

export default function JobOfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const { data: offer, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.jobOffers.detail(id),
    enabled: Boolean(id),
    queryFn: async () => apiClient.getJobOfferById(id),
  });

  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const updateSchema = z.object({
    title: z.string().min(5, 'Le titre doit comporter au moins 5 caractères'),
    description: z.string().min(10, 'La description est trop courte'),
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
    status: z.enum(['draft', 'published', 'closed', 'archived']).optional(),
  }).refine((data) => {
    const start = new Date(data.startDate + 'T00:00:00')
    const end = new Date(data.endDate + 'T00:00:00')
    const minEnd = new Date(start.getTime() + 24 * 60 * 60 * 1000)
    return end.getTime() >= minEnd.getTime()
  }, {
    message: 'La date de fin doit être au moins un jour après la date de début',
    path: ['endDate'],
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control, watch, setValue } = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    values: offer ? {
      title: offer.title,
      description: offer.description,
      startDate: offer.startDate?.slice(0, 10) || '',
      endDate: offer.endDate?.slice(0, 10) || '',
      region: offer.region || '',
      status: (offer.status as any) || 'draft',
    } : undefined,
  });

  const mutation = useMutation({
    mutationKey: ['jobOffers', 'update', id],
    mutationFn: async (payload: UpdateJobOfferDto) => apiClient.updateJobOffer(id, payload),
    onSuccess: async () => {
      toast.success('Offre mise à jour');
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobOffers.detail(id) });
      await refetch();
      setEditing(false);
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Échec de la mise à jour');
    },
  });

  const onEditSubmit = handleSubmit(async (data) => {
    const payload: UpdateJobOfferDto = {
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      region: data.region,
      status: data.status as JobOfferStatus,
    };
    await mutation.mutateAsync(payload);
  });

  const statusMutation = useMutation({
    mutationKey: ['jobOffers', 'status', id],
    mutationFn: async (status: JobOfferStatus) => apiClient.updateJobOffer(id, { status }),
    onSuccess: async () => {
      toast.success('Statut mis à jour');
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobOffers.detail(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobOffers.all });
    },
    onError: (e: any) => toast.error(e?.message || 'Échec de la mise à jour du statut'),
  });

  const { data: applications, isLoading: isLoadingApps } = useQuery({
    queryKey: queryKeys.applications.list({ jobOfferId: id }),
    enabled: Boolean(id),
    queryFn: async () => apiClient.getApplications({ jobOfferId: id, page: 1, limit: 50 }),
  });

  const appColumns = useMemo<ColumnDef<JobApplicationEntity>[]>(() => [
    {
      id: 'remplacant',
      header: 'Candidat',
      cell: ({ row }) => {
        const r = row.original.remplacant?.user;
        const name = r ? `${r.firstName} ${r.lastName}` : '—';
        return (
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            {r?.email && <span className="text-xs text-muted-foreground">{r.email}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue<'pending'|'accepted'|'rejected'|'canceled'>();
        const map: Record<string, any> = {
          pending: 'pending',
          accepted: 'approved',
          rejected: 'rejected',
          canceled: 'cancelled',
        };
        return <StatusBadge status={map[s] || 'pending'} size="sm" />;
      },
    },
    {
      accessorKey: 'appliedAt',
      header: 'Candidature',
      cell: ({ getValue }) => {
        const v = getValue<string | undefined>();
        if (!v) return '—';
        try { return format(new Date(v), 'dd MMM yyyy', { locale: fr }); } catch { return v as string; }
      },
    },
    {
      accessorKey: 'decisionAt',
      header: 'Décision',
      cell: ({ getValue }) => {
        const v = getValue<string | undefined>();
        if (!v) return '—';
        try { return format(new Date(v), 'dd MMM yyyy', { locale: fr }); } catch { return v as string; }
      },
    },
  ], []);

  return (
    <ProtectedRoute {...protectionConfigs.adminOrClient}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/job-offers')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{offer?.title ?? 'Offre'}</h1>
              <p className="text-muted-foreground">Détails de l'offre d'emploi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rafraîchir'}
            </Button>
            <Button size="sm" onClick={() => { setEditing((e) => !e); if (!editing && offer) reset(); }}>
              {editing ? 'Annuler' : 'Modifier'}
            </Button>
            {!editing && offer && (
              <>
                {(!offer.status || offer.status === 'draft') && (
                  <Button size="sm" onClick={() => statusMutation.mutate('published')}>Publier</Button>
                )}
                {offer.status === 'published' && (
                  <Button variant="destructive" size="sm" onClick={() => statusMutation.mutate('closed')}>Fermer</Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Informations principales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">{(error as Error)?.message || "Échec du chargement de l'offre."}</p>
              </div>
            ) : offer ? (
              editing ? (
                <form onSubmit={onEditSubmit} className="grid gap-4 md:grid-cols-2">
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
                    <label className="text-sm text-muted-foreground">Statut</label>
                    <select
                      {...register('status')}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="draft">Brouillon</option>
                      <option value="published">Publié</option>
                      <option value="closed">Fermé</option>
                      <option value="archived">Archivé</option>
                    </select>
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
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-sm text-muted-foreground">Description</label>
                    <textarea {...register('description')} className="w-full min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                    {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</Button>
                    <Button type="button" variant="outline" onClick={() => { reset(); setEditing(false); }}>Annuler</Button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Titre</div>
                    <div className="font-medium">{offer.title}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Région</div>
                    <div className="font-medium">{offer.region || '—'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Statut</div>
                    <div>
                      <StatusBadge status={offer.status === 'published' ? 'published' : offer.status === 'closed' || offer.status === 'archived' ? 'inactive' : 'draft'} size="sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Garderie</div>
                    <div className="font-medium">{offer.garderie?.name || '—'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Période</div>
                    <div className="font-medium">
                      {offer.startDate ? format(new Date(offer.startDate), 'dd MMM yyyy', { locale: fr }) : '—'}
                      {' → '}
                      {offer.endDate ? format(new Date(offer.endDate), 'dd MMM yyyy', { locale: fr }) : '—'}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="whitespace-pre-wrap text-sm">{offer.description || '—'}</div>
                  </div>
                </div>
              )
            ) : null}
          </CardContent>
        </Card>

        {/* Candidatures liées */}
        <Card>
          <CardHeader>
            <CardTitle>Candidatures</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingApps ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <DataTable<JobApplicationEntity, unknown>
                columns={appColumns}
                data={applications?.data ?? []}
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
