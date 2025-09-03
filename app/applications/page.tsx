
// app/applications/page.tsx - Candidates (Applications)
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

import { ProtectedRoute, protectionConfigs } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { JobApplicationEntity, ApplicationStatus } from '@/types/api';
import { Check, Eye, Loader2, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [garderieId, setGarderieId] = useState('');
  const [jobOfferId, setJobOfferId] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [selected, setSelected] = useState<JobApplicationEntity | null>(null);
  const [open, setOpen] = useState(false);
  const [readyOnly, setReadyOnly] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState<null | 'accepted' | 'rejected'>(null);
  const [actionNote, setActionNote] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [minExp, setMinExp] = useState<string>('');
  const queryClient = useQueryClient();

  // Initialize filters from URL on first render
  useEffect(() => {
    const s = (searchParams.get('status') || '') as ApplicationStatus | '';
    const g = searchParams.get('garderieId') || '';
    const o = searchParams.get('jobOfferId') || '';
    const f = searchParams.get('from') || '';
    const r = searchParams.get('ready') === '1';
    const l = searchParams.get('lang') || '';
    const e = searchParams.get('minExp') || '';
    if (s) setStatus(s);
    if (g) setGarderieId(g);
    if (o) setJobOfferId(o);
    if (f) setFromDate(new Date(f + 'T00:00:00'));
    if (r) setReadyOnly(true);
    if (l) setLangFilter(l);
    if (e) setMinExp(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushFiltersToUrl = (next?: Partial<Record<string, string>>) => {
    const params = new URLSearchParams(searchParams.toString());
    const entries: Array<[string, string | undefined]> = [
      ['status', status || undefined],
      ['garderieId', garderieId || undefined],
      ['jobOfferId', jobOfferId || undefined],
      ['from', fromDate ? `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}` : undefined],
      ['ready', readyOnly ? '1' : undefined],
      ['lang', langFilter || undefined],
      ['minExp', minExp || undefined],
    ];
    for (const [k, v] of entries) {
      if (v) params.set(k, v); else params.delete(k);
    }
    if (next) {
      for (const [k, v] of Object.entries(next)) {
        if (v) params.set(k, v); else params.delete(k);
      }
    }
    router.replace(`/applications?${params.toString()}`);
  };

  const { data: apps, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.applications.list({ status: status || undefined, garderieId: garderieId || undefined, jobOfferId: jobOfferId || undefined, page: 1, limit: 50, dateFrom: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined } as any),
    queryFn: async () => apiClient.getApplications({ status: status || undefined, garderieId: garderieId || undefined, jobOfferId: jobOfferId || undefined, page: 1, limit: 50 }),
    staleTime: 60_000,
  });

  const statusMutation = useMutation({
    mutationKey: ['applications', 'update-status'],
    mutationFn: async ({ id, status, note }: { id: string; status: ApplicationStatus; note?: string }) => apiClient.updateApplication(id, { status, note }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
      setActionOpen(false);
      setActionType(null);
      setActionNote('');
    },
  });

  // Load garderies and offers for filters
  const { data: garderies } = useQuery({
    queryKey: queryKeys.garderies.list({ page: 1, limit: 100 }),
    queryFn: () => apiClient.getGarderies({ page: 1, limit: 100 }),
    staleTime: 5 * 60_000,
  });
  const { data: offers } = useQuery({
    queryKey: queryKeys.jobOffers.list({ page: 1, limit: 100 }),
    queryFn: () => apiClient.getJobOffers({ page: 1, limit: 100 }),
    staleTime: 5 * 60_000,
  });

  const columns = useMemo<ColumnDef<JobApplicationEntity>[]>(() => [
    {
      id: 'candidate',
      header: 'Candidat',
      cell: ({ row }) => {
        const u = row.original.remplacant?.user;
        const name = u ? `${u.firstName} ${u.lastName}` : '—';
        return (
          <div className="flex flex-col">
            <span className="font-medium flex items-center gap-2">{name}
              {/* Aging badge */}
              {row.original.appliedAt && (
                <span className="text-[10px] rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                  {Math.max(0, Math.floor((Date.now() - new Date(row.original.appliedAt).getTime()) / (24*60*60*1000)))} j
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {u?.email && <span className="text-xs text-muted-foreground">{u.email}</span>}
              {row.original.remplacant?.profileCompleted && (
                <span className="text-[10px] rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5">Prêt</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'garderie',
      header: 'Garderie',
      cell: ({ row }) => row.original.garderie?.name || '—',
    },
    {
      id: 'job',
      header: 'Offre',
      cell: ({ row }) => {
        const o = row.original.jobOffer;
        return o ? (
          <Link href={`/job-offers/${o.id}`} className="text-sm hover:underline">
            {o.title}
          </Link>
        ) : '—';
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue<ApplicationStatus>();
        const map: Record<ApplicationStatus, any> = {
          pending: 'pending',
          accepted: 'approved',
          rejected: 'rejected',
          canceled: 'cancelled',
        };
        return <StatusBadge status={map[s]} size="sm" />;
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
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const o = row.original.jobOffer;
        const s = row.original.status as ApplicationStatus;
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setSelected(row.original); setOpen(true); }}>
              <Eye className="h-3.5 w-3.5 mr-1" /> Voir
            </Button>
            {o && (
              <Link href={`/job-offers/${o.id}`} className="text-sm text-primary hover:underline self-center">Offre</Link>
            )}
            {s === 'pending' && (
              <>
                <Button size="sm" onClick={() => { setSelected(row.original); setActionType('accepted'); setActionOpen(true); }}>
                  <Check className="h-3.5 w-3.5 mr-1" /> Accepter
                </Button>
                <Button variant="destructive" size="sm" onClick={() => { setSelected(row.original); setActionType('rejected'); setActionOpen(true); }}>
                  <X className="h-3.5 w-3.5 mr-1" /> Refuser
                </Button>
              </>
            )}
            {s === 'accepted' && (
              <Link href="/schedules" className="text-sm text-primary hover:underline self-center">Planifier</Link>
            )}
          </div>
        );
      },
    },
  ], []);

  return (
    <ProtectedRoute {...protectionConfigs.adminOrClient}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Candidats</h1>
            <p className="text-muted-foreground">Consultez et filtrez les candidatures.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>Rafraîchir</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Build CSV from filtered rows
                const rows = (apps?.data ?? [])
                  .filter(a => readyOnly ? Boolean(a.remplacant?.profileCompleted) : true)
                  .filter(a => {
                    // Language filter
                    const langs = langFilter.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                    if (langs.length) {
                      const cl = (a.remplacant?.languages || []).map(s => (s || '').toLowerCase());
                      if (!langs.every(l => cl.includes(l))) return false;
                    }
                    const me = parseInt(minExp || '0', 10);
                    if (!isNaN(me) && me > 0) {
                      const ye = a.remplacant?.yearsOfExperience || 0;
                      if (ye < me) return false;
                    }
                    return true;
                  });
                const header = ['First Name','Last Name','Email','Region','Languages','Years','Garderie','Offer','Status','AppliedAt','DecisionAt'];
                const csv = [header.join(',')].concat(rows.map(a => {
                  const u = a.remplacant?.user;
                  const langs = (a.remplacant?.languages || []).join('|');
                  const vals = [
                    u?.firstName || '',
                    u?.lastName || '',
                    u?.email || '',
                    a.remplacant?.region || '',
                    langs,
                    String(a.remplacant?.yearsOfExperience ?? ''),
                    a.garderie?.name || '',
                    a.jobOffer?.title || '',
                    a.status || '',
                    a.appliedAt || '',
                    a.decisionAt || '',
                  ];
                  return vals.map(v => `"${String(v).replace(/"/g, '""')}` + '"').join(',');
                })).join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'applications.csv';
                link.click();
                URL.revokeObjectURL(url);
              }}
              disabled={!apps?.data?.length}
            >
              Exporter CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Candidatures</CardTitle>
            <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value as ApplicationStatus | ''); pushFiltersToUrl({ status: e.target.value || undefined }); }}
                className="w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="accepted">Acceptée</option>
                <option value="rejected">Refusée</option>
                <option value="canceled">Annulée</option>
              </select>

              <select
                value={garderieId}
                onChange={(e) => { setGarderieId(e.target.value); pushFiltersToUrl({ garderieId: e.target.value || undefined }); }}
                className="w-full sm:w-60 rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Toutes les garderies</option>
                {garderies?.data?.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>

              <select
                value={jobOfferId}
                onChange={(e) => { setJobOfferId(e.target.value); pushFiltersToUrl({ jobOfferId: e.target.value || undefined }); }}
                className="w-full sm:w-60 rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Toutes les offres</option>
                {offers?.data?.map((o) => (
                  <option key={o.id} value={o.id}>{o.title}</option>
                ))}
              </select>

              <div className="w-full sm:w-auto">
                <DatePicker date={fromDate} onChange={(d) => { setFromDate(d); pushFiltersToUrl({ from: d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : undefined }); }} placeholder="Depuis le" />
              </div>
              <label className="inline-flex items-center gap-2 text-sm px-2 py-2">
                <input type="checkbox" checked={readyOnly} onChange={(e) => { setReadyOnly(e.target.checked); pushFiltersToUrl({ ready: e.target.checked ? '1' : undefined }); }} />
                Prêt à travailler
              </label>
              <Input
                placeholder="Langues (ex: fr,en)"
                value={langFilter}
                onChange={(e) => { setLangFilter(e.target.value); pushFiltersToUrl({ lang: e.target.value || undefined }); }}
                className="w-full sm:w-48"
              />
              <Input
                type="number"
                min={0}
                placeholder="Exp. min (années)"
                value={minExp}
                onChange={(e) => { setMinExp(e.target.value); pushFiltersToUrl({ minExp: e.target.value || undefined }); }}
                className="w-full sm:w-40"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Chargement…</div>
            ) : isError ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">{(error as Error)?.message || "Échec du chargement des candidatures."}</p>
              </div>
            ) : (
              <DataTable<JobApplicationEntity, unknown>
                columns={columns}
                data={(apps?.data ?? [])
                  .filter(a => readyOnly ? Boolean(a.remplacant?.profileCompleted) : true)
                  .filter(a => {
                    const langs = langFilter.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                    if (langs.length) {
                      const cl = (a.remplacant?.languages || []).map(s => (s || '').toLowerCase());
                      if (!langs.every(l => cl.includes(l))) return false;
                    }
                    const me = parseInt(minExp || '0', 10);
                    if (!isNaN(me) && me > 0) {
                      const ye = a.remplacant?.yearsOfExperience || 0;
                      if (ye < me) return false;
                    }
                    return true;
                  })}
                searchable
                filterable
                pagination
                pageSize={10}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Candidat</DialogTitle>
            </DialogHeader>
            {selected ? (
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{selected.remplacant?.user?.firstName} {selected.remplacant?.user?.lastName}</div>
                  <StatusBadge status={selected.status === 'accepted' ? 'approved' : selected.status === 'rejected' || selected.status === 'canceled' ? 'rejected' : 'pending'} size="sm" />
                </div>
                {selected.remplacant?.user?.email && <div className="text-muted-foreground">{selected.remplacant.user.email}</div>}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Région</div>
                    <div>{selected.remplacant?.region || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Expérience</div>
                    <div>{selected.remplacant?.yearsOfExperience ?? '—'} ans</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Langues</div>
                    <div>{selected.remplacant?.languages?.join(', ') || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Mobilité</div>
                    <div>{selected.remplacant?.mobility ? 'Oui' : '—'}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Prêt à travailler</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.remplacant?.profileCompleted ? <span className="text-[10px] rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5">Profil complet</span> : <span className="text-[10px] rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5">Profil incomplet</span>}
                    {selected.remplacant?.resumeUrl ? <span className="text-[10px] rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5">CV</span> : <span className="text-[10px] rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5">CV manquant</span>}
                    {(selected.remplacant?.certifications?.length ?? 0) > 0 ? <span className="text-[10px] rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5">Certificats</span> : <span className="text-[10px] rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5">Certificats manquants</span>}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  {selected.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => statusMutation.mutate({ id: selected.id, status: 'accepted' })}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Accepter
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => statusMutation.mutate({ id: selected.id, status: 'rejected' })}>
                        <X className="h-3.5 w-3.5 mr-1" /> Refuser
                      </Button>
                    </>
                  )}
                  {selected.status === 'accepted' && (
                    <Link href="/schedules" className="text-sm text-primary hover:underline self-center">Créer un horaire</Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-4 w-4 animate-spin" /></div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={actionOpen} onOpenChange={(o) => { setActionOpen(o); if (!o) { setActionNote(''); setActionType(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionType === 'accepted' ? 'Accepter la candidature' : 'Refuser la candidature'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="text-muted-foreground">Optionnel: ajouter une note interne.</div>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Note"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setActionOpen(false); setActionNote(''); setActionType(null); }}>Annuler</Button>
                <Button size="sm" disabled={!selected || !actionType || statusMutation.isPending}
                  onClick={() => selected && actionType && statusMutation.mutate({ id: selected.id, status: actionType, note: actionNote || undefined })}>
                  {statusMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
                  Confirmer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
