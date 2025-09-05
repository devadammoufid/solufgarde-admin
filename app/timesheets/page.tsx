// app/timesheets/page.tsx - Timesheets (innovative admin view)
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Check, Clock, Download, Loader2, Pencil, X, CalendarDays } from 'lucide-react';
import Link from 'next/link';

import { ProtectedRoute, protectionConfigs } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { TimesheetEntity, GarderieEntity, UpdateTimesheetDto } from '@/types/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';

function minutesToHours(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

function getFlags(t: TimesheetEntity) {
  const flags: string[] = [];
  if (!t.checkOutAt) flags.push('Sortie manquante');
  if (t.checkInAt && t.checkOutAt) {
    const mins = Math.max(0, differenceInMinutes(parseISO(t.checkOutAt), parseISO(t.checkInAt)));
    if (mins < 120) flags.push('Trop court');
    if (mins > 12 * 60) flags.push('Très long');
    if (t.checkOutAt.slice(0,10) !== (t.date || '').slice(0,10)) flags.push('Nuit');
    if (mins > 8 * 60) flags.push('Heures supp.');
  }
  return flags;
}

export default function TimesheetsPage() {
  const queryClient = useQueryClient();
  const [garderieId, setGarderieId] = useState('');
  const [verified, setVerified] = useState<'all' | 'yes' | 'no'>('all');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<TimesheetEntity | null>(null);

  // Garderies
  const { data: garderies } = useQuery({
    queryKey: queryKeys.garderies.list({ page: 1, limit: 100, isActive: true }),
    queryFn: () => apiClient.getGarderies({ page: 1, limit: 100, isActive: true }),
    staleTime: 5 * 60_000,
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.timesheets.list({ garderieId: garderieId || undefined, verified: verified === 'all' ? undefined : verified === 'yes', dateFrom: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined, dateTo: toDate ? format(toDate, 'yyyy-MM-dd') : undefined, page: 1, limit: 200 }),
    queryFn: () => apiClient.getTimesheets({ garderieId: garderieId || undefined, verified: verified === 'all' ? undefined : verified === 'yes', dateFrom: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined, dateTo: toDate ? format(toDate, 'yyyy-MM-dd') : undefined, page: 1, limit: 200 }),
    staleTime: 60_000,
  });

  const rows = data?.data ?? [];
  const totals = useMemo(() => {
    const minutes = rows.reduce((acc, t) => {
      if (!t.checkInAt || !t.checkOutAt) return acc;
      return acc + Math.max(0, differenceInMinutes(parseISO(t.checkOutAt), parseISO(t.checkInAt)));
    }, 0);
    const verifiedCount = rows.filter((t) => t.isVerified).length;
    return { minutes, verifiedCount, count: rows.length };
  }, [rows]);

  const columns = useMemo<ColumnDef<TimesheetEntity>[]>(() => [
    {
      id: 'remplacant',
      header: 'Remplaçant',
      cell: ({ row }) => {
        const u = row.original.remplacant?.user;
        return u ? `${u.firstName} ${u.lastName}` : '—';
      },
    },
    {
      id: 'flags',
      header: 'Anomalies',
      cell: ({ row }) => {
        const flags = getFlags(row.original);
        return flags.length ? (
          <div className="flex flex-wrap gap-1">
            {flags.map((f, i) => (
              <span key={i} className="text-[10px] rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5">{f}</span>
            ))}
          </div>
        ) : <span className="text-[11px] text-muted-foreground">—</span>;
      },
    },
    {
      id: 'garderie',
      header: 'Garderie',
      cell: ({ row }) => row.original.garderie?.name || '—',
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ getValue }) => {
        const v = getValue<string | undefined>();
        if (!v) return '—';
        try { return format(new Date(v), 'dd MMM yyyy', { locale: fr }); } catch { return v as string; }
      },
    },
    {
      id: 'checkin',
      header: 'Entrée',
      cell: ({ row }) => row.original.checkInAt ? format(new Date(row.original.checkInAt), 'HH:mm') : '—',
    },
    {
      id: 'checkout',
      header: 'Sortie',
      cell: ({ row }) => row.original.checkOutAt ? format(new Date(row.original.checkOutAt), 'HH:mm') : '—',
    },
    {
      id: 'hours',
      header: 'Heures',
      cell: ({ row }) => {
        const { checkInAt, checkOutAt } = row.original;
        if (!checkInAt || !checkOutAt) return '—';
        const mins = Math.max(0, differenceInMinutes(parseISO(checkOutAt), parseISO(checkInAt)));
        return minutesToHours(mins);
      },
    },
    {
      id: 'verified',
      header: 'Vérifié',
      cell: ({ row }) => <StatusBadge status={row.original.isVerified ? 'approved' : 'pending'} size="sm" />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditing(row.original); setEditOpen(true); }}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Modifier
          </Button>
          {row.original.isVerified ? (
            <Button variant="outline" size="sm" onClick={() => onVerify(row.original.id, false)}>
              <X className="h-3.5 w-3.5 mr-1" /> Annuler
            </Button>
          ) : (
            <Button size="sm" onClick={() => onVerify(row.original.id, true)}>
              <Check className="h-3.5 w-3.5 mr-1" /> Valider
            </Button>
          )}
        </div>
      ),
    },
  ], []);

  const verifyMutation = useMutation({
    mutationKey: ['timesheets', 'verify'],
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => apiClient.updateTimesheet(id, { isVerified }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.timesheets.all });
    },
    onError: (e: any) => toast.error(e?.message || 'Échec de la mise à jour'),
  });

  const onVerify = (id: string, isVerified: boolean) => verifyMutation.mutate({ id, isVerified });

  const updateMutation = useMutation({
    mutationKey: ['timesheets', 'update'],
    mutationFn: async ({ id, data }: { id: string; data: UpdateTimesheetDto }) => apiClient.updateTimesheet(id, data),
    onSuccess: async () => {
      toast.success('Feuille de temps mise à jour');
      await queryClient.invalidateQueries({ queryKey: queryKeys.timesheets.all });
      setEditOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message || 'Échec de la mise à jour'),
  });

  return (
    <ProtectedRoute {...protectionConfigs.adminOrClient}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Feuilles de temps</h1>
            <p className="text-muted-foreground">Approuvez, corrigez et exportez les heures travaillées.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Pay period presets: last 14 days, previous 14 days */}
            <Button variant="outline" size="sm" onClick={() => { const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 13); setFromDate(start); setToDate(end); }}>Derniers 14 jours</Button>
            <Button variant="outline" size="sm" onClick={() => { const end = new Date(); end.setDate(end.getDate() - 14); const start = new Date(); start.setDate(end.getDate() - 13); setFromDate(start); setToDate(end); }}>14 jours précédents</Button>
            {/* Quick ranges */}
            <Button variant="outline" size="sm" onClick={() => { const now = new Date(); const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1); const end = new Date(start); end.setDate(start.getDate() + 6); setFromDate(start); setToDate(end); }}>
              <CalendarDays className="h-4 w-4 mr-2" /> Cette semaine
            </Button>
            <Button variant="outline" size="sm" onClick={() => { const now = new Date(); const start = new Date(now); start.setDate(now.getDate() - now.getDay() - 6); const end = new Date(start); end.setDate(start.getDate() + 6); setFromDate(start); setToDate(end); }}>
              Semaine dernière
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const rowsFiltered = rows.filter((t) => verified === 'all' ? true : (verified === 'yes' ? t.isVerified : !t.isVerified));
              const header = ['Garderie','Remplaçant','Date','Entrée','Sortie','Heures','Vérifié','Anomalies'];
              const csv = [header.join(',')].concat(rowsFiltered.map(t => {
                const u = t.remplacant?.user;
                const vals = [
                  t.garderie?.name || '',
                  u ? `${u.firstName} ${u.lastName}` : '',
                  t.date || '',
                  t.checkInAt ? format(new Date(t.checkInAt), 'HH:mm') : '',
                  t.checkOutAt ? format(new Date(t.checkOutAt), 'HH:mm') : '',
                  (t.checkInAt && t.checkOutAt) ? minutesToHours(Math.max(0, differenceInMinutes(parseISO(t.checkOutAt), parseISO(t.checkInAt)))) : '',
                  t.isVerified ? 'oui' : 'non',
                  getFlags(t).join('|'),
                ];
                return vals.map(v => `"${String(v).replace(/"/g, '""')}` + '"').join(',');
              })).join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'timesheets.csv';
              link.click();
              URL.revokeObjectURL(url);
            }}>
              <Download className="h-4 w-4 mr-2" /> Exporter CSV
            </Button>
            <Button size="sm" onClick={async () => {
              const visible = rows.filter((t) => verified === 'all' ? true : (verified === 'yes' ? t.isVerified : !t.isVerified));
              const unverified = visible.filter((t) => !t.isVerified);
              if (!unverified.length) { toast.success('Aucune fiche à valider'); return; }
              for (const t of unverified) {
                await verifyMutation.mutateAsync({ id: t.id, isVerified: true });
              }
              toast.success(`${unverified.length} fiches validées`);
            }}>
              Valider visibles
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rafraîchir'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Feuilles de temps</CardTitle>
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
              <DatePicker date={fromDate} onChange={setFromDate} placeholder="Du" />
              <DatePicker date={toDate} onChange={setToDate} placeholder="Au" />
              <select
                value={verified}
                onChange={(e) => setVerified(e.target.value as any)}
                className="w-full sm:w-40 rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">Tous</option>
                <option value="yes">Vérifiés</option>
                <option value="no">Non vérifiés</option>
              </select>
              <div className="text-xs text-muted-foreground px-2 py-2">
                {totals.count} fiches • {minutesToHours(totals.minutes)} au total • {totals.verifiedCount} vérifiées
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">{(error as Error)?.message || "Échec du chargement des feuilles de temps."}</p>
              </div>
            ) : (
              <DataTable<TimesheetEntity, unknown>
                columns={columns}
                data={rows}
                searchable
                filterable
                pagination
                pageSize={10}
              />
            )}
          </CardContent>
        </Card>

        {/* Totaux par garderie */}
        {rows.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Synthèse par garderie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-3">
                {Object.entries(rows.reduce((acc: Record<string, { m: number; v: number }>, t) => {
                  const key = t.garderie?.name || '—';
                  if (!acc[key]) acc[key] = { m: 0, v: 0 };
                  if (t.checkInAt && t.checkOutAt) acc[key].m += Math.max(0, differenceInMinutes(parseISO(t.checkOutAt), parseISO(t.checkInAt)));
                  if (t.isVerified) acc[key].v += 1;
                  return acc;
                }, {})).map(([name, val]) => (
                  <div key={name} className="rounded border p-3 text-xs">
                    <div className="font-medium mb-1 truncate">{name}</div>
                    <div className="text-muted-foreground">Heures: {minutesToHours(val.m)}</div>
                    <div className="text-muted-foreground">Vérifiées: {val.v}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ready to invoice */}
        {rows.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Prêt à facturer</CardTitle>
              <Button size="sm" onClick={() => {
                const verifiedOnly = rows.filter((t) => t.isVerified);
                const header = ['Garderie','Remplaçant','Date','Entrée','Sortie','Heures'];
                const csv = [header.join(',')].concat(verifiedOnly.map(t => {
                  const u = t.remplacant?.user;
                  const vals = [
                    t.garderie?.name || '',
                    u ? `${u.firstName} ${u.lastName}` : '',
                    t.date || '',
                    t.checkInAt ? format(new Date(t.checkInAt), 'HH:mm') : '',
                    t.checkOutAt ? format(new Date(t.checkOutAt), 'HH:mm') : '',
                    (t.checkInAt && t.checkOutAt) ? minutesToHours(Math.max(0, differenceInMinutes(parseISO(t.checkOutAt), parseISO(t.checkInAt)))) : '',
                  ];
                  return vals.map(v => `"${String(v).replace(/"/g, '""')}` + '"').join(',');
                })).join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'ready-to-invoice.csv';
                link.click();
                URL.revokeObjectURL(url);
              }}>Exporter</Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-3">
                {Object.entries(rows.filter((t)=>t.isVerified).reduce((acc: Record<string, number>, t) => {
                  const key = t.garderie?.name || '—';
                  const mins = (t.checkInAt && t.checkOutAt) ? Math.max(0, differenceInMinutes(parseISO(t.checkOutAt), parseISO(t.checkInAt))) : 0;
                  acc[key] = (acc[key] || 0) + mins;
                  return acc;
                }, {})).map(([name, m]) => (
                  <div key={name} className="rounded border p-3 text-xs">
                    <div className="font-medium mb-1 truncate">{name}</div>
                    <div className="text-muted-foreground">Heures vérifiées: {minutesToHours(m)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditing(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier</DialogTitle>
            </DialogHeader>
            {editing ? (
              <div className="grid gap-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Date</div>
                    <div>{editing.date ? format(new Date(editing.date), 'yyyy-MM-dd') : '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Garderie</div>
                    <div>{editing.garderie?.name || '—'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Entrée</div>
                    <Input type="time" defaultValue={editing.checkInAt ? format(new Date(editing.checkInAt), 'HH:mm') : ''}
                      onChange={(e) => setEditing({ ...editing, checkInAt: `${editing.date}T${e.target.value}:00` })} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Sortie</div>
                    <Input type="time" defaultValue={editing.checkOutAt ? format(new Date(editing.checkOutAt), 'HH:mm') : ''}
                      onChange={(e) => setEditing({ ...editing, checkOutAt: e.target.value ? `${editing.date}T${e.target.value}:00` : undefined })} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Notes</div>
                  <textarea defaultValue={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                    className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />
                    {(editing.checkInAt && editing.checkOutAt) ? minutesToHours(Math.max(0, differenceInMinutes(parseISO(editing.checkOutAt), parseISO(editing.checkInAt)))) : '—'}
                  </div>
                  <div>
                    <StatusBadge status={editing.isVerified ? 'approved' : 'pending'} size="sm" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => { setEditOpen(false); setEditing(null); }}>Annuler</Button>
                  <Button size="sm" disabled={!editing || updateMutation.isPending}
                    onClick={() => editing && updateMutation.mutate({ id: editing.id, data: {
                      checkInAt: editing.checkInAt,
                      checkOutAt: editing.checkOutAt ?? null,
                      notes: (editing.notes ?? '').length ? editing.notes : null,
                    }})}
                  >
                    {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
                    Enregistrer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-4 w-4 animate-spin" /></div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
