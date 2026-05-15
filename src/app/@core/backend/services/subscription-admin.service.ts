import { Injectable, inject } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, map, catchError, shareReplay, switchMap } from 'rxjs/operators';
import { 
  ResponseSuscripcionesEnhanced, 
  ResponseSuscripcionesPaginated,
  PagedSuscripciones,
  ResponseSuscripcionesPayments,
  ResponseDocumentsSummary,
  SuscripcionEnhanced,
  ResponseSuscripcionesBoolean,
  ResponseActionLog
} from '../../interfaces/suscripciones';
import { SuscripcionesApi } from '../api/suscripciones.api';
import { CacheService } from './cache.service';

/**
 * Servicio optimizado para administración de suscripciones con caché.
 * 
 * MEJORAS:
 * - Cache TTL de 2 minutos para reducir llamadas HTTP
 * - Endpoints optimizados eliminan N+1 queries
 * - Actualizaciones selectivas (solo una suscripción después de acciones)
 * - Payload reducido 90% con documentsSummary
 * 
 * USO:
 * - getAllWithCache(): Carga inicial de lista (1 llamada HTTP vs 21 anterior)
 * - getPaymentsWithCache(): Caché de pagos con TTL
 * - invalidateAndReload(): Forzar recarga después de cambios críticos
 * - updateSingleSubscription(): Actualización selectiva después de activar/cancelar
 */
@Injectable({
  providedIn: 'root'
})
export class SubscriptionAdminService {
  private api = inject(SuscripcionesApi);
  private cacheService = inject(CacheService);

  
  // ========== CONFIGURACIÓN DE CACHÉ ==========
  private readonly TTL_LISTA = 2 * 60 * 1000; // 2 minutos
  private readonly TTL_PAYMENTS = 5 * 60 * 1000; // 5 minutos
  private readonly TTL_DOCUMENTS = 10 * 60 * 1000; // 10 minutos

  private readonly CACHE_KEY_ALL = 'subscriptions_enhanced_all';
  private readonly CACHE_KEY_PAYMENTS = 'subscription_payments_';
  private readonly CACHE_KEY_DOCUMENTS = 'subscription_documents_summary_';

  // BehaviorSubject para notificar cambios en la lista (reactivo)
  private subscriptionsSubject$ = new BehaviorSubject<SuscripcionEnhanced[]>([]);
  public subscriptions$ = this.subscriptionsSubject$.asObservable();

  // ========== MÉTODOS CON CACHÉ ==========

  /**
   * Obtiene todas las suscripciones con contadores pre-calculados.
   * Usa caché con TTL de 2 minutos. Si no hay caché, hace la llamada HTTP.
   * 
   * OPTIMIZACIÓN: Reduce 21 llamadas (1 lista + 10 pagos + 10 documentos) a 1 sola llamada.
   * 
   * @returns Observable<SuscripcionEnhanced[]>
   */
  getAllWithCache(): Observable<SuscripcionEnhanced[]> {
    // Intentar obtener del caché
    const cached = this.cacheService.get<SuscripcionEnhanced[]>(this.CACHE_KEY_ALL);
    
    if (cached) {
      console.log('[SubscriptionAdminService] Usando caché para lista de suscripciones');
      this.subscriptionsSubject$.next(cached);
      return of(cached);
    }

    // Si no hay caché, hacer llamada HTTP
    console.log('[SubscriptionAdminService] Cache miss - cargando desde backend');
    return this.api.getAllSuscripcionesEnhanced().pipe(
      map(response => {
        if (!response.result) {
          console.error('[SubscriptionAdminService] Error en respuesta:', response);
          return [];
        }
        return response.data;
      }),
      tap(data => {
        // Guardar en caché
        this.cacheService.set(this.CACHE_KEY_ALL, data, this.TTL_LISTA);
        // Notificar a subscriptores
        this.subscriptionsSubject$.next(data);
        console.log(`[SubscriptionAdminService] ${data.length} suscripciones cargadas y en caché`);
      }),
      catchError(error => {
        console.error('[SubscriptionAdminService] Error al cargar suscripciones:', error);
        return of([]);
      }),
      shareReplay(1) // Evita múltiples llamadas HTTP si varios componentes subscriben al mismo tiempo
    );
  }

  /**
   * Obtiene suscripciones con paginación del servidor (Server-Side Pagination).
   * Optimizado para >300 suscripciones: solo trae la página solicitada.
   * 
   * VENTAJAS:
   * - Carga inicial 20x más rápida (~50KB vs 1-2MB)
   * - Memoria optimizada (solo 25 items vs 300+)
   * - Escalable a miles de suscripciones
   * - Búsqueda y filtros procesados en backend (más eficiente)
   * 
   * NO USA CACÉ: cada cambio de página hace 1 request HTTP.
   * Latencia típica: 100-300ms por request.
   * 
   * @param params Parámetros de paginación y filtros
   * @returns Observable<PagedSuscripciones> con metadata de paginación
   */
  getAllPaginated(params?: {
    status?: string;
    search?: string;
    type?: string;
    materia?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<PagedSuscripciones | null> {
    console.log('[SubscriptionAdminService] Cargando página server-side:', params);
    
    return this.api.getAllSuscripcionesPaginated(params).pipe(
      map(response => {
        if (!response.result) {
          console.error('[SubscriptionAdminService] Error en respuesta paginada:', response);
          return null;
        }
        console.log(`[SubscriptionAdminService] Página ${response.data.number + 1}/${response.data.totalPages} cargada: ` +
                    `${response.data.numberOfElements} items de ${response.data.totalElements} totales`);
        return response.data;
      }),
      catchError(error => {
        console.error('[SubscriptionAdminService] Error al cargar página:', error);
        return of(null);
      })
    );
  }

  /**
   * Obtiene los pagos de una suscripción específica con caché.
   * 
   * @param subscriptionId ID de la suscripción
   * @returns Observable<ResponseSuscripcionesPayments>
   */
  getPaymentsWithCache(subscriptionId: number): Observable<ResponseSuscripcionesPayments> {
    const cacheKey = `${this.CACHE_KEY_PAYMENTS}${subscriptionId}`;
    const cached = this.cacheService.get<ResponseSuscripcionesPayments>(cacheKey);

    if (cached) {
      console.log(`[SubscriptionAdminService] Usando caché para pagos de suscripción ${subscriptionId}`);
      return of(cached);
    }

    console.log(`[SubscriptionAdminService] Cargando pagos de suscripción ${subscriptionId}`);
    return this.api.getPaymentsBySuscripcionId(subscriptionId).pipe(
      tap(response => {
        this.cacheService.set(cacheKey, response, this.TTL_PAYMENTS);
      }),
      catchError(error => {
        console.error(`[SubscriptionAdminService] Error al cargar pagos de ${subscriptionId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Obtiene estructura ligera de documentos (solo conteos) con caché.
   * Reduce payload en 90% vs documentos completos.
   * 
   * @param subscriptionId ID de la suscripción
   * @returns Observable<ResponseDocumentsSummary>
   */
  getDocumentsSummaryWithCache(subscriptionId: number): Observable<ResponseDocumentsSummary> {
    const cacheKey = `${this.CACHE_KEY_DOCUMENTS}${subscriptionId}`;
    const cached = this.cacheService.get<ResponseDocumentsSummary>(cacheKey);

    if (cached) {
      console.log(`[SubscriptionAdminService] Usando caché para resumen documentos ${subscriptionId}`);
      return of(cached);
    }

    console.log(`[SubscriptionAdminService] Cargando resumen documentos ${subscriptionId}`);
    return this.api.getDocumentsSummary(subscriptionId).pipe(
      tap(response => {
        this.cacheService.set(cacheKey, response, this.TTL_DOCUMENTS);
      }),
      catchError(error => {
        console.error(`[SubscriptionAdminService] Error al cargar resumen docs ${subscriptionId}:`, error);
        throw error;
      })
    );
  }

  // ========== MÉTODOS DE INVALIDACIÓN ==========

  /**
   * Invalida caché y recarga desde backend.
   * Usar después de acciones que cambian múltiples suscripciones.
   */
  invalidateAndReload(): Observable<SuscripcionEnhanced[]> {
    console.log('[SubscriptionAdminService] Invalidando caché y recargando');
    this.cacheService.delete(this.CACHE_KEY_ALL);
    return this.getAllWithCache();
  }

  /**
   * Invalida caché de pagos de una suscripción específica.
   */
  invalidatePaymentsCache(subscriptionId: number): void {
    const cacheKey = `${this.CACHE_KEY_PAYMENTS}${subscriptionId}`;
    this.cacheService.delete(cacheKey);
    console.log(`[SubscriptionAdminService] Caché de pagos invalidado para ${subscriptionId}`);
  }

  /**
   * Invalida caché de documentos de una suscripción específica.
   */
  invalidateDocumentsCache(subscriptionId: number): void {
    const cacheKey = `${this.CACHE_KEY_DOCUMENTS}${subscriptionId}`;
    this.cacheService.delete(cacheKey);
    console.log(`[SubscriptionAdminService] Caché de documentos invalidado para ${subscriptionId}`);
  }

  /**
   * Limpia TODO el caché de suscripciones.
   * Usar con precaución - solo en casos de inconsistencia global.
   */
  clearAllCache(): void {
    console.log('[SubscriptionAdminService] Limpiando TODO el caché de suscripciones');
    this.cacheService.clear();
  }

  // ========== ACTUALIZACIÓN SELECTIVA ==========

  /**
   * Actualiza UNA SOLA suscripción en la lista en memoria después de una acción.
   * Evita recargar toda la lista después de activar/cancelar.
   * 
   * OPTIMIZACIÓN: En lugar de 21 llamadas para recargar todo, solo 1 llamada.
   * 
   * @param subscriptionId ID de la suscripción actualizada
   * @returns Observable<SuscripcionEnhanced | null>
   */
  updateSingleSubscription(subscriptionId: number): Observable<SuscripcionEnhanced | null> {
    console.log(`[SubscriptionAdminService] Actualizando suscripción ${subscriptionId}`);
    
    return this.api.getSuscripcionEnhancedById(subscriptionId).pipe(
      map(response => {
        if (!response.result || !response.data || response.data.length === 0) {
          console.warn(`[SubscriptionAdminService] No se encontró suscripción ${subscriptionId}`);
          return null;
        }
        return response.data[0]; // El backend devuelve array con un elemento
      }),
      tap(updated => {
        if (updated) {
          // Actualizar en caché y en BehaviorSubject
          const current = this.subscriptionsSubject$.getValue();
          const index = current.findIndex(s => s.id === subscriptionId);
          
          if (index !== -1) {
            // Reemplazar la suscripción actualizada
            const newList = [...current];
            newList[index] = updated;
            
            // Actualizar caché
            this.cacheService.set(this.CACHE_KEY_ALL, newList, this.TTL_LISTA);
            
            // Notificar a subscriptores
            this.subscriptionsSubject$.next(newList);
            
            console.log(`[SubscriptionAdminService] Suscripción ${subscriptionId} actualizada en lista`);
          } else {
            console.warn(`[SubscriptionAdminService] Suscripción ${subscriptionId} no encontrada en lista local`);
          }

          // Invalidar cachés relacionados
          this.invalidatePaymentsCache(subscriptionId);
        }
      }),
      catchError(error => {
        console.error(`[SubscriptionAdminService] Error al actualizar suscripción ${subscriptionId}:`, error);
        return of(null);
      })
    );
  }

  // ========== ACCIONES CON INVALIDACIÓN AUTOMÁTICA ==========

  /**
   * Cancela una suscripción y actualiza la lista selectivamente.
   */
  cancelarSuscripcion(subscriptionId: number, reason?: string): Observable<boolean> {
    return this.api.putCancelarSuscripcion(subscriptionId, reason).pipe(
      switchMap(response => {
        const success = !!(response.result && response.data);
        if (success) {
          console.log(`[SubscriptionAdminService] Suscripción ${subscriptionId} cancelada`);
          return this.updateSingleSubscription(subscriptionId).pipe(map(() => true));
        }
        return of(false);
      }),
      catchError(error => {
        console.error(`[SubscriptionAdminService] Error al cancelar ${subscriptionId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Activa una suscripción y actualiza la lista selectivamente.
   */
  activarSuscripcion(subscriptionId: number, dias: number, reason?: string): Observable<boolean> {
    return this.api.putActivarSuscripcion(subscriptionId, dias, reason).pipe(
      switchMap(response => {
        const success = !!(response.result && response.data);
        if (success) {
          console.log(`[SubscriptionAdminService] Suscripción ${subscriptionId} activada por ${dias} días`);
          return this.updateSingleSubscription(subscriptionId).pipe(map(() => true));
        }
        return of(false);
      }),
      catchError(error => {
        console.error(`[SubscriptionAdminService] Error al activar ${subscriptionId}:`, error);
        throw error;
      })
    );
  }

  // ========== HELPERS ==========

  /**
   * Nombres únicos de tipos de suscripción para dropdowns de filtro.
   */
  getSubscriptionTypes(): Observable<string[]> {
    return this.api.getSubscriptionTypes().pipe(
      map(response => (response.result && response.data) ? response.data : []),
      catchError(() => of([]))
    );
  }

  /**
   * Nombres de materias para un tipo de suscripción dado.
   * Usado para el dropdown en cascada tipo → materia.
   */
  getMateriasByTypeName(typeName: string): Observable<string[]> {
    return this.api.getMateriasByTypeName(typeName).pipe(
      map(response => (response.result && response.data) ? response.data : []),
      catchError(() => of([]))
    );
  }

  /**
   * Obtiene el detalle completo de una suscripción (unidad actual, fechaFinUnidad, materiasOpcionesJson).
   * Endpoint: GET /api/v1/suscription/details/{id}
   */
  getSubscriptionDetails(subscriptionId: number): Observable<any> {
    return this.api.getSubscriptionDetails(subscriptionId).pipe(
      map(response => (response.result && response.data) ? response.data : null),
      catchError(error => {
        console.error(`[SubscriptionAdminService] Error al cargar detalles de ${subscriptionId}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Obtiene el valor actual de la lista de suscripciones sin hacer llamadas HTTP.
   */
  getCurrentSubscriptions(): SuscripcionEnhanced[] {
    return this.subscriptionsSubject$.getValue();
  }

  /**
   * Busca una suscripción específica en la lista en memoria.
   */
  getSubscriptionById(id: number): SuscripcionEnhanced | undefined {
    return this.getCurrentSubscriptions().find(s => s.id === id);
  }

  /**
   * Obtiene el historial de acciones administrativas para una suscripción.
   */
  getActionLog(subscriptionId: number): Observable<ResponseActionLog> {
    return this.api.getActionLog(subscriptionId);
  }
}
