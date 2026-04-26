import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NbCardModule, NbSpinnerModule, NbIconModule, NbButtonModule } from '@nebular/theme';

@Component({
    selector: 'ngx-descarga',
    template: `
    <div class="descarga-container">
    
      <!-- Estado: Validando y descargando (unificado) -->
      @if (currentState === 'processing') {
        <div class="descarga-card">
          <nb-card>
            <nb-card-header>
              <h4>� Preparando tu descarga</h4>
            </nb-card-header>
            <nb-card-body>
              <div class="loading-content">
                <nb-spinner size="large"></nb-spinner>
                <p class="loading-text">{{ statusMessage }}</p>
                @if (showProgress) {
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="progressPercent"></div>
                  </div>
                }
                @if (fileInfo) {
                  <div class="file-info">
                    <div class="file-name">📄 {{ fileInfo.name }}</div>
                    @if (fileInfo.size) {
                      <div class="file-size">💾 {{ formatFileSize(fileInfo.size) }}</div>
                    }
                  </div>
                }
              </div>
            </nb-card-body>
          </nb-card>
        </div>
      }
    
      <!-- Estado: Descarga exitosa -->
      @if (currentState === 'success') {
        <div class="descarga-card">
          <nb-card>
            <nb-card-header>
              <h4>✅ ¡Descarga completada!</h4>
            </nb-card-header>
            <nb-card-body>
              <div class="success-content">
                <nb-icon icon="checkmark-circle-outline" status="success" size="3rem"></nb-icon>
                <p class="success-text">{{ fileInfo?.name || 'Tu archivo' }} se ha descargado</p>
                <div class="success-tips">
                  <small>💡 Revisa tu carpeta de descargas</small>
                </div>
                <div class="action-buttons">
                  <button nbButton status="primary" (click)="downloadAgain()">
                    <nb-icon icon="download-outline"></nb-icon>
                    Descargar nuevamente
                  </button>
                  <button nbButton ghost (click)="goHome()">
                    <nb-icon icon="home-outline"></nb-icon>
                    Volver al inicio
                  </button>
                </div>
              </div>
            </nb-card-body>
          </nb-card>
        </div>
      }
    
      <!-- Estado: Error -->
      @if (currentState === 'error') {
        <div class="descarga-card">
          <nb-card>
            <nb-card-header>
              <h4>❌ Problema con la descarga</h4>
            </nb-card-header>
            <nb-card-body>
              <div class="error-content">
                <nb-icon icon="alert-triangle-outline" status="warning" size="3rem"></nb-icon>
                <p class="error-text">{{ errorMessage }}</p>
                <!-- Opciones de descarga alternativas -->
                @if (!isTokenExpired) {
                  <div class="download-alternatives">
                    <h6>🚀 Opciones de descarga:</h6>
                    <div class="alternative-buttons">
                      <button nbButton status="primary" (click)="forceDownload()" [disabled]="retryCount >= maxRetries">
                        <nb-icon icon="download-outline"></nb-icon>
                        Intentar descarga directa
                      </button>
                      <button nbButton status="info" (click)="openInNewTab()">
                        <nb-icon icon="external-link-outline"></nb-icon>
                        Abrir en nueva pestaña
                      </button>
                      <button nbButton ghost (click)="copyLinkToClipboard()">
                        <nb-icon icon="copy-outline"></nb-icon>
                        Copiar enlace
                      </button>
                    </div>
                  </div>
                }
                <!-- Mensaje de token expirado -->
                @if (isTokenExpired) {
                  <div class="token-expired">
                    <h6>⏰ Enlace expirado</h6>
                    <p>Este enlace de descarga ya no es válido. Los enlaces expiran por seguridad.</p>
                    <button nbButton status="primary" (click)="goHome()">
                      <nb-icon icon="home-outline"></nb-icon>
                      Solicitar nuevo enlace
                    </button>
                  </div>
                }
                <div class="help-tips">
                  <details>
                    <summary>🆘 ¿Necesitas ayuda?</summary>
                    <ul>
                      <li>Verifica tu conexión a internet</li>
                      <li>Desactiva temporalmente bloqueadores de pop-ups</li>
                      <li>Intenta desde otro navegador</li>
                      <li>Verifica que tengas espacio suficiente en tu dispositivo</li>
                    </ul>
                  </details>
                </div>
              </div>
            </nb-card-body>
          </nb-card>
        </div>
      }
    
      <!-- Botón de cerrar global -->
      <button nbButton ghost status="basic" size="small" (click)="goHome()" class="close-button">
        <nb-icon icon="close-outline"></nb-icon>
      </button>
    </div>
    `,
    styleUrls: ['./descarga.component.scss'],
    standalone: true,
    imports: [NbCardModule, NbSpinnerModule, NbIconModule, NbButtonModule]
})
export class DescargaComponent implements OnInit, OnDestroy {
  // Estados del componente
  currentState: 'validating' | 'preparing' | 'initiating' | 'downloading' | 'processing' | 'success' | 'error' = 'validating';

  // Datos del token y archivo
  private token: string | null = null;
  tokenPreview: string = '';
  fileInfo: any = null;

  // Estados de error y retry
  errorMessage: string = '';
  errorDetails: string = '';
  isTokenExpired: boolean = false;
  retryCount: number = 0;
  maxRetries: number = 3;

  // Countdown y timers
  countdown: number = 0;
  initiatingCountdown: number = 0;
  showDownloadButtons: boolean = false;
  downloadButtonsCountdown: number = 30;
  private destroy$ = new Subject<void>();
  private downloadUrl: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.initializeDownloadProcess();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeDownloadProcess() {
    try {
      // Paso 1: Obtener y validar token
      this.token = this.route.snapshot.paramMap.get('token');

      if (!this.token) {
        this.setState('error', 'Token de descarga no válido o no proporcionado');
        return;
      }

      this.tokenPreview = `${this.token.substring(0, 20)}...`;

      // Paso 2: Validar token
      await this.validateToken();

      // Paso 3: Preparar descarga
      this.setState('preparing');
      await this.prepareDownload();

      // Paso 4: Iniciar countdown
      this.startCountdown();

    } catch (error: any) {
      this.handleError(error);
    }
  }

  private async validateToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.token) {
        reject(new Error('No hay token disponible'));
        return;
      }

      // Simular validación del token (puedes reemplazar con llamada real al backend)
      setTimeout(() => {
        try {
          // Verificar formato del token JWT básico
          const tokenParts = this.token!.split('.');
          if (tokenParts.length !== 3) {
            this.isTokenExpired = true;
            reject(new Error('Formato de token inválido'));
            return;
          }

          // Decodificar payload para verificar expiración
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Math.floor(Date.now() / 1000);

          if (payload.exp && payload.exp < currentTime) {
            this.isTokenExpired = true;
            reject(new Error('El token ha expirado'));
            return;
          }

          // Token válido
          this.fileInfo = {
            name: 'Documento educativo',
            type: 'PDF/ZIP',
            size: null
          };

          resolve();
        } catch (error) {
          reject(new Error('Error al validar el token'));
        }
      }, 1500);
    });
  }

  private async prepareDownload(): Promise<void> {
    this.downloadUrl = `${environment.apiUrl}/api/v1/token/download/${this.token}`;

    // Intentar obtener información adicional del archivo
    try {
      await this.fetchFileInfo();
    } catch (error) {
    }
  }

  private async fetchFileInfo(): Promise<void> {
    // Hacer una petición HEAD para obtener información del archivo sin descargarlo
    return new Promise((resolve) => {
      const headers = { 'skip-auth-interceptor': 'true' };

      this.http.head(this.downloadUrl, {
        headers,
        observe: 'response'
      }).subscribe({
        next: (response) => {
          const contentDisposition = response.headers.get('content-disposition');
          const contentType = response.headers.get('content-type');
          const contentLength = response.headers.get('content-length');

          if (contentDisposition) {
            const fileName = this.extractFileName(contentDisposition);
            if (fileName) {
              this.fileInfo.name = fileName;
            }
          }

          if (contentType) {
            this.fileInfo.type = this.getFileTypeFromMime(contentType);
          }

          if (contentLength) {
            this.fileInfo.size = parseInt(contentLength);
          }

          resolve();
        },
        error: () => {
          resolve(); // No fallar si no se puede obtener info
        }
      });
    });
  }

  private startCountdown(): void {
    this.countdown = 3;

    const countdown$ = interval(1000).pipe(takeUntil(this.destroy$));

    const subscription = countdown$.subscribe(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        // ✅ IMPORTANTE: Detener el subscription para evitar bucles
        subscription.unsubscribe();
        this.startInitiating();
      }
    });
  }

  private startInitiating(): void {
    if (this.currentState !== 'preparing') return;

    this.currentState = 'initiating';
    this.initiatingCountdown = 3;

    // Simular pasos del proceso de iniciación
    setTimeout(() => {
      this.initiatingCountdown = 2;
    }, 1000);

    setTimeout(() => {
      this.initiatingCountdown = 1;
    }, 2000);

    setTimeout(() => {
      this.startDownload();
    }, 3000);
  }

  private startDownload(): void {
    // ✅ Prevenir múltiples ejecuciones simultáneas
    if (this.currentState === 'downloading') {
      return;
    }

    this.setState('downloading');
    this.showDownloadButtons = false; // Inicialmente ocultar botones
    this.downloadButtonsCountdown = 30; // Reiniciar contador

    try {
      // Método principal: enlace directo
      this.forceDownload();

      // Iniciar contador de 30 segundos
      const countdownInterval = interval(1000)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.downloadButtonsCountdown--;

          if (this.downloadButtonsCountdown <= 0) {
            if (this.currentState === 'downloading') {
              this.showDownloadButtons = true;
            }
            countdownInterval.unsubscribe();
          }
        });

      // Verificar después de un tiempo si la descarga fue exitosa
      setTimeout(() => {
        if (this.currentState === 'downloading') {
          // Mantener en estado downloading para permitir reintentos
        }
      }, 5000);

    } catch (error: any) {
      this.handleError(error);
    }
  }

  // Métodos públicos llamados desde el template
  forceDownload(): void {
    if (!this.downloadUrl) return;

    const link = document.createElement('a');
    link.href = this.downloadUrl;
    link.style.display = 'none';
    link.download = this.fileInfo?.name || 'documento';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1000);

  }

  openInNewTab(): void {
    if (!this.downloadUrl) return;

    window.open(this.downloadUrl, '_blank');
  }

  retryDownload(): void {
    if (this.retryCount >= this.maxRetries) {
      this.setState('error', `Se agotaron los intentos de descarga (${this.maxRetries}/${this.maxRetries})`);
      return;
    }

    this.retryCount++;
    this.setState('preparing');

    // ✅ Resetear countdown antes de iniciar
    this.countdown = 0;

    setTimeout(() => {
      this.startCountdown();
    }, 1000);
  }

  downloadAgain(): void {
    this.retryCount = 0;
    this.setState('preparing');

    // ✅ Resetear countdown antes de iniciar
    this.countdown = 0;

    setTimeout(() => {
      this.startCountdown();
    }, 500);
  }

  goHome(): void {
    this.router.navigate(['/site/home']);
  }

  copyLinkToClipboard(): void {
    const fullUrl = `${window.location.origin}/descarga/${this.token}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        // Aquí podrías mostrar un toast o notificación
      });
    } else {
      // Fallback para navegadores que no soportan Clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  // Métodos de utilidad
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private setState(state: typeof this.currentState, errorMessage: string = ''): void {
    const previousState = this.currentState;
    this.currentState = state;

    // Reiniciar showDownloadButtons cuando no esté en estado downloading
    if (state !== 'downloading') {
      this.showDownloadButtons = false;
      this.downloadButtonsCountdown = 30;
    }

    if (state === 'error') {
      this.errorMessage = errorMessage;
    }

  }

  private handleError(error: any): void {

    let errorMessage = 'Ha ocurrido un error inesperado';
    let errorDetails = '';

    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 401:
          errorMessage = 'Token de autenticación inválido o expirado';
          this.isTokenExpired = true;
          break;
        case 404:
          errorMessage = 'El archivo solicitado no fue encontrado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        case 0:
          errorMessage = 'Error de conexión. Verifica tu conexión a internet';
          break;
        default:
          errorMessage = `Error del servidor (${error.status})`;
      }
      errorDetails = `Status: ${error.status}\nMessage: ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
      errorDetails = error.stack || error.toString();
    }
    
    this.errorDetails = errorDetails;
    this.setState('error', errorMessage);
  }

  private extractFileName(contentDisposition: string): string | null {
    const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (matches != null && matches[1]) {
      return matches[1].replace(/['"]/g, '');
    }
    return null;
  }

  private getFileTypeFromMime(mimeType: string): string {
    const typeMap: { [key: string]: string } = {
      'application/pdf': 'PDF',
      'application/zip': 'ZIP',
      'application/x-zip-compressed': 'ZIP',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
      'image/jpeg': 'Imagen JPEG',
      'image/png': 'Imagen PNG',
      'text/plain': 'Texto'
    };

    return typeMap[mimeType] || 'Documento';
  }
}
