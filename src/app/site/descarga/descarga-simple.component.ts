import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NbToastrService } from '@nebular/theme';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ngx-descarga-simple',
  template: `
    <div class="descarga-container">
      
      <!-- Estado: Procesando -->
      <div class="descarga-card" *ngIf="currentState === 'processing'">
        <nb-card>
          <nb-card-header>
            <h4>🔄 Preparando tu descarga</h4>
          </nb-card-header>
          <nb-card-body>
            <div class="loading-content">
              <nb-spinner size="large" *ngIf="!fileInfo"></nb-spinner>
              <p class="loading-text">{{ statusMessage }}{{ loadingDots }}</p>
              <div class="progress-bar" *ngIf="showProgress">
                <div class="progress-fill" [style.width.%]="progressPercent"></div>
              </div>
              
              <!-- Botón cancelar durante validación -->
              <div class="cancel-button" *ngIf="!fileInfo && !isDownloading">
                <button nbButton status="danger" size="small" (click)="cancelValidation()">
                  ❌ Cancelar
                </button>
              </div>
              
              <div class="file-info" *ngIf="fileInfo">
                <div class="file-name">📄 {{ fileInfo.fileName || fileInfo.name }}</div>
                <div class="file-size" *ngIf="fileInfo.fileSize">💾 {{ formatFileSize(fileInfo.fileSize) }}</div>
              </div>
              
              <div class="manual-download" *ngIf="fileInfo && !isDownloading">
                <button nbButton status="primary" (click)="startDownload()" class="download-button" [disabled]="isDownloading">
                  📥 Elegir ubicación y descargar
                </button>
                <p class="download-tip">
                  💡 <span *ngIf="supportsFilePicker()">Podrás elegir dónde guardar el archivo</span>
                  <span *ngIf="!supportsFilePicker()">Se guardará en tu carpeta de descargas</span>
                </p>
              </div>
            </div>
          </nb-card-body>
        </nb-card>
      </div>

      <!-- Estado: Éxito -->
      <div class="descarga-card" *ngIf="currentState === 'success'">
        <nb-card>
          <nb-card-header>
            <h4>✅ ¡Descarga completada!</h4>
          </nb-card-header>
          <nb-card-body>
            <div class="success-content">
              <div class="success-icon">🎉</div>
              <p class="success-text">Tu archivo se ha descargado correctamente</p>
              <div class="file-info" *ngIf="fileInfo">
                <div class="file-name">📄 {{ fileInfo.name }}</div>
              </div>
              <div class="action-buttons">
                <button nbButton status="primary" (click)="startDownload()">
                  🔄 Descargar nuevamente
                </button>
                <button nbButton status="basic" (click)="goHome()">
                  🏠 Ir al inicio
                </button>
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
              <div class="error-message">
                <p>{{ errorMessage }}</p>
              </div>

              <div class="token-expired" *ngIf="isTokenExpired">
                <h6>⏰ Enlace expirado</h6>
                <p>Este enlace de descarga ya no es válido.</p>
                <button nbButton status="primary" (click)="goHome()">
                  🏠 Solicitar nuevo enlace
                </button>
              </div>
              
              <!-- Opciones cuando hay error pero token válido -->
              <div class="alternative-buttons" *ngIf="!isTokenExpired">
                <button nbButton status="warning" (click)="retryDownload()" [disabled]="retryCount >= maxRetries">
                  🔄 Reintentar ({{ retryCount }}/{{ maxRetries }})
                </button>
                <button nbButton status="basic" (click)="goHome()">
                  🏠 Ir al inicio
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
      position: relative;
    }

    .descarga-card {
      max-width: 500px;
      width: 100%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      border-radius: 16px;
      overflow: hidden;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    }

    .loading-content, .success-content, .error-content {
      text-align: center;
      padding: 20px;
    }

    .loading-text, .success-text {
      margin: 20px 0;
      font-size: 1.1rem;
      color: var(--text-basic-color);
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(255,255,255,0.2);
      border-radius: 4px;
      margin: 20px 0;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #00d68f, #0095ff);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .file-info {
      margin: 20px 0;
      padding: 15px;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      backdrop-filter: blur(5px);
    }

    .file-name {
      font-weight: 600;
      margin-bottom: 5px;
      color: var(--text-basic-color);
    }

    .file-size {
      font-size: 0.9rem;
      color: var(--text-hint-color);
    }

    .success-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .error-message {
      margin-bottom: 20px;
      padding: 15px;
      background: rgba(255,0,0,0.1);
      border-radius: 8px;
      color: var(--color-danger-default);
    }

    .download-button {
      width: 100%;
      padding: 12px 24px;
      margin: 15px 0;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .download-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .download-tip {
      margin-top: 10px;
      font-size: 0.9rem;
      color: var(--text-hint-color);
      font-style: italic;
    }

    .cancel-button {
      margin-top: 15px;
    }

    .action-buttons, .alternative-buttons {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 20px;
    }

    .action-buttons button, .alternative-buttons button {
      min-width: 140px;
    }

    .token-expired {
      background: rgba(255,193,7,0.1);
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
    }

    .token-expired h6 {
      margin-bottom: 10px;
      color: var(--color-warning-default);
    }

    nb-spinner {
      margin-bottom: 20px;
    }

    @media (max-width: 768px) {
      .descarga-container {
        padding: 10px;
      }
      
      .action-buttons, .alternative-buttons {
        flex-direction: column;
      }
      
      .action-buttons button, .alternative-buttons button {
        width: 100%;
        min-width: auto;
      }
    }
  `]
})
export class DescargaSimpleComponent implements OnInit, OnDestroy {
  token: string = '';
  currentState: 'processing' | 'success' | 'error' = 'processing';
  fileInfo: any = null;
  statusMessage: string = 'Inicializando descarga...';
  errorMessage: string = '';
  isDownloading: boolean = false;
  isTokenExpired: boolean = false;
  showProgress: boolean = false;
  progressPercent: number = 0;
  retryCount: number = 0;
  maxRetries: number = 3;
  
  // Para animación de puntos
  loadingDots: string = '';
  private loadingDotsInterval: any = null;

  private subscriptions: Subscription[] = [];
  private validationTimeoutId: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private toastr: NbToastrService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.token = params['token'];
      
      if (this.token && this.token !== 'undefined') {
        // MODO DEBUG: Si es un token de prueba, usar datos simulados
        if (this.token === 'test-token' || this.token === 'debug') {
          this.useTestData();
        } else {
          this.initializeDownload();
        }
      } else {
        this.handleError('No se encontró el token de descarga en la URL');
      }
    });
  }

  private useTestData() {
    this.fileInfo = {
      fileName: '5TO.zip',
      name: '5TO.zip',
      fileId: 'test-file-id',
      fileSize: 207128395, // 197.53 MB
      fileType: 'application/zip'
    };
    this.statusMessage = 'Archivo listo para descargar';
    this.isDownloading = false;
    this.currentState = 'processing';
    this.updateProgress(100);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.validationTimeoutId) {
      clearTimeout(this.validationTimeoutId);
    }
    this.stopLoadingDotsAnimation(); // Limpiar animación de puntos
  }

  private async initializeDownload() {
    try {
      this.statusMessage = 'Validando enlace...';
      this.updateProgress(20);

      await this.validateToken();
      
      this.statusMessage = 'Archivo listo para descargar';
      this.isDownloading = false;
      this.currentState = 'processing';
      this.updateProgress(100);

    } catch (error) {
      this.handleError(error);
    }
  }

  private async validateToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      const validateUrl = `${environment.apiUrl}/api/v1/token/validate/${this.token}`;
      
      // Timeout de 10 segundos para evitar carga infinita
      this.validationTimeoutId = setTimeout(() => {
        reject('Timeout: El servidor tardó demasiado en responder. Verifica tu conexión.');
      }, 10000);
      
      // Headers para saltar el interceptor de autenticación (descarga pública)
      const headers = new HttpHeaders({
        'skip-auth-interceptor': 'true'
      });
      
      this.http.get(validateUrl, { headers }).subscribe({
        next: (response: any) => {
          clearTimeout(this.validationTimeoutId);
          if (response.data && response.data.valid) {
            this.fileInfo = { 
              fileName: response.data.fileName || response.data.name || 'Documento',
              name: response.data.fileName || response.data.name || 'Documento',
              fileId: response.data.fileId,
              fileSize: response.data.fileSize || null,
              fileType: response.data.fileType || null
            };
            resolve();
          } else {
            reject('Token inválido o archivo no encontrado');
          }
        },
        error: (error) => {
          clearTimeout(this.validationTimeoutId);
          if (error.status === 401) {
            this.isTokenExpired = true;
            reject('El enlace de descarga ha expirado o no es válido.');
          } else if (error.status === 404) {
            reject('El archivo solicitado no fue encontrado.');
          } else if (error.status === 500) {
            reject('Error del servidor. Intenta nuevamente en unos minutos.');
          } else if (error.status === 0) {
            reject('No se pudo conectar al servidor. Verifica tu conexión a internet.');
          } else {
            reject(`Error al validar el enlace de descarga (${error.status}). Intenta nuevamente.`);
          }
        }
      });
    });
  }

  async startDownload() {
    if (this.isDownloading) {
      return;
    }
    
    // Resetear estado para nueva descarga
    this.stopLoadingDotsAnimation();
    this.currentState = 'processing';
    this.isDownloading = true;
    this.retryCount++;
    this.statusMessage = 'Iniciando descarga...';
    this.updateProgress(30);

    try {
      const downloadUrl = `${environment.apiUrl}/api/v1/token/download/${this.token}`;
      const fileName = this.fileInfo?.fileName || this.fileInfo?.name || 'documento';
      
      // Verificar si el navegador soporta File System Access API
      if ('showSaveFilePicker' in window) {
        await this.downloadWithFilePicker(downloadUrl, fileName);
      } else {
        this.downloadWithBrowserDefault(downloadUrl, fileName);
      }
      
    } catch (error) {
      this.isDownloading = false;
      this.handleError(error);
    }
  }

  // Helper para determinar si el navegador soporta File System Access API
  supportsFilePicker(): boolean {
    return 'showSaveFilePicker' in window;
  }

  // Método para navegadores modernos que soportan File System Access API
  private async downloadWithFilePicker(downloadUrl: string, fileName: string) {
    try {
      this.statusMessage = 'Selecciona dónde guardar el archivo';
      this.startLoadingDotsAnimation();
      
      // Mostrar el diálogo para elegir dónde guardar
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'Archivos ZIP',
            accept: {
              'application/zip': ['.zip']
            }
          },
          {
            description: 'Documentos PDF',
            accept: {
              'application/pdf': ['.pdf']
            }
          },
          {
            description: 'Todos los archivos',
            accept: {
              '*/*': []
            }
          }
        ]
      });

      this.statusMessage = 'Descargando archivo';
      this.updateProgress(50);

      // Descargar el archivo desde el servidor
      const headers = new HttpHeaders({
        'skip-auth-interceptor': 'true'
      });
      
      const response = await this.http.get(downloadUrl, { 
        headers,
        responseType: 'blob',
        observe: 'response'
      }).toPromise();
      
      if (!response || !response.ok) {
        throw new Error(`Error HTTP: ${response?.status || 'Unknown'}`);
      }

      this.updateProgress(70);

      // Escribir el archivo en la ubicación seleccionada
      const writableStream = await fileHandle.createWritable();
      const blob = response.body;
      await writableStream.write(blob);
      await writableStream.close();

      this.updateProgress(100);
      this.stopLoadingDotsAnimation();
      this.currentState = 'success';
      this.isDownloading = false;
      this.fileInfo = { ...this.fileInfo, name: fileHandle.name };
      this.toastr.success(`¡Archivo guardado como "${fileHandle.name}"!`, 'Descarga completada');

    } catch (error: any) {
      this.stopLoadingDotsAnimation(); // Detener animación en caso de error
      this.isDownloading = false;
      if (error.name === 'AbortError') {
        this.toastr.info('Descarga cancelada por el usuario', 'Cancelado');
        this.currentState = 'processing'; // Volver al estado anterior
      } else {
        this.handleError(error);
      }
    }
  }

  private downloadWithBrowserDefault(downloadUrl: string, fileName: string) {
    try {
      this.statusMessage = 'Descargando archivo';
      this.startLoadingDotsAnimation();
      this.updateProgress(50);

      // Crear un enlace de descarga temporal
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.updateProgress(100);
      this.stopLoadingDotsAnimation();
      this.currentState = 'success';
      this.isDownloading = false;
      this.toastr.success('¡Descarga iniciada! Revisa tu carpeta de descargas.', 'Descarga completada');

    } catch (error) {
      this.stopLoadingDotsAnimation();
      this.isDownloading = false;
      this.handleError(error);
    }
  }

  cancelValidation() {
    if (this.validationTimeoutId) {
      clearTimeout(this.validationTimeoutId);
    }
    this.currentState = 'error';
    this.errorMessage = 'Validación cancelada por el usuario';
    this.statusMessage = 'Validación cancelada';
    this.toastr.info('Validación cancelada. Puedes cerrar esta ventana o volver al inicio.', 'Cancelado');
  }

  retryDownload() {
    if (this.retryCount < this.maxRetries) {
      this.currentState = 'processing';
      this.isDownloading = false;
      this.statusMessage = 'Reintentando...';
      this.updateProgress(0);
      this.initializeDownload();
    }
  }

  goHome() {
    this.router.navigate(['/']);
  }

  private updateProgress(percent: number) {
    this.progressPercent = percent;
    this.showProgress = percent > 0 && percent < 100;
  }

  private handleError(error: any) {
    console.error('Error en descarga:', error);
    this.currentState = 'error';
    this.isDownloading = false;
    this.showProgress = false;
    
    if (typeof error === 'string') {
      this.errorMessage = error;
    } else if (error.message) {
      this.errorMessage = error.message;
    } else {
      this.errorMessage = 'Ocurrió un error inesperado durante la descarga';
    }

    this.toastr.danger(this.errorMessage, 'Error de descarga');
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return 'Tamaño desconocido';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private startLoadingDotsAnimation() {
    this.stopLoadingDotsAnimation();
    
    let dotCount = 0;
    this.loadingDotsInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      this.loadingDots = '.'.repeat(dotCount);
    }, 500);
  }

  private stopLoadingDotsAnimation() {
    if (this.loadingDotsInterval) {
      clearInterval(this.loadingDotsInterval);
      this.loadingDotsInterval = null;
    }
    this.loadingDots = '';
  }
}