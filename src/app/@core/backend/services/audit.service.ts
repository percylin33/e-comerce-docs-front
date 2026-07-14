import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AuditLogDto {
  id: number;
  actorId?: number | null;
  actorEmail?: string | null;
  action: string;
  targetTable: string;
  targetId: number;
  payload?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
  severity?: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | string | null;
  category?: string | null;
  timestamp?: string | null;
  timestampTs?: string | null;
}

export interface AuditTopEntry {
  key: string;
  count: number;
}

export interface AuditHistogramPoint {
  bucket: string;
  count: number;
}

export interface AuditSummary {
  totalEvents24h: number;
  totalEvents7d: number;
  criticalEvents24h: number;
  errorEvents24h: number;
  warnEvents24h: number;
  failedLogins24h: number;
  bruteForce24h: number;
  activeSessions: number;
  integrityFindings7d: number;
  integrityCritical7d: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  topActions: AuditTopEntry[];
  topActors: AuditTopEntry[];
  hourlyHistogram: AuditHistogramPoint[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
}

export interface LoginAttemptDto {
  id: number;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  attemptedAt: string;
}

export type ActiveSessionStatus = 'ONLINE' | 'IDLE' | 'EXPIRED' | 'REVOKED';

export interface ActiveSessionDto {
  id: number;
  userId: number;
  /** Email del usuario (viene del LEFT JOIN con users en el backend). */
  userEmail?: string;
  /** Nombre completo del usuario, ya armado en backend (firstname + lastname). */
  userFullName?: string;
  jti: string;
  issuedAt: string;
  expiresAt?: string;
  lastSeenAt?: string;
  ipAddress?: string;
  userAgent?: string;
  revokedAt?: string;
  revokedBy?: string;
  revokeReason?: string;

  /** Estado derivado en backend para semaforizar la UI. */
  status?: ActiveSessionStatus;
  /** True si status === 'ONLINE'. Se incluye para conveniencia de la UI. */
  online?: boolean;
  /** Segundos transcurridos desde lastSeenAt (null si nunca se vio). */
  lastSeenAgoSeconds?: number;
}

export interface IntegrityCheckDto {
  id: number;
  runId: string;
  checkType: string;
  targetTable: string;
  targetId?: number;
  severity: string;
  message?: string;
  details?: string;
  createdAt: string;
}

export interface IntegrityRunSummary {
  runId: string;
  trigger: string;
  findings: number;
  skippedPlanificacion: number;
  skippedNoCategory: number;
  durationMs: number;
}

export interface AuditLogsFilter {
  search?: string;
  action?: string;
  category?: string;
  severity?: string;
  actorEmail?: string;
  actorId?: number;
  targetTable?: string;
  targetId?: number;
  ipAddress?: string;
  correlationId?: string;
  categories?: string[];
  severities?: string[];
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

// ========================================================================
// Audit del modulo Creadores (Mejora v1.1) — DTOs y filtros
// ========================================================================

/**
 * Item de audit enriquecido para el modulo Creadores. Incluye los campos
 * parseados del payload (creatorId, paymentId, documentId, commission,
 * delta) cuando estan presentes.
 */
export interface CreatorAuditEventDto {
  id: number;
  action: string;
  targetId: number;
  targetTable: string;
  actorId?: number | null;
  actorEmail?: string | null;
  severity?: string | null;
  category?: string | null;
  timestampTs?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  payload?: string | null;
  creatorId?: number | null;
  paymentId?: number | null;
  documentId?: number | null;
  commissionAmount?: number | null;
  commissionDelta?: number | null;
}

export interface CreatorAuditFilter {
  actionPrefix?: string;
  severities?: string[];
  creatorId?: number;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

/**
 * Cliente HTTP del modulo de Auditoria. Todos los endpoints requieren
 * autenticacion JWT con rol ADMIN o SUPADMIN (validado server-side via
 * @PreAuthorize).
 */
@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/admin/audit`;

  getSummary(): Observable<AuditSummary> {
    return this.http.get<AuditSummary>(`${this.baseUrl}/summary`);
  }

  listLogs(filter: AuditLogsFilter = {}): Observable<PageResponse<AuditLogDto>> {
    let params = new HttpParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v)) {
        v.forEach(val => (params = params.append(k, String(val))));
      } else {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<PageResponse<AuditLogDto>>(`${this.baseUrl}/logs`, { params });
  }

  getLog(id: number): Observable<AuditLogDto> {
    return this.http.get<AuditLogDto>(`${this.baseUrl}/logs/${id}`);
  }

  getByCorrelation(correlationId: string, limit = 500): Observable<AuditLogDto[]> {
    return this.http.get<AuditLogDto[]>(
      `${this.baseUrl}/logs/by-correlation/${correlationId}`,
      { params: new HttpParams().set('limit', String(limit)) },
    );
  }

  exportCsv(filter: AuditLogsFilter = {}): Observable<Blob> {
    let params = new HttpParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v)) v.forEach(val => (params = params.append(k, String(val))));
      else params = params.set(k, String(v));
    });
    return this.http.get(`${this.baseUrl}/export`, { params, responseType: 'blob' });
  }

  listLoginAttempts(email?: string, page = 0, size = 50): Observable<PageResponse<LoginAttemptDto>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (email) params = params.set('email', email);
    return this.http.get<PageResponse<LoginAttemptDto>>(`${this.baseUrl}/security/login-attempts`, { params });
  }

  listSessions(
    includeRevoked = false,
    includeExpired = false,
    page = 0,
    size = 50,
  ): Observable<PageResponse<ActiveSessionDto>> {
    const params = new HttpParams()
      .set('includeRevoked', String(includeRevoked))
      .set('includeExpired', String(includeExpired))
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<PageResponse<ActiveSessionDto>>(`${this.baseUrl}/security/sessions`, { params });
  }

  revokeSession(id: number, reason: string = 'manual'): Observable<ActiveSessionDto> {
    return this.http.post<ActiveSessionDto>(`${this.baseUrl}/security/sessions/${id}/revoke`, { reason });
  }

  listIntegrityChecks(page = 0, size = 50): Observable<PageResponse<IntegrityCheckDto>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<PageResponse<IntegrityCheckDto>>(`${this.baseUrl}/security/integrity`, { params });
  }

  runIntegrityNow(): Observable<IntegrityRunSummary> {
    return this.http.post<IntegrityRunSummary>(`${this.baseUrl}/security/integrity/run`, {});
  }

  getCatalog(): Observable<{ categories: string[]; severities: string[] }> {
    return this.http.get<{ categories: string[]; severities: string[] }>(`${this.baseUrl}/categories`);
  }

  // ========================================================================
  // Audit del modulo Creadores (Mejora v1.1)
  // ========================================================================

  /**
   * Lista todas las acciones del modulo Creadores (category=CREATOR + action
   * LIKE 'CREATOR_%'). Filtros opcionales.
   */
  listCreatorActions(filter: CreatorAuditFilter = {}): Observable<PageResponse<CreatorAuditEventDto>> {
    let params = this.toParams(filter);
    return this.http.get<PageResponse<CreatorAuditEventDto>>(`${this.baseUrl}/creators`, { params });
  }

  /**
   * Timeline de un creador: union de eventos donde aparece como actor o como
   * creatorId en el payload.
   */
  getCreatorTimeline(creatorId: number, filter: { from?: string; to?: string; page?: number; size?: number } = {}):
      Observable<PageResponse<CreatorAuditEventDto>> {
    let params = this.toParams(filter);
    return this.http.get<PageResponse<CreatorAuditEventDto>>(
      `${this.baseUrl}/creators/${creatorId}/timeline`, { params });
  }

  /**
   * Eventos de comisiones (EARNED, RECOMPUTED, BACKFILL_BATCH). Filtrable por
   * creatorId parseado del payload.
   */
  listCreatorCommissionEvents(filter: CreatorAuditFilter = {}):
      Observable<PageResponse<CreatorAuditEventDto>> {
    let params = this.toParams(filter);
    return this.http.get<PageResponse<CreatorAuditEventDto>>(`${this.baseUrl}/commissions`, { params });
  }

  /**
   * Exporta todas las comisiones de creadores como CSV (Blob).
   * Usado por el boton "Exportar CSV" del componente.
   */
  exportCreatorCommissionsCsv(filter: { from?: string; to?: string } = {}): Observable<Blob> {
    let params = this.toParams(filter);
    return this.http.get(`${this.baseUrl}/commissions/export.csv`, {
      params,
      responseType: 'blob',
    });
  }

  /** Helper privado: serializa un filter a HttpParams ignorando nulls/vacios. */
  private toParams(filter: Record<string, any>): HttpParams {
    let params = new HttpParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v)) {
        v.forEach(val => (params = params.append(k, String(val))));
      } else {
        params = params.set(k, String(v));
      }
    });
    return params;
  }
}

// ============================================================================
//  MVP Conciliación: cliente para los nuevos endpoints de /admin/payments/*
// ============================================================================

export type ReconcileStatus =
  | 'MATCHED'
  | 'DISCREPANCY'
  | 'NOT_FOUND'
  | 'ERROR'
  | 'SKIPPED';

export interface ReconcileResult {
  status: ReconcileStatus;
  gateway: string;
  orderId: string;
  captureId?: string | null;
  discrepancies: string[];
  gatewaySnapshot: Record<string, any>;
  localSnapshot: Record<string, any>;
  auditLogId?: number | null;
  reason?: string | null;
  verifiedAt?: string | null;
  paymentStatusInBD?: string | null;
}

export interface DiscrepancyRow {
  id: number;
  eventType: string;
  gateway: string;
  orderId: string;
  paymentId?: number | null;
  amount?: number | null;
  currency?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: string | null;
  detectedAt: string;
  resolutionStatus: 'OPEN' | 'RESOLVED' | string;
  resolvedAt?: string | null;
  resolvedByAdminId?: number | null;
  resolutionNote?: string | null;
}

export interface DiscrepancyListResponse {
  data: DiscrepancyRow[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  summary: {
    openTotal: number;
    resolvedTotal: number;
    resolvedToday: number;
  };
}

export interface DiscrepancyFilter {
  gateway?: 'CULQI' | 'PAYPAL';
  status?: 'OPEN' | 'RESOLVED';
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export interface WebhookHealth {
  available: boolean;
  reason?: string;
  windowHours?: number;
  received?: number;
  processed?: number;
  failed?: number;
  invalidSignature?: number;
  avgProcessLatencyMs?: number;
  lastFailed?: {
    eventId?: string;
    endpointPath?: string;
    lastError?: string;
    receivedAt?: string;
    attempts?: number;
  } | null;
}

/**
 * Cliente HTTP para los nuevos endpoints de conciliación expuestos por
 * {@code PaymentAdminController}.
 */
@Injectable({ providedIn: 'root' })
export class ReconciliationApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/admin/payments`;

  /**
   * Verifica on-demand un payment contra su pasarela. Devuelve estructura
   * con status (MATCHED|DISCREPANCY|NOT_FOUND|ERROR|SKIPPED), snapshots
   * BD vs pasarela, y discrepancias.
   */
  reconcileNow(paymentId: number): Observable<{ data: ReconcileResult; success: boolean }> {
    return this.http.post<{ data: ReconcileResult; success: boolean }>(
      `${this.baseUrl}/${paymentId}/reconcile`,
      {},
    );
  }

  /**
   * Lista paginada de discrepancias detectadas por los jobs de conciliación.
   */
  listDiscrepancies(filter: DiscrepancyFilter = {}):
    Observable<{ data: DiscrepancyListResponse; success: boolean }> {
    let params = new HttpParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      params = params.set(k, String(v));
    });
    return this.http.get<{ data: DiscrepancyListResponse; success: boolean }>(
      `${this.baseUrl}/reconciliation/discrepancies`,
      { params },
    );
  }

  /**
   * Marca una discrepancia como RESUELTA. La nota es obligatoria (min 10
   * chars) y queda auditada.
   */
  resolveDiscrepancy(auditLogId: number, note: string):
    Observable<{ data: any; success: boolean }> {
    return this.http.post<{ data: any; success: boolean }>(
      `${this.baseUrl}/reconciliation/discrepancies/${auditLogId}/resolve`,
      { note },
    );
  }

  /**
   * Métricas de salud del webhook Culqi en la ventana indicada (default 24h).
   */
  webhookHealth(hours: number = 24):
    Observable<{ data: WebhookHealth; success: boolean }> {
    const params = new HttpParams().set('hours', String(hours));
    return this.http.get<{ data: WebhookHealth; success: boolean }>(
      `${this.baseUrl}/reconciliation/webhook-health`,
      { params },
    );
  }
}
