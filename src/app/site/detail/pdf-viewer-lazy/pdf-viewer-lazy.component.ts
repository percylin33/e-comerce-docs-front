import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { Subject } from 'rxjs';
import { takeUntil, catchError, finalize } from 'rxjs/operators';

// Caché global de PDFs para no recargar
const PDF_CACHE = new Map<string, Uint8Array>();

@Component({
  selector: 'ngx-pdf-viewer-lazy',
  standalone: true,
  imports: [CommonModule, NgxExtendedPdfViewerModule],
  template: `
    <div style="width: 100%; height: 100%; position: relative;">
      @if (isLoading) {
        <div style="position: absolute; inset: 0; display: flex; flex-direction: column; 
                    align-items: center; justify-content: center; background: #e1ecff; z-index: 10;">
          <div style="width: 44px; height: 44px; border: 4px solid rgba(37,99,235,0.2); 
                      border-top-color: #2563eb; border-radius: 50%; 
                      animation: spin 0.9s linear infinite;"></div>
          <p style="margin-top: 12px; color: #475569;">
            {{ loadingProgress > 0 ? 'Descargando: ' + loadingProgress + '%' : 'Cargando PDF...' }}
          </p>
        </div>
      }
      
      @if (error && (!useGoogleDriveFallback || disableFallback)) {
        <div style="position: absolute; inset: 0; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; background: #fff3cd; z-index: 10;">
          <span style="font-size: 32px;">⚠️</span>
          <p style="color: #b45309; margin: 8px 0;">
            {{ disableFallback ? 'Error al cargar el PDF (modo estricto activado)' : 'Error al cargar el PDF' }}
          </p>
          <button (click)="retryLoad()"
                  style="padding: 8px 20px; background: #2563eb; color: white;
                         border: none; border-radius: 24px; cursor: pointer;">
            Reintentar
          </button>
        </div>
      }
      
      @if (pdfData) {
        <ngx-extended-pdf-viewer
          [src]="pdfData"
          [textLayer]="false"
          [showToolbar]="true"
          [showSidebarButton]="false"
          [showFindButton]="false"
          [showPagingButtons]="true"
          [showDrawEditor]="false"
          [showTextEditor]="false"
          [showZoomButtons]="true"
          [showPresentationModeButton]="false"
          [showOpenFileButton]="false"
          [showPrintButton]="false"
          [showDownloadButton]="false"
          [showSecondaryToolbarButton]="false"
          [showRotateButton]="false"
          [showHandToolButton]="false"
          [showScrollingButton]="false"
          [showSpreadButton]="false"
          [showPropertiesButton]="false"
          [useBrowserLocale]="true"
          [enablePrint]="false"
          [delayFirstPage]="100"
          (pdfLoaded)="onPdfLoaded()"
          (pdfLoadingFailed)="onPdfLoadError($event)"
          (pageRendered)="onPageRendered()"
          height="100%">
        </ngx-extended-pdf-viewer>
      } @else if (useGoogleDriveFallback && safeGoogleDriveUrl) {
        <div style="height: 100%; display: flex; flex-direction: column;">
          <p style="background: #fff3cd; padding: 8px; margin: 0; font-size: 12px; text-align: center; color: #856404;">
            Vista previa alternativa (Google Drive)
          </p>
          <iframe [src]="safeGoogleDriveUrl" 
                  style="width: 100%; flex: 1; border: none;" 
                  allowfullscreen>
          </iframe>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PdfViewerLazyComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  @Input() src: string = '';
  @Input() googleDriveUrl: string = '';
  @Input() height: string = '100%';
  @Input() disableFallback: boolean = false; // Si true, no usa iframe de Google Drive
  @Output() loaded = new EventEmitter<void>();
  @Output() loadError = new EventEmitter<unknown>();
  @Output() pageRendered = new EventEmitter<void>();

  pdfData: Uint8Array | null = null;
  safeGoogleDriveUrl: SafeResourceUrl | null = null;
  isLoading = false;
  error = false;
  useGoogleDriveFallback = false;
  loadingProgress = 0;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    console.log('[PdfViewerLazy] ngOnInit called');
    console.log('[PdfViewerLazy] src:', this.src);
    console.log('[PdfViewerLazy] googleDriveUrl:', this.googleDriveUrl);
    console.log('[PdfViewerLazy] disableFallback:', this.disableFallback);
    if (this.googleDriveUrl) {
      this.safeGoogleDriveUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.googleDriveUrl);
    }
    this.loadPdf();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Liberar referencia al PDF para evitar problemas con ArrayBuffer
    console.log('[PdfViewerLazy] Component destroyed, clearing pdfData');
    this.pdfData = null;
  }

  private loadPdf(): void {
    if (!this.src) {
      this.error = true;
      this.loadError.emit('No src provided');
      return;
    }

    // 1. Verificar caché primero
    if (PDF_CACHE.has(this.src)) {
      console.log('[PdfViewerLazy] ✅ Cache hit for:', this.src);
      const cached = PDF_CACHE.get(this.src)!;
      // Copia REAL del Uint8Array - slice() crea nueva instancia con datos copiados
      this.pdfData = cached.slice();
      console.log('[PdfViewerLazy] Copied cached data, length:', this.pdfData.length);
      this.loaded.emit();
      this.pageRendered.emit();
      return;
    }

    this.isLoading = true;
    this.error = false;
    this.loadingProgress = 0;

    // 2. Petición con progress tracking y cancelación
    this.http.get(this.src, { 
      responseType: 'arraybuffer',
      reportProgress: true,
      observe: 'events'
    }    ).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (event: any) => {
        if (event.type === 1) { // HttpEventType.DownloadProgress
          if (event.total) {
            this.loadingProgress = Math.round((event.loaded / event.total) * 100);
          }
        } else if (event.type === 4) { // HttpEventType.Response
          const data = event.body as ArrayBuffer;
          this.pdfData = new Uint8Array(data);

          // 3. Guardar COPIA en caché (limitar a 10MB)
          if (data.byteLength < 10 * 1024 * 1024) {
            const cacheCopy = this.pdfData.slice();
            PDF_CACHE.set(this.src, cacheCopy);
            console.log('[PdfViewerLazy] Cached PDF copy, size:', cacheCopy.length);
          }

          this.loaded.emit();
          this.pageRendered.emit();
        }
      },
      error: (err) => {
        console.error('[PdfViewerLazy] HTTP Error:', err);
        this.error = true;
        if (!this.disableFallback && this.googleDriveUrl) {
          console.log('[PdfViewerLazy] Activating Google Drive fallback');
          this.useGoogleDriveFallback = true;
        } else {
          console.log('[PdfViewerLazy] Fallback disabled or no Google Drive URL');
          this.useGoogleDriveFallback = false;
        }
        this.isLoading = false;
        this.loadError.emit(err);
      }
    });
  }

  onPdfLoaded(): void {
    this.loaded.emit();
  }

  onPdfLoadError(event: unknown): void {
    this.error = true;
    if (!this.disableFallback && this.googleDriveUrl) {
      console.log('[PdfViewerLazy] PDF load error, activating fallback');
      this.useGoogleDriveFallback = true;
    } else {
      console.log('[PdfViewerLazy] PDF load error, fallback disabled');
      this.useGoogleDriveFallback = false;
    }
    this.loadError.emit(event);
  }

  onPageRendered(): void {
    this.pageRendered.emit();
  }

  retryLoad(): void {
    this.error = false;
    this.useGoogleDriveFallback = false;
    this.pdfData = null;
    this.loadingProgress = 0;
    // Limpiar caché en retry
    PDF_CACHE.delete(this.src);
    this.loadPdf();
  }
}
