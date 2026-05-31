// Email-link landing: canjea linkToken opaco por una sesion de descarga corta.
// Comparte el patron de feedback con documents-list/documentos:
//  - Boton bloqueado durante 'preparing' (POST /resolve) y 'downloading'
//    (ventana heuristica tras a.click()).
//  - Hint "Revisa tu barra de descargas" mientras el navegador transfiere.
//  - Cap de ventana proporcional al tamano (computeDownloadWindowMs).
import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import {
  NbToastrService,
  NbCardModule,
  NbSpinnerModule,
  NbButtonModule,
  NbIconModule,
} from '@nebular/theme';
import { Subscription, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { computeDownloadWindowMs } from '../../@core/services/download-window.util';

interface ResolvedSession {
  sessionId: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  downloadUrl: string;
  expiresAt: string;
  intent: string;
}

type FlowState = 'idle' | 'resolving' | 'ready' | 'error';
type DownloadButtonState = 'preparing' | 'downloading' | null;

@Component({
  selector: 'ngx-descarga-email',
  standalone: true,
  imports: [NbCardModule, NbSpinnerModule, NbButtonModule, NbIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="descarga-container">
      <div class="descarga-card">
        <nb-card>
          <nb-card-header class="state-header">
            <span
              class="state-icon"
              [attr.data-state]="iconStateAttr()"
              aria-hidden="true">
              @switch (iconStateAttr()) {
                @case ('error') {
                  <nb-icon icon="alert-triangle-outline"></nb-icon>
                }
                @case ('resolving') {
                  <nb-icon icon="loader-outline" class="spin"></nb-icon>
                }
                @case ('downloading') {
                  <nb-icon icon="loader-outline" class="spin"></nb-icon>
                }
                @case ('success') {
                  <nb-icon icon="checkmark-circle-2-outline"></nb-icon>
                }
                @default {
                  <nb-icon icon="cloud-download-outline"></nb-icon>
                }
              }
            </span>
            <h1 class="state-title">{{ headerForState() }}</h1>
          </nb-card-header>

          <nb-card-body
            role="status"
            aria-live="polite"
            [attr.aria-busy]="
              state === 'resolving' || downloadButtonState !== null
                ? 'true'
                : 'false'
            ">
            @if (state === 'resolving') {
              <div class="loading-content">
                <nb-spinner
                  size="large"
                  aria-label="Preparando tu descarga"></nb-spinner>
                <p class="loading-text" aria-hidden="true">
                  Preparando tu descarga...
                </p>
              </div>
            }

            @if (state === 'ready') {
              <div class="ready-content">
                @if (!downloadedOnce && downloadButtonState === null) {
                  <p class="loading-text">
                    Tu compra esta lista. Pulsa el boton para descargar el archivo.
                  </p>
                }

                @if (downloadedOnce && downloadButtonState === null) {
                  <p class="success-banner" role="status">
                    <nb-icon
                      icon="checkmark-circle-2-outline"
                      aria-hidden="true"></nb-icon>
                    <span>
                      Tu archivo ya se descargo. Si no aparecio, pulsa el boton
                      para volver a descargarlo.
                    </span>
                  </p>
                }

                @if (resolved) {
                  <div class="file-info">
                    <div class="file-name">{{ resolved.fileName }}</div>
                    @if (resolved.fileSize) {
                      <div class="file-size">
                        {{ formatFileSize(resolved.fileSize) }}
                      </div>
                    }
                  </div>
                }

                <button
                  nbButton
                  status="primary"
                  size="large"
                  class="download-button"
                  [class.is-downloading]="downloadButtonState !== null"
                  [disabled]="downloadButtonState !== null"
                  [attr.aria-busy]="downloadButtonState !== null"
                  [attr.aria-label]="
                    downloadButtonState === 'preparing'
                      ? 'Preparando tu descarga'
                      : downloadButtonState === 'downloading'
                        ? 'Descargando archivo'
                        : (downloadedOnce
                            ? 'Descargar de nuevo'
                            : 'Iniciar descarga')
                  "
                  (click)="startDownload()">
                  @if (downloadButtonState === null) {
                    <nb-icon icon="download-outline"></nb-icon>
                    <span>
                      {{
                        downloadedOnce
                          ? 'Descargar de nuevo'
                          : 'Iniciar descarga'
                      }}
                    </span>
                  } @else {
                    <span class="btn-spinner" aria-hidden="true"></span>
                    <span>
                      @switch (downloadButtonState) {
                        @case ('preparing') {
                          Preparando...
                        }
                        @case ('downloading') {
                          Descargando...
                        }
                      }
                    </span>
                  }
                </button>

                @if (downloadButtonState === 'downloading') {
                  <p
                    class="download-hint"
                    role="status"
                    aria-live="polite">
                    Revisa tu barra de descargas del navegador.
                  </p>
                }

                @if (downloadedOnce && downloadButtonState === null) {
                  <div class="action-buttons">
                    <button
                      nbButton
                      status="basic"
                      (click)="goHome()">
                      Ir al inicio
                    </button>
                  </div>
                }
              </div>
            }

            @if (state === 'error') {
              <div class="error-content">
                <p class="error-message">{{ errorMessage }}</p>
                <div class="action-buttons">
                  @if (canRetry) {
                    <button
                      nbButton
                      status="warning"
                      (click)="resolveLink()">
                      <nb-icon icon="refresh-outline"></nb-icon>
                      <span>Reintentar</span>
                    </button>
                  }
                  <button nbButton status="basic" (click)="goHome()">
                    Ir al inicio
                  </button>
                </div>
              </div>
            }
          </nb-card-body>
        </nb-card>
      </div>
    </div>
  `,
  styles: [
    `
      .descarga-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        min-height: 100dvh;
        padding: var(--space-4);
        background: var(--gradient-primary);
      }

      .descarga-card {
        max-width: 520px;
        width: 100%;
        box-shadow: var(--shadow-xl);
        border-radius: var(--radius-lg);
        overflow: hidden;
        animation: cardIn var(--dur-base) var(--ease-emphasized) both;
      }

      .state-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-6) var(--space-5) var(--space-4);
        text-align: center;
        border-bottom: 1px solid var(--color-border);
      }

      .state-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: var(--radius-pill);
        background: var(--color-primary-soft);
        color: var(--color-primary);
        transition:
          background-color var(--dur-base) var(--ease-standard),
          color var(--dur-base) var(--ease-standard);
      }

      .state-icon nb-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .state-icon[data-state='success'] {
        background: var(--color-success-100);
        color: var(--color-success-600);
      }

      .state-icon[data-state='error'] {
        background: var(--color-danger-100);
        color: var(--color-danger-600);
      }

      .state-icon[data-state='resolving'],
      .state-icon[data-state='downloading'] {
        background: var(--color-brand-100);
        color: var(--color-brand-600);
      }

      .state-title {
        margin: 0;
        font-size: var(--font-size-h3);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text);
        line-height: var(--line-height-snug);
      }

      .loading-content,
      .ready-content,
      .error-content {
        text-align: center;
        padding: var(--space-5) var(--space-4);
      }

      @media (min-width: 640px) {
        .loading-content,
        .ready-content,
        .error-content {
          padding: var(--space-6) var(--space-5);
        }
      }

      .loading-text {
        margin: var(--space-4) 0;
        font-size: var(--font-size-base);
        color: var(--color-text);
        line-height: var(--line-height-normal);
      }

      .success-banner {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0 auto var(--space-4);
        padding: var(--space-3) var(--space-4);
        background: var(--color-success-100);
        color: var(--color-success-600);
        border-radius: var(--radius-md);
        font-size: var(--font-size-body);
        line-height: var(--line-height-normal);
        text-align: left;
        max-width: 420px;
      }

      .success-banner nb-icon {
        flex-shrink: 0;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .file-info {
        margin: var(--space-4) auto;
        padding: var(--space-3) var(--space-4);
        background: var(--color-bg-subtle);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        max-width: 380px;
        text-align: left;
      }

      .file-name {
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--space-1);
        color: var(--color-text);
        word-break: break-word;
        font-size: var(--font-size-body);
      }

      .file-size {
        font-size: var(--font-size-caption);
        color: var(--color-text-muted);
      }

      .download-button {
        width: 100%;
        max-width: 320px;
        margin-top: var(--space-3);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
      }

      .download-button.is-downloading,
      .download-button:disabled {
        cursor: progress;
        opacity: 0.85;
      }

      .btn-spinner {
        width: 1rem;
        height: 1rem;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        display: inline-block;
        animation: spin 0.8s linear infinite;
        flex-shrink: 0;
      }

      .download-hint {
        margin: var(--space-3) auto 0;
        max-width: 320px;
        font-size: var(--font-size-caption);
        color: var(--color-text-muted);
        line-height: var(--line-height-normal);
      }

      .error-message {
        margin: 0 0 var(--space-5);
        padding: var(--space-3) var(--space-4);
        background: var(--color-danger-100);
        border-left: 3px solid var(--color-danger);
        border-radius: var(--radius-sm);
        color: var(--color-danger-600);
        text-align: left;
        font-size: var(--font-size-body);
        line-height: var(--line-height-normal);
      }

      .action-buttons {
        display: flex;
        gap: var(--space-3);
        justify-content: center;
        flex-wrap: wrap;
        margin-top: var(--space-5);
      }

      .action-buttons button {
        min-height: 44px;
        min-width: 140px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
      }

      .spin {
        animation: spin 0.9s linear infinite;
      }

      @keyframes cardIn {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .descarga-card {
          animation: none;
        }
        .spin,
        .btn-spinner {
          animation-duration: 1.4s;
        }
        .state-icon {
          transition: none;
        }
      }
    `,
  ],
})
export class DescargaEmailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastr = inject(NbToastrService);
  private cdr = inject(ChangeDetectorRef);

  linkToken = '';
  state: FlowState = 'idle';
  resolved: ResolvedSession | null = null;
  errorMessage = '';
  canRetry = false;

  // Estado del boton: 'preparing' durante el POST /resolve, 'downloading'
  // tras disparar el a.click() y hasta que cierra la ventana heuristica.
  // Mantiene el boton bloqueado y el spinner visible durante toda la
  // transferencia nativa del navegador (que no expone evento de fin).
  downloadButtonState: DownloadButtonState = null;
  downloadedOnce = false;

  private subs: Subscription[] = [];
  private downloadWindowTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.subs.push(
      this.route.params.subscribe(params => {
        this.linkToken = params['linkToken'] || '';
        if (!this.linkToken) {
          this.showError(
            'No se encontro el codigo del enlace de descarga.',
            false
          );
          return;
        }
        this.resolveLinkSilently();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.downloadWindowTimer) {
      clearTimeout(this.downloadWindowTimer);
      this.downloadWindowTimer = null;
    }
  }

  resolveLinkSilently(): void {
    this.setState('resolving');
    this.fetchResolution()
      .then(resp => {
        this.resolved = resp;
        this.setState('ready');
      })
      .catch(err => this.handleResolveError(err, true));
  }

  resolveLink(): void {
    this.resolveLinkSilently();
  }

  startDownload(): void {
    if (!this.linkToken) {
      this.showError('Codigo de descarga no valido.', false);
      return;
    }
    if (this.downloadButtonState !== null) {
      return;
    }

    this.setDownloadButton('preparing');

    this.fetchResolution()
      .then(resp => {
        this.resolved = resp;
        // Cambio a 'downloading' ANTES del a.click() para que el spinner
        // siga sin parpadear durante la fase nativa del navegador.
        this.setDownloadButton('downloading');
        this.triggerBrowserDownload(resp.downloadUrl, resp.fileName);
        this.toastr.success(
          'Tu archivo se esta descargando. Revisa la carpeta de descargas.',
          'Descarga iniciada'
        );
        // Ventana heuristica: el browser no avisa cuando la descarga
        // nativa termina, asi que mantenemos el lock por un tiempo
        // proporcional al tamano (4s..120s, default 8s). La barra del
        // navegador sigue siendo la fuente real de progreso.
        const ms = computeDownloadWindowMs(resp.fileSize);
        if (this.downloadWindowTimer) {
          clearTimeout(this.downloadWindowTimer);
        }
        this.downloadWindowTimer = setTimeout(() => {
          this.downloadWindowTimer = null;
          this.downloadButtonState = null;
          this.downloadedOnce = true;
          this.cdr.markForCheck();
        }, ms);
      })
      .catch(err => {
        this.setDownloadButton(null);
        this.handleResolveError(err, false);
      });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  formatFileSize(bytes: number | null | undefined): string {
    if (!bytes || bytes <= 0) {
      return '';
    }
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  }

  iconStateAttr(): string {
    if (this.state === 'error') return 'error';
    if (this.state === 'resolving') return 'resolving';
    if (this.downloadButtonState !== null) return 'downloading';
    if (this.downloadedOnce) return 'success';
    return 'default';
  }

  headerForState(): string {
    if (this.state === 'error') return 'Error en la descarga';
    if (this.state === 'resolving') return 'Preparando tu descarga';
    if (this.downloadButtonState === 'preparing') {
      return 'Preparando tu descarga';
    }
    if (this.downloadButtonState === 'downloading') {
      return 'Descargando archivo';
    }
    if (this.downloadedOnce) return 'Descarga iniciada';
    if (this.state === 'ready') return 'Listo para descargar';
    return 'Tu descarga';
  }

  private setState(next: FlowState): void {
    this.state = next;
    this.cdr.markForCheck();
  }

  private setDownloadButton(next: DownloadButtonState): void {
    this.downloadButtonState = next;
    this.cdr.markForCheck();
  }

  private async fetchResolution(): Promise<ResolvedSession> {
    const url = `${environment.apiUrl}/api/v1/downloads/email-links/${this.linkToken}/resolve`;
    const headers = new HttpHeaders({ 'skip-auth-interceptor': 'true' });
    return await firstValueFrom(
      this.http.post<ResolvedSession>(url, {}, { headers })
    );
  }

  private triggerBrowserDownload(
    downloadUrl: string,
    suggestedName: string | null
  ): void {
    const link = document.createElement('a');
    link.href = downloadUrl;
    if (suggestedName) {
      link.download = suggestedName;
    }
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
      } catch {
        /* ignore */
      }
    }, 200);
  }

  private handleResolveError(err: unknown, isInitial: boolean): void {
    let message =
      'No pudimos preparar tu descarga. Intenta nuevamente en unos minutos.';
    let retry = true;
    if (err instanceof HttpErrorResponse) {
      const status = err.status;
      const backendError =
        (err.error && typeof err.error === 'object'
          ? (err.error as { error?: string }).error
          : null) || null;
      if (status === 404) {
        message = backendError || 'El enlace de descarga no es valido.';
        retry = false;
      } else if (status === 410) {
        message =
          backendError || 'El enlace de descarga ha expirado o fue revocado.';
        retry = false;
      } else if (status === 403) {
        message = backendError || 'No tienes acceso a este documento.';
        retry = false;
      } else if (status === 429) {
        message =
          backendError ||
          'Demasiados intentos. Espera unos minutos y vuelve a intentar.';
      } else if (status === 0) {
        message = 'No se pudo conectar al servidor. Verifica tu conexion.';
      } else if (backendError) {
        message = backendError;
      }
    }
    this.showError(message, retry, isInitial);
  }

  private showError(message: string, retry: boolean, isInitial = false): void {
    this.state = 'error';
    this.errorMessage = message;
    this.canRetry = retry;
    this.downloadButtonState = null;
    this.cdr.markForCheck();
    if (!isInitial) {
      this.toastr.danger(message, 'Error en la descarga');
    }
  }
}
