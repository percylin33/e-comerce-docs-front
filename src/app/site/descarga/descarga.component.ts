import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ngx-descarga',
  template: `
    <div class="descarga-container">
      <!-- Estado: Validando Token -->
      <div class="descarga-card" *ngIf="currentState === 'validating'">
        <nb-card>
          <nb-card-header>
            <h4>🔍 Validando enlace</h4>
          </nb-card-header>
          <nb-card-body>
            <div class="loading-content">
              <nb-spinner size="large"></nb-spinner>
              <p class="loading-text">Verificando tu enlace de descarga...</p>
              <p class="loading-subtitle">Validando token de seguridad</p>
              <div class="progress-info">
                <small>Token: {{ tokenPreview }}</small>
              </div>
            </div>
          </nb-card-body>
        </nb-card>
      </div>

      <!-- Estado: Preparando Descarga -->
      <div class="descarga-card" *ngIf="currentState === 'preparing'">
        <nb-card>
          <nb-card-header>
            <h4>🚀 Preparando descarga</h4>
          </nb-card-header>
          <nb-card-body>
            <div class="loading-content">
              <nb-spinner size="large"></nb-spinner>
              <p class="loading-text">Configurando tu descarga...</p>
              <p class="loading-subtitle">{{ fileInfo?.name || 'Preparando archivo' }}</p>
              <div class="file-details" *ngIf="fileInfo">
                <div class="detail-item">
                  <nb-icon icon="file-outline"></nb-icon>
                  <span>{{ fileInfo.type || 'Documento' }}</span>
                </div>
                <div class="detail-item" *ngIf="fileInfo.size">
                  <nb-icon icon="hard-drive-outline"></nb-icon>
                  <span>{{ formatFileSize(fileInfo.size) }}</span>
                </div>
              </div>
              <div class="countdown" *ngIf="countdown > 0">
                Iniciando en {{ countdown }} segundos...
              </div>
            </div>
          </nb-card-body>
        </nb-card>
      </div>

      <!-- Estado: Iniciando Descarga -->
      <div class="descarga-card" *ngIf="currentState === 'initiating'">
        <nb-card>
          <nb-card-header>
            <h4>⚡ Iniciando descarga</h4>
          </nb-card-header>
          <nb-card-body>
            <div class="loading-content">
              <nb-spinner size="large" status="info"></nb-spinner>
              <p class="loading-text">Conectando con el servidor...</p>
              <p class="loading-subtitle">{{ fileInfo?.name || 'Preparando tu archivo' }}</p>
              <div class="download-progress">
                <div class="progress-steps">
                  <div class="step completed">
                    <nb-icon icon="checkmark-circle-outline" status="success"></nb-icon>
                    <span>Token validado</span>
                  </div>
                  <div class="step completed">
                    <nb-icon icon="checkmark-circle-outline" status="success"></nb-icon>
                    <span>Archivo localizado</span>
                  </div>
                  <div class="step active">
                    <nb-spinner size="tiny" status="info"></nb-spinner>
                    <span>Iniciando descarga...</span>
                  </div>
                </div>
              </div>
              <div class="loading-timer" *ngIf="initiatingCountdown > 0">
                <small>Conectando en {{ initiatingCountdown }}s...</small>
              </div>
            </div>
          </nb-card-body>
        </nb-card>
      </div>

      <!-- Estado: Descargando -->
      <div class="descarga-card" *ngIf="currentState === 'downloading'">
        <nb-card>
          <nb-card-header>
            <h4>✅ ¡Descarga iniciada!</h4>
            <!-- Botón de cerrar global -->
      <div class="close-button-container">
        <button nbButton ghost status="basic" size="small" (click)="goHome()" class="close-button">
          <nb-icon icon="close-outline"></nb-icon>
        </button>
      </div>
          </nb-card-header>
          <nb-card-body>
            <div class="success-content">
              <nb-icon icon="download-outline" status="success" size="3rem" class="pulse-animation"></nb-icon>
              <p class="success-text">{{ fileInfo?.name || 'Tu archivo' }} se está descargando...</p>
              
              <!-- Contador antes de mostrar botones -->
              <div class="countdown-section" *ngIf="!showDownloadButtons && downloadButtonsCountdown > 0">
                <div class="countdown-circle">
                  <span class="countdown-number">{{ downloadButtonsCountdown }}</span>
                </div>
                <p class="countdown-text">Opciones de descarga disponibles en {{ downloadButtonsCountdown }} segundos</p>
              </div>
              
              <!-- Botones de descarga -->
              <div class="download-methods" *ngIf="showDownloadButtons">
                <p class="success-subtitle">Si la descarga no inicia automáticamente:</p>
                <div class="method-buttons">
                  <button nbButton status="primary" size="small" (click)="forceDownload()">
                    <nb-icon icon="download-outline"></nb-icon>
                    Descargar ahora
                  </button>
                  <button nbButton status="basic" size="small" (click)="openInNewTab()">
                    <nb-icon icon="external-link-outline"></nb-icon>
                    Abrir en nueva pestaña
                  </button>
                </div>
              </div>
              
              <div class="download-tips">
                <small>💡 Revisa tu carpeta de descargas o las notificaciones del navegador</small>
              </div>
            </div>
          </nb-card-body>
        </nb-card>
      </div>

      <!-- Estado: Error -->
      <div class="descarga-card" *ngIf="currentState === 'error'">
        <nb-card>
          <nb-card-header>
            <h4>❌ Error en la descarga</h4>
          </nb-card-header>
          <nb-card-body>
            <div class="error-content">
              <nb-icon icon="alert-triangle-outline" status="danger" size="3rem"></nb-icon>
              <p class="error-text">{{ errorMessage }}</p>
              <div class="error-details" *ngIf="errorDetails">
                <nb-accordion>
                  <nb-accordion-item>
                    <nb-accordion-item-header>
                      <nb-icon icon="info-outline"></nb-icon>
                      Ver detalles técnicos
                    </nb-accordion-item-header>
                    <nb-accordion-item-body>
                      <pre>{{ errorDetails }}</pre>
                    </nb-accordion-item-body>
                  </nb-accordion-item>
                </nb-accordion>
              </div>
              <div class="error-actions">
                <button nbButton status="primary" (click)="retryDownload()">
                  <nb-icon icon="refresh-outline"></nb-icon>
                  Reintentar ({{ retryCount }}/{{ maxRetries }})
                </button>
                <button nbButton status="basic" (click)="goHome()">
                  <nb-icon icon="home-outline"></nb-icon>
                  Ir al inicio
                </button>
                <button nbButton status="info" size="small" (click)="copyLinkToClipboard()">
                  <nb-icon icon="copy-outline"></nb-icon>
                  Copiar enlace
                </button>
              </div>
              <div class="help-section">
                <h6>🆘 ¿Necesitas ayuda?</h6>
                <ul>
                  <li>Verifica tu conexión a internet</li>
                  <li>El enlace puede haber expirado (válido por 24 horas)</li>
                  <li>Intenta abrir el enlace en modo incógnito</li>
                  <li *ngIf="isTokenExpired">El token ha expirado, solicita un nuevo enlace</li>
                </ul>
              </div>
            </div>
          </nb-card-body>
        </nb-card>
      </div>

      <!-- Estado: Éxito -->
      <div class="descarga-card" *ngIf="currentState === 'success'">
        <nb-card>
          <nb-card-header>
            <h4>🎉 ¡Descarga completada!</h4>
          </nb-card-header>
          <nb-card-body>
            <div class="success-content">
              <nb-icon icon="checkmark-circle-outline" status="success" size="3rem"></nb-icon>
              <p class="success-text">{{ fileInfo?.name || 'Tu archivo' }} se ha descargado correctamente</p>
              <div class="post-download-actions">
                <button nbButton status="basic" (click)="goHome()">
                  <nb-icon icon="home-outline"></nb-icon>
                  Volver al inicio
                </button>
                <button nbButton status="info" size="small" (click)="downloadAgain()">
                  <nb-icon icon="download-outline"></nb-icon>
                  Descargar nuevamente
                </button>
              </div>
            </div>
          </nb-card-body>
        </nb-card>
      </div>
    </div>
  `,
  styles: [`
    .descarga-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      animation: gradientShift 10s ease infinite;
    }

    @keyframes gradientShift {
      0%, 100% { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      50% { background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); }
    }

    .descarga-card {
      width: 100%;
      max-width: 600px;
      animation: slideInUp 0.5s ease-out;
    }

    @keyframes slideInUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .loading-content, .success-content, .error-content {
      text-align: center;
      padding: 30px 20px;
    }

    .loading-text, .success-text, .error-text {
      font-size: 1.3rem;
      font-weight: 600;
      margin: 20px 0 10px 0;
      color: var(--text-basic-color);
    }

    .loading-subtitle, .success-subtitle {
      color: var(--text-hint-color);
      margin-bottom: 15px;
      font-size: 1rem;
    }

    .progress-info {
      margin-top: 20px;
      padding: 15px;
      background: var(--background-basic-color-2);
      border-radius: 8px;
      border-left: 4px solid var(--color-primary-default);
    }

    .file-details {
      margin: 20px 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--background-basic-color-2);
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .countdown {
      margin-top: 20px;
      font-weight: 600;
      color: var(--color-primary-default);
      font-size: 1.1rem;
      animation: pulse 1s infinite;
    }

    .countdown-section {
      margin: 25px 0;
      text-align: center;
    }

    .countdown-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary-default), var(--color-primary-600));
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 15px auto;
      box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
      animation: pulseCircle 1s ease-in-out infinite;
    }

    .countdown-number {
      font-size: 1.8rem;
      font-weight: bold;
      color: white;
    }

    .countdown-text {
      color: var(--text-hint-color);
      font-size: 0.95rem;
      margin: 0;
      animation: fadeInOut 2s ease-in-out infinite;
    }

    @keyframes pulseCircle {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    @keyframes fadeInOut {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }

    .download-progress {
      margin: 25px 0;
      padding: 20px;
      background: var(--background-basic-color-2);
      border-radius: 12px;
      border: 1px solid var(--border-basic-color-3);
    }

    .progress-steps {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 15px;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .step.completed {
      background: rgba(0, 214, 143, 0.1);
      color: var(--color-success-default);
    }

    .step.active {
      background: rgba(51, 102, 255, 0.1);
      color: var(--color-primary-default);
      border: 1px solid var(--color-primary-default);
      animation: activeStep 1.5s infinite;
    }

    @keyframes activeStep {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    .step span {
      font-weight: 500;
      font-size: 0.95rem;
    }

    .loading-timer {
      margin-top: 15px;
      padding: 10px;
      background: var(--background-basic-color-3);
      border-radius: 6px;
      color: var(--text-hint-color);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .pulse-animation {
      animation: pulseScale 2s infinite;
    }

    @keyframes pulseScale {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .download-methods {
      margin: 25px 0;
    }

    .method-buttons {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
      margin: 15px 0;
    }

    .download-tips {
      margin-top: 20px;
      padding: 15px;
      background: var(--background-basic-color-3);
      border-radius: 8px;
      color: var(--text-hint-color);
    }

    .error-details {
      margin: 20px 0;
      text-align: left;
    }

    .error-details pre {
      background: var(--background-basic-color-4);
      padding: 15px;
      border-radius: 6px;
      font-size: 0.8rem;
      color: var(--text-hint-color);
      white-space: pre-wrap;
      word-break: break-word;
    }

    .error-actions {
      margin: 25px 0;
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .help-section {
      margin-top: 25px;
      text-align: left;
      background: var(--background-basic-color-2);
      padding: 20px;
      border-radius: 8px;
    }

    .help-section h6 {
      margin: 0 0 15px 0;
      color: var(--text-basic-color);
    }

    .help-section ul {
      margin: 0;
      padding-left: 20px;
      color: var(--text-hint-color);
    }

    .help-section li {
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .post-download-actions {
      margin-top: 25px;
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }

    nb-card {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      border-radius: 16px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .descarga-container {
        padding: 10px;
      }
      
      .loading-content, .success-content, .error-content {
        padding: 20px 15px;
      }
      
      .loading-text, .success-text, .error-text {
        font-size: 1.1rem;
      }
      
      .method-buttons, .error-actions, .post-download-actions {
        flex-direction: column;
        align-items: center;
      }
      
      .method-buttons button, .error-actions button, .post-download-actions button {
        width: 100%;
        max-width: 250px;
      }
    }

    /* Accessibility improvements */
    @media (prefers-reduced-motion: reduce) {
      .descarga-container, .descarga-card, .pulse-animation, .countdown {
        animation: none;
      }
    }

    /* Dark theme adjustments */
    [data-theme="dark"] {
      .descarga-container {
        background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      nb-card {
        border: 2px solid var(--text-basic-color);
      }
      
      .progress-info, .detail-item, .download-tips, .help-section {
        border: 1px solid var(--text-hint-color);
      }
    }

    /* Estilos para el botón de cerrar */
    .close-button-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
    }

    .close-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .close-button:hover {
      background: rgba(255, 255, 255, 1);
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    .close-button nb-icon {
      font-size: 20px;
      color: #666;
    }

    .close-button:hover nb-icon {
      color: #333;
    }
  `]
})
export class DescargaComponent implements OnInit, OnDestroy {
  // Estados del componente
  currentState: 'validating' | 'preparing' | 'initiating' | 'downloading' | 'success' | 'error' = 'validating';

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
      console.warn('No se pudo obtener información del archivo:', error);
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
      console.log('⚠️ Descarga ya en progreso, saltando...');
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
              console.log('✅ Mostrando botones de descarga después de 30 segundos...');
            }
            countdownInterval.unsubscribe();
          }
        });

      // Verificar después de un tiempo si la descarga fue exitosa
      setTimeout(() => {
        if (this.currentState === 'downloading') {
          // Mantener en estado downloading para permitir reintentos
          console.log('✅ Descarga completada, manteniendo interfaz activa...');
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

    console.log('🔽 Descarga forzada iniciada');
  }

  openInNewTab(): void {
    if (!this.downloadUrl) return;

    window.open(this.downloadUrl, '_blank');
    console.log('🔗 Abriendo en nueva pestaña');
  }

  retryDownload(): void {
    if (this.retryCount >= this.maxRetries) {
      this.setState('error', `Se agotaron los intentos de descarga (${this.maxRetries}/${this.maxRetries})`);
      return;
    }

    this.retryCount++;
    console.log(`🔄 Reintentando descarga (${this.retryCount}/${this.maxRetries})`);
    this.setState('preparing');

    // ✅ Resetear countdown antes de iniciar
    this.countdown = 0;

    setTimeout(() => {
      this.startCountdown();
    }, 1000);
  }

  downloadAgain(): void {
    this.retryCount = 0;
    console.log('🔄 Iniciando nueva descarga...');
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
        console.log('📋 Enlace copiado al portapapeles');
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

    console.log(`📊 Estado: ${previousState} → ${state}`, errorMessage ? `| Error: ${errorMessage}` : '');
  }

  private handleError(error: any): void {
    console.error('❌ Error en descarga:', error);

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
