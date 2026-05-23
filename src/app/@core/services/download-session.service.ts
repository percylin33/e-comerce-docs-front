import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Fase 3b: cliente del flujo unificado de descargas.
 *
 * <p>El back expone tres endpoints (ver {@code DownloadSessionController}):</p>
 *
 * <ul>
 *   <li>{@code POST /api/v1/downloads/sessions} (auth) -&gt; crea sesion.</li>
 *   <li>{@code GET  /api/v1/downloads/{id}/manifest} (publico) -&gt; metadata.</li>
 *   <li>{@code GET  /api/v1/downloads/{id}/file} (publico) -&gt; stream single-use.</li>
 * </ul>
 *
 * <p>El consumidor recomendado:</p>
 *
 * <ol>
 *   <li>{@link #createSession} para obtener {@code downloadUrl} + metadatos.</li>
 *   <li>Mostrar tamano/MIME al usuario (opcional, ya vienen en la respuesta).</li>
 *   <li>Disparar la descarga via {@code location.href = downloadUrl} o
 *       {@code fetch + ReadableStream} (Fase 4 UX).</li>
 * </ol>
 */
export type DownloadIntent = 'DOWNLOAD' | 'PREVIEW';

export interface CreateSessionRequest {
  documentId: number;
  intent?: DownloadIntent;
}

export interface CreatedSession {
  sessionId: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string;
  downloadUrl: string;
  expiresAt: string;
  intent: DownloadIntent;
}

export interface SessionManifest {
  sessionId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class DownloadSessionService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/downloads`;

  /** Crea una sesion. Requiere JWT en el interceptor habitual. */
  createSession(req: CreateSessionRequest): Observable<CreatedSession> {
    return this.http.post<CreatedSession>(`${this.baseUrl}/sessions`, {
      documentId: req.documentId,
      intent: req.intent ?? 'DOWNLOAD',
    });
  }

  /** Lee metadatos de la sesion sin transferir bytes (Fase 4 UX). */
  getManifest(sessionId: string): Observable<SessionManifest> {
    return this.http.get<SessionManifest>(`${this.baseUrl}/${sessionId}/manifest`);
  }

  /**
   * Devuelve la URL del archivo. Llama desde el componente con
   * {@code window.location.href = url} o con {@code fetch} para barra de
   * progreso (Fase 4).
   */
  buildFileUrl(sessionId: string): string {
    return `${this.baseUrl}/${sessionId}/file`;
  }

  /**
   * Atajo: crea la sesion y devuelve directamente la URL para el navegador.
   * Util para componentes que solo quieren "descarga simple".
   */
  createAndGetUrl(documentId: number, intent: DownloadIntent = 'DOWNLOAD'): Observable<CreatedSession> {
    return this.createSession({ documentId, intent });
  }
}
