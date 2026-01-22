import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { SuscripcionesApi } from '../../@core/backend/api/suscripciones.api';

@Injectable({ providedIn: 'root' })
export class MembershipService {
  // Cache TTL (milliseconds)
  private cacheTtlMs = 5 * 60 * 1000; // 5 minutes

  // summary cache (single-user summary)
  private summaryCache: { obs: Observable<any>, ts: number } | null = null;

  // per-subscription caches with timestamps
  private paymentsCache: Map<number, { obs: Observable<any[]>, ts: number }> = new Map();
  private documentsCache: Map<number, { obs: Observable<any>, ts: number }> = new Map();
  private detailsCache: Map<number, { obs: Observable<any>, ts: number }> = new Map();

  constructor(private suscripcionesApi: SuscripcionesApi) { }

  // Carga y cachea la lista de suscripciones (liviana) para el usuario
  loadSummaryForUser(userId: number): Observable<any> {
    console.debug('[MembershipService] loadSummaryForUser', userId);
    if (this.summaryCache && !this.isExpired(this.summaryCache.ts)) {
      return this.summaryCache.obs;
    }
    const obs = this.suscripcionesApi.getMembershipsByUser(userId).pipe(
      map((resp: any) => {
        const rows = resp && resp.result ? resp.data : [];
        const grouped: { [key: string]: any[] } = {};
        (rows || []).forEach((s: any) => {
          const key = s.nombre || s.membresiaNombre || s.subscriptionTypeName || s.name || 'Membresía';
          const item = {
            id: s.subscriptionId || s.id,
            nombre: s.nombre || s.membresiaNombre || s.subscriptionTypeName || s.name,
            estado: s.estado || s.status,
            fechaInicio: s.fechaInicio || s.startDate,
            fechaFin: s.fechaFin || s.endDate,
            counts: s.counts || { payments: 0, documents: 0 },
            links: s.links || {
              payments: `/api/v1/memberships/${s.subscriptionId || s.id}/payments`,
              details: `/api/v1/memberships/${s.subscriptionId || s.id}/details`,
              documents: `/api/v1/memberships/${s.subscriptionId || s.id}/documents`
            },
            raw: s
          };
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(item);
        });
        return grouped;
      }),
      shareReplay(1)
    );
    this.summaryCache = { obs, ts: Date.now() };
    return obs;
  }

  // Obtener pagos por subscriptionId (usa endpoint dedicado)
  getPaymentsForSubscription(subscriptionId: number): Observable<any[]> {
    if (!subscriptionId) return of([]);
    const cached = this.paymentsCache.get(subscriptionId);
    if (cached && !this.isExpired(cached.ts)) return cached.obs;

    const obs = this.suscripcionesApi.getMembershipPayments(subscriptionId).pipe(
      map((resp: any) => (resp.result ? resp.data : [])),
      shareReplay(1)
    );
    this.paymentsCache.set(subscriptionId, { obs, ts: Date.now() });
    return obs;
  }

  // Obtener detalles por subscriptionId
  getDetailsForSubscription(subscriptionId: number): Observable<any> {
    if (!subscriptionId) return of(null);
    const cached = this.detailsCache.get(subscriptionId);
    if (cached && !this.isExpired(cached.ts)) return cached.obs;

    const obs = this.suscripcionesApi.getMembershipDetails(subscriptionId).pipe(
      map((resp: any) => (resp.result ? resp.data : null)),
      shareReplay(1)
    );
    this.detailsCache.set(subscriptionId, { obs, ts: Date.now() });
    return obs;
  }

  // Obtener documentos por subscriptionId (delegar endpoint documents)
  getDocumentsForSubscription(subscriptionId: number): Observable<any> {
    if (!subscriptionId) return of({});
    const cached = this.documentsCache.get(subscriptionId);
    if (cached && !this.isExpired(cached.ts)) return cached.obs;

    const obs = this.suscripcionesApi.getMembershipDocuments(subscriptionId).pipe(
      map((resp: any) => (resp.result ? resp.data : {})),
      shareReplay(1)
    );
    this.documentsCache.set(subscriptionId, { obs, ts: Date.now() });
    return obs;
  }

  // Utility: check expiry
  private isExpired(ts: number) {
    return (Date.now() - ts) > this.cacheTtlMs;
  }

  // Invalidate caches (useful after mutations)
  invalidateSummary() { this.summaryCache = null; }
  invalidateSubscriptionCaches(subscriptionId?: number) {
    if (subscriptionId) {
      this.paymentsCache.delete(subscriptionId);
      this.documentsCache.delete(subscriptionId);
      this.detailsCache.delete(subscriptionId);
    } else {
      this.paymentsCache.clear();
      this.documentsCache.clear();
      this.detailsCache.clear();
    }
  }

  clearAllCaches() { this.invalidateSummary(); this.invalidateSubscriptionCaches(); }
}
