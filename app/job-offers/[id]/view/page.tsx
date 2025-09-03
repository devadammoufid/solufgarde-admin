// app/job-offers/[id]/view/page.tsx - View Offer (read-only)
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { ProtectedRoute, protectionConfigs } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';

export default function ViewOfferPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const { data: offer, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.jobOffers.detail(id),
    enabled: Boolean(id),
    queryFn: async () => apiClient.getJobOfferById(id),
  });

  return (
    <ProtectedRoute {...protectionConfigs.adminOrClient}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/job-offers')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Offre</h1>
              <p className="text-muted-foreground">Aperçu détaillé de l'offre</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rafraîchir'}
            </Button>
            <Button size="sm" onClick={() => router.push(`/job-offers/${id}`)}>Modifier</Button>
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
                <p className="text-sm text-destructive">{(error as Error)?.message || "Échec du chargement de l'offre."}</p>
              </div>
            ) : offer ? (
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
            ) : null}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

