import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

/**
 * DTO mostrado al usuario antes de pedir contrasena.
 * Coincide con `ActivationPreviewDto` del backend.
 */
export interface ActivationPreview {
  email_masked: string;
  missing_fields: string[];
  expires_at: string;
  first_name?: string;
}

/**
 * Payload que enviamos a `POST /api/v1/auth/activate`. Solo los campos
 * declarados como `missing_fields` se rellenan; el backend ignora los
 * que ya tiene.
 */
export interface ActivationProfile {
  firstname?: string;
  lastname?: string;
  phone?: string;
  pais?: string;
  documento_tipo?: string;
  documento_numero?: string;
  departamento?: string;
}

export interface ActivationRequest {
  token: string;
  new_password: string;
  confirm_password: string;
  profile?: ActivationProfile;
}

export interface ActivationAuthResponse {
  token: string;
  refreshToken: string;
  needsProfileCompletion: boolean;
}

export interface ErrorBody {
  status: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Servicio de cliente HTTP para las rutas de activacion (provisionamiento
 * via ERP/CRM) y cambio forzado de contrasena.
 *
 * <ul>
 *   <li>{@link preview}: valida el token antes de mostrar el formulario.</li>
 *   <li>{@link activate}: setea password definitiva + completa perfil.</li>
 *   <li>{@link changePassword}: cambia password para usuarios con
 *       must_change=true (post-login forzado).</li>
 * </ul>
 */
@Injectable({ providedIn: 'root' })
export class ActivationService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/auth`;

  preview(token: string): Observable<ActivationPreview> {
    const params = new URLSearchParams({ token }).toString();
    return this.http
      .get<ActivationPreview>(`${this.base}/activate/preview?${params}`)
      .pipe(catchError(this.toBusinessError));
  }

  activate(request: ActivationRequest): Observable<ActivationAuthResponse> {
    return this.http
      .post<ActivationAuthResponse>(`${this.base}/activate`, request)
      .pipe(catchError(this.toBusinessError));
  }

  changePassword(current: string | null, next: string): Observable<{ status: string; message: string }> {
    return this.http
      .post<{ status: string; message: string }>(`${this.base}/change-password`, {
        current_password: current ?? '',
        new_password: next,
      })
      .pipe(catchError(this.toBusinessError));
  }

  private toBusinessError(err: HttpErrorResponse) {
    const body: ErrorBody | undefined = err.error;
    const message =
      body?.message ??
      (typeof err.error === 'string' ? err.error : null) ??
      `Error ${err.status}`;
    const wrapped = new Error(message) as Error & { code?: string; details?: Record<string, unknown> };
    wrapped.code = body?.code;
    wrapped.details = body?.details;
    return throwError(() => wrapped);
  }
}
