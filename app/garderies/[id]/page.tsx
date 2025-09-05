// app/garderies/[id]/page.tsx - Garderie Detail (read-only)
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Loader2, Mail, MapPin } from 'lucide-react';

import { ProtectedRoute, protectionConfigs } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { GarderieEntity, JobOfferEntity, JobApplicationEntity } from '@/types/api';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { CANADIAN_PROVINCES } from '@/lib/constants';
import { toast } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateUserDto, UpdateGarderieDto, UserEntity } from '@/types/api';
import { updateGarderieSchema } from '@/lib/validations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function GarderieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const { data: garderie, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.garderies.detail(id),
    enabled: Boolean(id),
    queryFn: async () => apiClient.getGarderieById(id),
  });

  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClient, setNewClient] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });

  const form = useForm<z.infer<typeof updateGarderieSchema>>({
    resolver: zodResolver(updateGarderieSchema),
    values: garderie
      ? {
          id: garderie.id,
          name: garderie.name,
          address: garderie.address || '',
          email: garderie.email || '',
          region: garderie.region || '',
          isActive: garderie.isActive,
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationKey: ['garderies', 'update', id],
    mutationFn: async (payload: UpdateGarderieDto) => apiClient.updateGarderie(id, payload),
    onSuccess: async () => {
      toast.success('Garderie mise à jour');
      await queryClient.invalidateQueries({ queryKey: queryKeys.garderies.detail(id) });
      await refetch();
      setEditing(false);
    },
    onError: (e: any) => toast.error(e?.message || 'Échec de la mise à jour'),
  });

  const { data: offers } = useQuery({
    queryKey: queryKeys.jobOffers.list({ garderieId: id, page: 1, limit: 10 }),
    enabled: Boolean(id),
    queryFn: () => apiClient.getJobOffers({ garderieId: id, page: 1, limit: 10 }),
    staleTime: 60_000,
  });

  const { data: clients } = useQuery({
    queryKey: queryKeys.users.list({ role: 'client', limit: 100 }),
    enabled: Boolean(id),
    queryFn: () => apiClient.getUsers({ role: 'client', page: 1, limit: 100 }),
    staleTime: 60_000,
  });

  const assignMutation = useMutation({
    mutationKey: ['users', 'assign', id],
    mutationFn: async (payload: { userId: string }) => apiClient.updateUser(payload.userId, { garderieId: id }),
    onSuccess: async () => {
      toast.success('Utilisateur assigné');
      await queryClient.invalidateQueries({ queryKey: queryKeys.garderies.detail(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all as any });
      setOpenAssign(false);
      setSelectedUserId('');
    },
    onError: (e: any) => toast.error(e?.message || "Échec de l'assignation"),
  });

  const createClientMutation = useMutation({
    mutationKey: ['users', 'create', 'client', id],
    mutationFn: async (payload: CreateUserDto) => apiClient.createUser(payload),
    onSuccess: async () => {
      toast.success('Client créé et assigné');
      await queryClient.invalidateQueries({ queryKey: queryKeys.garderies.detail(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all as any });
      setOpenAssign(false);
      setCreatingClient(false);
      setNewClient({ firstName: '', lastName: '', email: '', phone: '', password: '' });
    },
    onError: (e: any) => toast.error(e?.message || 'Échec de création'),
  });

  const { data: applications } = useQuery({
    queryKey: queryKeys.applications.list({ garderieId: id, page: 1, limit: 10 }),
    enabled: Boolean(id),
    queryFn: () => apiClient.getApplications({ garderieId: id, page: 1, limit: 10 }),
    staleTime: 60_000,
  });

  return (
    <ProtectedRoute {...protectionConfigs.adminOnly}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/garderies')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Garderie</h1>
              <p className="text-muted-foreground">Détails et activités récentes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rafraîchir'}
            </Button>
            <Button size="sm" onClick={() => { setEditing((e) => !e); if (!editing && garderie) form.reset(); }}>
              {editing ? 'Annuler' : 'Modifier'}
            </Button>
          </div>
        </div>

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
                <p className="text-sm text-destructive">{(error as Error)?.message || "Échec du chargement de la garderie."}</p>
              </div>
            ) : garderie ? (
              editing ? (
                <form
                  onSubmit={form.handleSubmit(async (data) => {
                    const payload: UpdateGarderieDto = {
                      name: data.name,
                      email: data.email || undefined,
                      address: data.address || undefined,
                      region: data.region || undefined,
                      isActive: data.isActive,
                    };
                    await updateMutation.mutateAsync(payload);
                  })}
                  className="grid gap-4 md:grid-cols-2"
                >
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Nom</label>
                    <Input {...form.register('name')} />
                    {form.formState.errors.name && (
                      <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Région</label>
                    <select
                      {...form.register('region')}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Sélectionner...</option>
                      {CANADIAN_PROVINCES.map((r) => (
                        <option key={r.code} value={r.code}>{r.name}</option>
                      ))}
                    </select>
                    {form.formState.errors.region && (
                      <p className="text-xs text-destructive">{form.formState.errors.region.message as any}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Email</label>
                    <Input type="email" {...form.register('email')} />
                    {form.formState.errors.email && (
                      <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Adresse</label>
                    <Input {...form.register('address')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Active</label>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4" checked={form.watch('isActive')}
                        onChange={(e) => form.setValue('isActive', e.target.checked, { shouldDirty: true })} />
                      <span className="text-sm text-muted-foreground">Activer/Désactiver la garderie</span>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { form.reset(); setEditing(false); }}>Annuler</Button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Nom</div>
                    <div className="font-medium">{garderie.name}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Région</div>
                    <div className="font-medium">{garderie.region || '—'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" /> {garderie.email || '—'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Adresse</div>
                    <div className="font-medium flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" /> {garderie.address || '—'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Statut</div>
                    <StatusBadge status={garderie.isActive ? 'active' : 'inactive'} size="sm" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Créée le</div>
                    <div className="font-medium">{garderie.createdAt ? format(new Date(garderie.createdAt), 'dd MMM yyyy', { locale: fr }) : '—'}</div>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <div className="text-sm text-muted-foreground">Utilisateurs</div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {(() => {
                        const assigned = (garderie.users && garderie.users.length > 0)
                          ? garderie.users
                          : (clients?.data || []).filter((u) => u.garderie?.id === id);
                        return assigned.length ? (
                          assigned.map((u) => (
                            <span key={u.id} className="rounded bg-muted px-2 py-0.5">
                              {u.firstName} {u.lastName} · {u.role}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">Aucun utilisateur</span>
                        );
                      })()}
                    </div>
                    <div className="pt-2">
                      <Dialog open={openAssign} onOpenChange={setOpenAssign}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">Assigner un utilisateur</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[560px]">
                          <DialogHeader>
                            <DialogTitle>Assigner un client à cette garderie</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium">Sélectionner un client existant</label>
                              <select
                                className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                              >
                                <option value="">— Choisir —</option>
                                {(clients?.data || []).map((u) => (
                                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} · {u.email}</option>
                                ))}
                              </select>
                              <div className="flex justify-end pt-2">
                                <Button size="sm" onClick={() => selectedUserId && assignMutation.mutate({ userId: selectedUserId })} disabled={!selectedUserId || assignMutation.isPending}>
                                  {assignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assigner'}
                                </Button>
                              </div>
                            </div>
                            <div className="border-t pt-3">
                              <label className="inline-flex items-center gap-2 text-sm font-medium">
                                <input type="checkbox" className="h-4 w-4" checked={creatingClient} onChange={(e) => setCreatingClient(e.target.checked)} />
                                Ou créer un nouveau client
                              </label>
                              {creatingClient && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                  <div>
                                    <label className="text-sm font-medium">Prénom</label>
                                    <Input value={newClient.firstName} onChange={(e) => setNewClient(v => ({ ...v, firstName: e.target.value }))} />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Nom</label>
                                    <Input value={newClient.lastName} onChange={(e) => setNewClient(v => ({ ...v, lastName: e.target.value }))} />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">E-mail</label>
                                    <Input type="email" value={newClient.email} onChange={(e) => setNewClient(v => ({ ...v, email: e.target.value }))} />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Téléphone</label>
                                    <Input value={newClient.phone} onChange={(e) => setNewClient(v => ({ ...v, phone: e.target.value }))} />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="text-sm font-medium">Mot de passe</label>
                                    <Input type="password" value={newClient.password} onChange={(e) => setNewClient(v => ({ ...v, password: e.target.value }))} />
                                  </div>
                                  <div className="sm:col-span-2 flex justify-end">
                                    <Button
                                      size="sm"
                                      onClick={() => createClientMutation.mutate({
                                        firstName: newClient.firstName,
                                        lastName: newClient.lastName,
                                        email: newClient.email,
                                        phone: newClient.phone,
                                        password: newClient.password,
                                        role: 'client',
                                        garderieId: id,
                                      })}
                                      disabled={!newClient.firstName || !newClient.lastName || !newClient.email || !newClient.password || createClientMutation.isPending}
                                    >
                                      {createClientMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer et assigner'}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              )
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dernières offres</CardTitle>
            </CardHeader>
            <CardContent>
              {offers?.data?.length ? (
                <div className="space-y-3">
                  {offers.data.map((o) => (
                    <div key={o.id} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{o.title}</div>
                        <div className="text-muted-foreground truncate">
                          {o.startDate ? format(new Date(o.startDate), 'dd MMM', { locale: fr }) : '—'}
                          {' → '}
                          {o.endDate ? format(new Date(o.endDate), 'dd MMM', { locale: fr }) : '—'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={o.status === 'published' ? 'published' : o.status === 'closed' || o.status === 'archived' ? 'inactive' : 'draft'} size="sm" />
                        <Link href={`/job-offers/${o.id}/view`} className="text-primary hover:underline">Voir</Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Aucune offre récente</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dernières candidatures</CardTitle>
            </CardHeader>
            <CardContent>
              {applications?.data?.length ? (
                <div className="space-y-3">
                  {applications.data.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{a.remplacant?.user?.firstName} {a.remplacant?.user?.lastName}</div>
                        <div className="text-muted-foreground truncate">{a.jobOffer?.title || '—'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={a.status === 'accepted' ? 'approved' : a.status === 'rejected' || a.status === 'canceled' ? 'rejected' : 'pending'} size="sm" />
                        <Link href={`/applications`} className="text-primary hover:underline">Détails</Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Aucune candidature récente</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
