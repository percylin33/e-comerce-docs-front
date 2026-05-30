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
}
