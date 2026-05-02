import { Component, Input, OnInit, OnDestroy, HostListener, inject, ChangeDetectorRef } from '@angular/core';
import { Document, DocumentData } from '../../../@core/interfaces/documents';
import { Subject, Observable, of, timer } from 'rxjs';
import { takeUntil, timeout, catchError, debounceTime, distinctUntilChanged, retry } from 'rxjs/operators';
import { NbSpinnerModule, NbIconModule, NbButtonModule } from '@nebular/theme';
import { DocumentCardComponent } from '../document-card/document-card.component';

@Component({
    selector: 'ngx-carrousel-vertical',
    templateUrl: './carrousel-vertical.component.html',
    styleUrls: ['./carrousel-vertical.component.scss'],
    standalone: true,
    imports: [NbSpinnerModule, NbIconModule, NbButtonModule, DocumentCardComponent]
})
export class CarrouselVerticalComponent implements OnInit, OnDestroy {
  private documentService = inject(DocumentData);
  private cdr = inject(ChangeDetectorRef);

  @Input() category!: string;

  listDocuments: Document[] = [];
  isHorizontalLayout: boolean = false;
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Para evitar memory leaks
  private destroy$ = new Subject<void>();
  
  // Caché simple para evitar peticiones innecesarias
  private static documentCache = new Map<string, Document[]>();
  private static cacheTimestamp = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private readonly REQUEST_TIMEOUT = 10000; // 10 segundos timeout
  private readonly MAX_RETRIES = 2;

  ngOnInit(): void {
    this.checkLayoutMode();
    console.log('[CarrouselVertical] ngOnInit - category:', this.category);
    // Cargar documentos recomendados al inicializar
    timer(100).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log('[CarrouselVertical] Loading documents for category:', this.category);
      this.loadRecommendedDocuments();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkLayoutMode();
  }

  private checkLayoutMode(): void {
    // Detectar si debe ser horizontal basado en el ancho de pantalla
    // y la posición del contenedor (abajo vs lateral)
    const screenWidth = window.innerWidth;
    this.isHorizontalLayout = screenWidth >= 1000 && screenWidth <= 1399;
  }

  private loadRecommendedDocuments(): void {
    console.log('[CarrouselVertical] loadRecommendedDocuments called, category:', this.category);
    if (!this.category) {
      console.warn('[CarrouselVertical] No category provided');
      return;
    }

    // Verificar caché primero
    const cacheKey = this.getCacheKey();
    console.log('[CarrouselVertical] Cache key:', cacheKey);
    const cachedData = this.getCachedDocuments(cacheKey);
    console.log('[CarrouselVertical] Cached data:', cachedData);
    if (cachedData) {
      console.log('[CarrouselVertical] Using cached data:', cachedData.length, 'documents');
      this.listDocuments = cachedData;
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    const startTime = performance.now();
    console.log('[CarrouselVertical] Making API request...');

    // Intentar usar primero el método más rápido si existe
    const documentRequest = this.getOptimizedDocuments().pipe(
      timeout(this.REQUEST_TIMEOUT),
      retry(this.MAX_RETRIES),
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('❌ Error al cargar documentos:', error);
        this.handleLoadError(error);
        return of({ result: false, status: 500, data: [], pagination: null });
      })
    );

    documentRequest.subscribe({
      next: (response) => {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        console.log('[CarrouselVertical] API response received:', {
          result: response.result,
          dataLength: response.data?.length,
          duration: duration + 'ms'
        });
        
        if (response.result && response.data) {
          this.listDocuments = this.processDocuments(response.data);
          console.log('[CarrouselVertical] Processed documents:', this.listDocuments.length);
          this.setCachedDocuments(this.getCacheKey(), this.listDocuments);
          this.isLoading = false;
        } else {
          console.warn('[CarrouselVertical] Invalid response:', response);
          this.handleLoadError(new Error('Respuesta inválida del servidor'));
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('[CarrouselVertical] API error:', error);
        this.handleLoadError(error);
        this.cdr.markForCheck();
      }
    });
  }

  private getOptimizedDocuments(): Observable<any> {
    const filterParams: Record<string, string> = {};

    const currentUrl = window.location.href;
    const isDetailPage = currentUrl.includes('/detail/');
    console.log('[CarrouselVertical] getOptimizedDocuments - isDetailPage:', isDetailPage);

    if (isDetailPage) {
      const ctx = this.getCurrentDocumentContext();
      console.log('[CarrouselVertical] Document context:', ctx);

      if (ctx?.subjectId) {
        // subjectId implica toda la jerarquía: category → level → subject
        // Devuelve todos los grados de esa materia, más variedad que gradeId
        filterParams['subjectId'] = String(ctx.subjectId);

        // format sí es necesario ya que no forma parte de la jerarquía
        if (ctx.format === 'ZIP' || ctx.format === 'DOCX') {
          filterParams['format'] = ctx.format;
        }
      } else {
        // Fallback: sin gradeId usar jerarquía explícita
        if (this.category) {
          filterParams['category'] = this.category.toUpperCase();
        }
        if (ctx?.materia && ctx.materia !== 'null') {
          filterParams['materia'] = ctx.materia;
        }
        if (ctx?.nivel) {
          filterParams['nivel'] = ctx.nivel;
        }
        if (ctx?.format === 'ZIP' || ctx?.format === 'DOCX') {
          filterParams['format'] = ctx.format;
        }
      }
    } else {
      // Fuera de página de detalle: filtrar solo por categoría
      if (this.category) {
        filterParams['category'] = this.category.toUpperCase();
      }
    }

    filterParams['documentoLibre'] = 'false';
    console.log('[CarrouselVertical] Final filter params:', filterParams);
    return this.documentService.filterDocuments(filterParams, 1, 15);
  }

  /**
   * Obtiene el contexto del documento actual desde diferentes fuentes
   */
  private getCurrentDocumentContext(): any {
    try {
      // Intentar desde sessionStorage (si se guardó en detail component)
      const sessionData = sessionStorage.getItem('currentDocument');
      console.log('[CarrouselVertical] sessionStorage currentDocument:', sessionData);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
      
      // Intentar desde localStorage como fallback
      const localData = localStorage.getItem('currentDocument');
      console.log('[CarrouselVertical] localStorage currentDocument:', localData);
      if (localData) {
        return JSON.parse(localData);
      }
      
      // Si no hay datos guardados, retornar null
      return null;
    } catch (error) {
      console.warn('[CarrouselVertical] Error al obtener contexto:', error);
      return null;
    }
  }

  private processDocuments(documents: Document[]): Document[] {
    return documents.map((doc: Document) => {
      if (doc.format === 'ZIP' && doc.imagenUrlPublic) {
        const urls = doc.imagenUrlPublic.split('|');
        if (urls.length > 0) {
          doc.imagenUrlPublic = urls[0];
        }
      }
      return doc;
    }).slice(0, 10); // Limitar a 10 documentos para mejor rendimiento
  }

  private getCachedDocuments(category: string): Document[] | null {
    const cached = CarrouselVerticalComponent.documentCache.get(category);
    const timestamp = CarrouselVerticalComponent.cacheTimestamp.get(category);
    
    if (cached && timestamp) {
      const now = Date.now();
      if (now - timestamp < this.CACHE_DURATION) {
        return cached;
      } else {
        // Limpiar caché expirado
        CarrouselVerticalComponent.documentCache.delete(category);
        CarrouselVerticalComponent.cacheTimestamp.delete(category);
      }
    }
    
    return null;
  }

  private setCachedDocuments(category: string, documents: Document[]): void {
    CarrouselVerticalComponent.documentCache.set(category, documents);
    CarrouselVerticalComponent.cacheTimestamp.set(category, Date.now());
  }

  private handleLoadError(error: any): void {
    this.isLoading = false;
    this.hasError = true;
    
    if (error.name === 'TimeoutError') {
      this.errorMessage = 'La solicitud está tardando demasiado. Intenta nuevamente.';
      console.error('⏰ Timeout en la petición de documentos');
    } else if (error.status === 0) {
      this.errorMessage = 'No se puede conectar al servidor. Verifica tu conexión.';
      console.error('🌐 Error de conexión');
    } else {
      this.errorMessage = 'Error al cargar los documentos. Intenta nuevamente.';
      console.error('💥 Error general:', error);
    }
  }

  private getCacheKey(): string {
    const ctx = this.getCurrentDocumentContext();
    const subjectId = ctx?.subjectId ?? 'all';
    return `${this.category}-${subjectId}`;
  }

  public retryLoad(): void {
    // Limpiar caché para esta combinación categoría+grado y recargar
    const cacheKey = this.getCacheKey();
    CarrouselVerticalComponent.documentCache.delete(cacheKey);
    CarrouselVerticalComponent.cacheTimestamp.delete(cacheKey);
    this.loadRecommendedDocuments();
  }

  trackByDocument(index: number, document: Document): any {
    return document.id || index;
  }
}
