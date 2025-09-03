// app/schedules/page.tsx - Schedules (Week view + list + create)
'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, addWeeks, format, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { ProtectedRoute, protectionConfigs } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { GarderieEntity, ShiftEntity, CreateShiftDto } from '@/types/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { createShiftSchema, type CreateShiftForm } from '@/lib/validations';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const [garderieId, setGarderieId] = useState('');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = addDays(weekStart, 6);
  const [openCreate, setOpenCreate] = useState(false);

  const { data: garderies } = useQuery({
    queryKey: queryKeys.garderies.list({ page: 1, limit: 100, isActive: true }),
    queryFn: () => apiClient.getGarderies({ page: 1, limit: 100, isActive: true }),
    staleTime: 5 * 60_000,
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.schedules.list({ garderieId: garderieId || undefined, from: format(weekStart, 'yyyy-MM-dd'), to: format(weekEnd, 'yyyy-MM-dd') }),
    queryFn: async () => apiClient.getSchedules({ garderieId: garderieId || undefined, from: format(weekStart, 'yyyy-MM-dd'), to: format(weekEnd, 'yyyy-MM-dd'), page: 1, limit: 500 }),
    staleTime: 60_000,
  });

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // Create shift form
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<CreateShiftForm>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: { date: format(new Date(), 'yyyy-MM-dd') },
  });

  const createMutation = useMutation({
    mutationKey: ['schedules', 'create'],
    mutationFn: async (payload: CreateShiftDto) => apiClient.createSchedule(payload),
    onSuccess: async () => {
      toast.success('Créneau créé');
      await queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
      setOpenCreate(false);
      reset();
    },
    onError: (e: any) => toast.error(e?.message || 'Échec de création du créneau'),
  });

  const onCreateSubmit = handleSubmit(async (data) => {
    if (!data.garderieId) {
      toast.error('Garderie requise');
      return;
    }
    const startAt = `${data.date}T${data.startTime}:00`;
    const endAt = `${data.date}T${data.endTime}:00`;
    const payload: CreateShiftDto = {
      garderieId: data.garderieId,
      startAt,
      endAt,
      role: data.role || undefined,
      hourlyRate: data.hourlyRate ? Number(data.hourlyRate) : undefined,
      notes: data.notes || undefined,
      status: 'draft',
    };
    await createMutation.mutateAsync(payload);
  });

  return (
    <ProtectedRoute {...protectionConfigs.adminOrClient}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Plannings</h1>
            <p className="text-muted-foreground">Semaine du {format(weekStart, 'dd MMM', { locale: fr })} au {format(weekEnd, 'dd MMM yyyy', { locale: fr })}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, -1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rafraîchir'}
            </Button>
            <Button size="sm" onClick={() => setOpenCreate(true)} className="gap-2"><Plus className="h-4 w-4" /> Nouveau créneau</Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Semaine</CardTitle>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <select
                value={garderieId}
                onChange={(e) => setGarderieId(e.target.value)}
                className="w-full sm:w-60 rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Toutes les garderies</option>
                {garderies?.data?.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">{(error as Error)?.message || "Échec du chargement des plannings."}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {days.map((d) => {
                  const dayStr = format(d, 'yyyy-MM-dd');
                  const items = (data?.data ?? []).filter((s: ShiftEntity) => (s.startAt || '').slice(0,10) === dayStr);
                  return (
                    <div key={dayStr} className="rounded-md border p-2">
                      <div className="text-xs text-muted-foreground mb-2">{format(d, 'EEE dd', { locale: fr })}</div>
                      <div className="space-y-2">
                        {items.length === 0 ? (
                          <div className="text-[11px] text-muted-foreground">Aucun créneau</div>
                        ) : items.map((s) => (
                          <div key={s.id} className="rounded bg-muted p-2 text-[11px]">
                            <div className="font-medium truncate">
                              {format(new Date(s.startAt), 'HH:mm')} - {format(new Date(s.endAt), 'HH:mm')}
                            </div>
                            <div className="truncate">
                              {s.remplacant ? `${s.remplacant.user.firstName} ${s.remplacant.user.lastName}` : 'Non assigné'}
                            </div>
                            <div className="truncate">
                              <Link href={`/garderies/${s.garderie.id}`} className="text-primary hover:underline">{s.garderie.name}</Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {openCreate && (
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>Nouveau créneau</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onCreateSubmit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Garderie</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...register('garderieId')}
                  >
                    <option value="">Sélectionner...</option>
                    {garderies?.data?.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  {errors.garderieId && <p className="text-xs text-destructive">{errors.garderieId.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Date</label>
                  <Input type="date" {...register('date')} />
                  {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Début</label>
                  <Input type="time" {...register('startTime')} />
                  {errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Fin</label>
                  <Input type="time" {...register('endTime')} />
                  {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Rôle</label>
                  <Input placeholder="ex: Éducateur(trice)" {...register('role')} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Taux horaire (CAD)</label>
                  <Input type="number" step="0.01" min="0" {...register('hourlyRate')} />
                  {errors.hourlyRate && <p className="text-xs text-destructive">{errors.hourlyRate.message as any}</p>}
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm text-muted-foreground">Notes</label>
                  <textarea
                    {...register('notes')}
                    className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                    {createMutation.isPending ? 'Création...' : 'Créer'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { reset(); setOpenCreate(false); }}>Annuler</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
