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

  /**
   * Fase 4 UX: descarga con progreso real usando fetch + ReadableStream.
   *
   * <p>El backend ya envia {@code Content-Length} (cuando se conoce). El
   * cliente acumula bytes leidos del {@code ReadableStream} y llama a
   * {@code onProgress} despues de cada chunk. El archivo final se materializa
   * como un solo {@code Blob} y se descarga via un anchor temporal.</p>
   *
   * <p>Diferencia con {@code window.location.href}:
   * <ul>
   *   <li>Hay barra de progreso real.</li>
   *   <li>El usuario no sale de la SPA.</li>
   *   <li>Se puede cancelar via {@link AbortController}.</li>
   * </ul>
   * Contra: el navegador no muestra el dialogo "Donde guardar". Usar
   * {@code window.showSaveFilePicker} cuando este disponible si se quiere
   * esa UX (ver descarga-simple.component).</p>
   *
   * @param downloadUrl URL absoluta devuelta por {@link #createSession}.
   * @param suggestedFileName nombre sugerido si el header
   *        {@code Content-Disposition} no esta.
   * @param onProgress callback con {@code loaded} y {@code total} (-1 si no
   *        se conoce).
   * @param signal opcional para cancelar.
   */
  async downloadWithProgress(
    downloadUrl: string,
    suggestedFileName: string,
    onProgress: (loaded: number, total: number) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const response = await fetch(downloadUrl, { signal });
    if (!response.ok) {
      throw { status: response.status, statusText: response.statusText };
    }
    const totalHeader = response.headers.get('Content-Length');
    const total = totalHeader ? Number(totalHeader) : -1;
    const cd = response.headers.get('Content-Disposition') ?? '';
    const fileName = parseFileNameFromContentDisposition(cd) ?? suggestedFileName;

    if (!response.body) {
      const blob = await response.blob();
      onProgress(blob.size, blob.size);
      triggerBrowserDownload(blob, fileName);
      return;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loaded += value.length;
        onProgress(loaded, total);
      }
    }
    const buf = concatChunks(chunks, loaded);
    const blob = new Blob([buf], { type: response.headers.get('Content-Type') ?? 'application/octet-stream' });
    onProgress(loaded, total > 0 ? total : loaded);
    triggerBrowserDownload(blob, fileName);
  }
}

function concatChunks(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function parseFileNameFromContentDisposition(header: string): string | null {
  if (!header) return null;
  // filename*=UTF-8''encoded
  const starMatch = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (starMatch) {
    try { return decodeURIComponent(starMatch[1].trim()); } catch { /* fallthrough */ }
  }
  const plain = header.match(/filename\s*=\s*"?([^";]+)"?/i);
  if (plain) return plain[1].trim();
  return null;
}

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try { document.body.removeChild(a); } catch (e) { /* ignore */ }
    URL.revokeObjectURL(url);
  }, 200);
}
