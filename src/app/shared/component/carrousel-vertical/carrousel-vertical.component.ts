import { Component, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Document, DocumentData } from '../../../@core/interfaces/documents';
import { Subject, Observable, of, timer } from 'rxjs';
import { takeUntil, timeout, catchError, debounceTime, distinctUntilChanged, retry } from 'rxjs/operators';

@Component({
  selector: 'ngx-carrousel-vertical',
  templateUrl: './carrousel-vertical.component.html',
  styleUrls: ['./carrousel-vertical.component.scss']
})
export class CarrouselVerticalComponent implements OnInit, OnDestroy {
  @Input() category: string;

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

  constructor(private documentService: DocumentData) { }

  ngOnInit(): void {
    this.checkLayoutMode();
    
    // Cargar documentos con debounce para evitar múltiples peticiones
    timer(100).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
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
    if (!this.category) {
      console.warn('CarrouselVerticalComponent: No category provided');
      return;
    }

    // Verificar caché primero
    const cachedData = this.getCachedDocuments(this.category);
    if (cachedData) {
      console.log('📦 Usando documentos del caché para:', this.category);
      this.listDocuments = cachedData;
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    console.log('🔄 Cargando documentos para categoría:', this.category);
    const startTime = performance.now();

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
        
        console.log(`✅ Documentos cargados en ${duration}ms para:`, this.category);
        
        if (response.result && response.data) {
          this.listDocuments = this.processDocuments(response.data);
          this.setCachedDocuments(this.category, this.listDocuments);
          this.isLoading = false;
        } else {
          this.handleLoadError(new Error('Respuesta inválida del servidor'));
        }
      },
      error: (error) => {
        this.handleLoadError(error);
      }
    });
  }

  private getOptimizedDocuments(): Observable<any> {
    // Usar filterDocuments para obtener documentos relacionados
    // Construir parámetros de filtro basados en la categoría y contexto disponible
    const filterParams: Record<string, string> = {};
    
    // Siempre incluir la categoría si está disponible
    if (this.category) {
      filterParams['category'] = this.category.toUpperCase();
    }
    
    // Si estamos en una página de detalle, intentar obtener contexto del documento actual
    // desde la URL o localStorage para filtros más específicos
    const currentUrl = window.location.href;
    const isDetailPage = currentUrl.includes('/detail/');
    
    if (isDetailPage) {
      // Intentar obtener datos del documento desde localStorage o sessionStorage
      const currentDocumentData = this.getCurrentDocumentContext();
      
      if (currentDocumentData) {
        // Agregar materia si está disponible y no es null
        if (currentDocumentData.materia && currentDocumentData.materia !== 'null') {
          filterParams['materia'] = currentDocumentData.materia;
        }
        
        // Para documentos ZIP, filtrar solo por ZIP
        if (currentDocumentData.format === 'ZIP') {
          filterParams['format'] = 'ZIP';
        }

        if (currentDocumentData.format === 'DOCX') {
          filterParams['format'] = 'DOCX';
        }
        
        // Agregar nivel si está disponible
        if (currentDocumentData.nivel) {
          filterParams['nivel'] = currentDocumentData.nivel;
        }
      }
    }
    
    console.log('🔍 Filtrando documentos con parámetros:', filterParams);
    
    // Usar filterDocuments con límite de 15 elementos para mejor rendimiento
    return this.documentService.filterDocuments(filterParams, 1, 15);
  }

  /**
   * Obtiene el contexto del documento actual desde diferentes fuentes
   */
  private getCurrentDocumentContext(): any {
    try {
      // Intentar desde sessionStorage (si se guardó en detail component)
      const sessionData = sessionStorage.getItem('currentDocument');
      if (sessionData) {
        return JSON.parse(sessionData);
      }
      
      // Intentar desde localStorage como fallback
      const localData = localStorage.getItem('currentDocument');
      if (localData) {
        return JSON.parse(localData);
      }
      
      // Si no hay datos guardados, retornar null
      return null;
    } catch (error) {
      console.warn('⚠️ Error al obtener contexto del documento:', error);
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

  public retryLoad(): void {
    // Limpiar caché para esta categoría y recargar
    CarrouselVerticalComponent.documentCache.delete(this.category);
    CarrouselVerticalComponent.cacheTimestamp.delete(this.category);
    this.loadRecommendedDocuments();
  }

  trackByDocument(index: number, document: Document): any {
    return document.id || index;
  }
}
