import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ChangeDetectionStrategy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DocumentData, Document } from '../../../@core/interfaces/documents';
import { CacheService } from '../../../@core/backend/services/cache.service';
import { forkJoin, Subject, Observable, of, timer } from 'rxjs';
import { takeUntil, catchError, timeout, retry, tap, shareReplay } from 'rxjs/operators';
import { NbSpinnerModule, NbIconModule, NbButtonModule } from '@nebular/theme';
import { CardComponent } from '../card/card.component';

@Component({
    selector: 'ngx-carrousel',
    templateUrl: './carrousel.component.html',
    styleUrls: [
        './carrousel.component.scss',
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NbSpinnerModule, NbIconModule, NbButtonModule, CardComponent]
})
export class CarrouselComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private documents = inject(DocumentData);
  private cacheService = inject(CacheService);
  private cdr = inject(ChangeDetectorRef);

  // Configuración de títulos (legacy: mantenido por compatibilidad; usa `sections`)
  titulos = [
    { titulo: 'Añadidos Recientemente', key: 'recientes' },
    { titulo: 'Los mas populares', key: 'populares' },
    { titulo: 'Los mas vendidos', key: 'vendidos' },
    { titulo: 'Descargas Gratis', key: 'gratis' }
  ];

  // Estados de datos
  resientesList: Document[] = [];
  popularesList: Document[] = [];
  vendidosList: Document[] = [];
  freeList: Document[] = [];

  /**
   * Configuración declarativa de las secciones del carrousel.
   * Centraliza título, key de loading, icono de empty-state y referencia al list,
   * para que el template pueda iterar con un solo @for sin duplicar markup.
   */
  readonly sections: ReadonlyArray<{
    key: 'recientes' | 'populares' | 'vendidos' | 'gratis';
    title: string;
    emptyIcon: string;
    emptyText: string;
    ariaLabel: string;
    list: () => Document[];
  }> = [
    {
      key: 'recientes',
      title: 'Añadidos Recientemente',
      emptyIcon: 'file-text-outline',
      emptyText: 'No hay documentos recientes',
      ariaLabel: 'Carrusel de elementos añadidos recientemente',
      list: () => this.resientesList,
    },
    {
      key: 'populares',
      title: 'Los más populares',
      emptyIcon: 'trending-up-outline',
      emptyText: 'No hay documentos populares',
      ariaLabel: 'Carrusel de elementos más populares',
      list: () => this.popularesList,
    },
    {
      key: 'vendidos',
      title: 'Los más vendidos',
      emptyIcon: 'shopping-cart-outline',
      emptyText: 'No hay documentos vendidos',
      ariaLabel: 'Carrusel de elementos más vendidos',
      list: () => this.vendidosList,
    },
    {
      key: 'gratis',
      title: 'Descargas Gratis',
      emptyIcon: 'gift-outline',
      emptyText: 'No hay documentos gratuitos',
      ariaLabel: 'Carrusel de elementos gratuitos',
      list: () => this.freeList,
    },
  ];

  /** Breakpoints compartidos para los swiper-container. Evita JSON inline duplicado. */
  readonly swiperBreakpoints = {
    320:  { slidesPerView: 1 },
    640:  { slidesPerView: 2 },
    800:  { slidesPerView: 3 },
    1024: { slidesPerView: 3 },
    1280: { slidesPerView: 4 },
    1600: { slidesPerView: 5 },
  };

  /**
   * Estado por sección de los extremos del carrusel: controla la apariencia
   * `disabled` de los botones prev/next cuando ya no hay más slides.
   */
  readonly edgeState: Record<'recientes' | 'populares' | 'vendidos' | 'gratis', { atStart: ReturnType<typeof signal<boolean>>, atEnd: ReturnType<typeof signal<boolean>> }> = {
    recientes: { atStart: signal(true), atEnd: signal(false) },
    populares: { atStart: signal(true), atEnd: signal(false) },
    vendidos:  { atStart: signal(true), atEnd: signal(false) },
    gratis:    { atStart: signal(true), atEnd: signal(false) },
  };
  
  // Estados de UI
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  loadingStates = {
    recientes: true,
    populares: true,
    vendidos: true,
    gratis: true
  };

  // Para prevenir memory leaks
  private destroy$ = new Subject<void>();
  
  // Configuración de caché y rendimiento
  private static globalCache = new Map<string, { data: Document[], timestamp: number }>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos para carrousel principal
  private readonly REQUEST_TIMEOUT = 8000; // 8 segundos timeout
  private readonly MAX_RETRIES = 2;
  
  // Observables compartidos para evitar peticiones duplicadas
  private sharedObservables = new Map<string, Observable<any>>();

  ngOnInit(): void {
    this.loadAllDocumentsOptimized();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.sharedObservables.clear();
  }

  /**
   * Navegación custom en light DOM. Buscamos el `<swiper-container>` hermano
   * dentro del mismo `.swiper-shell` y llamamos a su API.
   */
  slidePrev(ev: Event): void {
    this.getSwiper(ev)?.slidePrev();
  }

  slideNext(ev: Event): void {
    this.getSwiper(ev)?.slideNext();
  }

  /**
   * Suscribe al evento del web component cuando el swiper se inicializa,
   * para mantener sincronizado el estado de los botones prev/next.
   */
  onSwiperInit(key: 'recientes' | 'populares' | 'vendidos' | 'gratis', ev: Event): void {
    const detail = (ev as CustomEvent).detail;
    const swiper = Array.isArray(detail) ? detail[0] : (ev.target as any)?.swiper;
    if (swiper) this.syncEdges(key, swiper);
  }

  /** Tras cada cambio de slide, refresca atStart/atEnd. */
  onSwiperChange(key: 'recientes' | 'populares' | 'vendidos' | 'gratis', ev: Event): void {
    const detail = (ev as CustomEvent).detail;
    const swiper = Array.isArray(detail) ? detail[0] : (ev.target as any)?.swiper;
    if (swiper) this.syncEdges(key, swiper);
  }

  private syncEdges(key: 'recientes' | 'populares' | 'vendidos' | 'gratis', swiper: any): void {
    this.edgeState[key].atStart.set(!!swiper.isBeginning);
    this.edgeState[key].atEnd.set(!!swiper.isEnd);
  }

  /**
   * Fallback: tras cargar datos / cambios de viewport, recorre todos los
   * `<swiper-container>` del componente y refresca atStart/atEnd a partir
   * de la API de Swiper. Cubre el caso en que los eventos del web component
   * no disparan a tiempo en la primera renderización.
   */
  private refreshAllEdges(): void {
    setTimeout(() => {
      const shells = document.querySelectorAll('ngx-carrousel .swiper-shell');
      shells.forEach((shell, idx) => {
        const el = shell.querySelector('swiper-container') as any;
        const swiper = el?.swiper;
        const key = this.sections[idx]?.key;
        if (swiper && key) {
          swiper.update?.();
          this.syncEdges(key, swiper);
        }
      });
      this.cdr.markForCheck();
    }, 50);
  }

  private getSwiper(ev: Event): any {
    const btn = ev.currentTarget as HTMLElement | null;
    const shell = btn?.closest('.swiper-shell');
    const el = shell?.querySelector('swiper-container') as any;
    return el?.swiper;
  }

  /**
   * Carga optimizada de todos los documentos usando forkJoin y caché avanzado
   */
  private loadAllDocumentsOptimized(): void {
    const startTime = performance.now();
    this.isLoading = true;
    this.hasError = false;


    // Crear observables con caché avanzado para cada tipo de documento
    const recientes$ = this.cacheService.getOrSet(
      CacheService.generateKey('documents:recientes'),
      () => this.documents.getDocumentServiceRecientes(),
      CacheService.TTL.DOCUMENTS_MEDIUM
    );

    const populares$ = this.cacheService.getOrSet(
      CacheService.generateKey('documents:populares'),
      () => this.documents.getDocumentServiceMasVistos(),
      CacheService.TTL.DOCUMENTS_MEDIUM
    );

    const vendidos$ = this.cacheService.getOrSet(
      CacheService.generateKey('documents:vendidos'),
      () => this.documents.getDocumentServiceMasVendidos(),
      CacheService.TTL.DOCUMENTS_MEDIUM
    );

    const gratis$ = this.cacheService.getOrSet(
      CacheService.generateKey('documents:gratis'),
      () => this.documents.getDocumentFree(1, 10), // Primera página, 10 elementos para el carrusel
      CacheService.TTL.DOCUMENTS_LONG // Documentos gratis cambian menos frecuentemente
    );

    // Ejecutar todas las peticiones en paralelo con forkJoin
    forkJoin({
      recientes: recientes$,
      populares: populares$,
      vendidos: vendidos$,
      gratis: gratis$
    }).pipe(
      timeout(this.REQUEST_TIMEOUT),
      retry(this.MAX_RETRIES),
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('❌ Error en carga del carrousel:', error);
        this.handleGlobalError(error);
        return of({
          recientes: { result: false, data: [] },
          populares: { result: false, data: [] },
          vendidos: { result: false, data: [] },
          gratis: { result: false, data: [] }
        });
      })
    ).subscribe({
      next: (responses) => {
        const endTime = performance.now();
        const totalTime = Math.round(endTime - startTime);
        
      
        
        // Procesar cada respuesta
        this.resientesList = this.processDocumentResponse(responses.recientes, 'recientes');
        this.popularesList = this.processDocumentResponse(responses.populares, 'populares');
        this.vendidosList = this.processDocumentResponse(responses.vendidos, 'vendidos');
        this.freeList = this.processDocumentResponse(responses.gratis, 'gratis');
        
        this.isLoading = false;
        this.markAllLoaded();
        this.cdr.markForCheck();
        this.refreshAllEdges();
      },
      error: (error) => {
        this.handleGlobalError(error);
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Obtiene datos del caché o hace la petición al servidor
   * Compatible con Redis backend caching
   */
  private getCachedOrFetch(key: string, fetchFn: () => Observable<any>): Observable<any> {
    const cached = CarrouselComponent.globalCache.get(key);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return of(cached.data);
    }

    // Si ya existe una petición en curso, compartirla
    if (this.sharedObservables.has(key)) {
      return this.sharedObservables.get(key)!;
    }

    // Crear nueva petición compartida
    const request$ = fetchFn().pipe(
      timeout(this.REQUEST_TIMEOUT),
      retry(this.MAX_RETRIES),
      tap(response => {
        if (response.result && response.data) {
          // Guardar en caché para futuras peticiones
          CarrouselComponent.globalCache.set(key, {
            data: response,
            timestamp: Date.now()
          });
        }
      }),
      shareReplay(1), // Compartir resultado con múltiples suscriptores
      tap(() => {
        // Limpiar observable compartido al completarse
        this.sharedObservables.delete(key);
      }),
      catchError(error => {
        console.error(`❌ Error en petición ${key}:`, error);
        this.sharedObservables.delete(key);
        throw error;
      })
    );

    this.sharedObservables.set(key, request$);
    return request$;
  }

  /**
   * Verifica si el caché sigue siendo válido
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  /**
   * Procesa la respuesta de documentos y aplica transformaciones
   */
  private processDocumentResponse(response: any, type: string): Document[] {
    this.loadingStates[type as keyof typeof this.loadingStates] = false;
    
    if (!response || !response.result || !response.data) {
      console.warn(`⚠️ Respuesta inválida para ${type}`);
      return [];
    }

    return response.data.map((doc: Document) => {
      if (doc.format === 'ZIP' && doc.imagenUrlPublic) {
        const urls = doc.imagenUrlPublic.split('|');
        if (urls.length > 0) {
          doc.imagenUrlPublic = urls[0];
        }
      }
      if (doc.format === 'ZIP' && doc.imagenThumbUrlPublic) {
        const thumbs = doc.imagenThumbUrlPublic.split('|');
        if (thumbs.length > 0) {
          doc.imagenThumbUrlPublic = thumbs[0];
        }
      }
      return doc;
    }).slice(0, 20); // Limitar a 20 elementos por carrousel para mejor rendimiento
  }

  /**
   * Marca todos los estados como cargados
   */
  private markAllLoaded(): void {
    Object.keys(this.loadingStates).forEach(key => {
      this.loadingStates[key as keyof typeof this.loadingStates] = false;
    });
  }

  /**
   * Maneja errores globales del componente
   */
  private handleGlobalError(error: any): void {
    this.isLoading = false;
    this.hasError = true;
    this.markAllLoaded();
    this.cdr.markForCheck();
    
    if (error.name === 'TimeoutError') {
      this.errorMessage = 'Las peticiones están tardando demasiado. Intenta recargar.';
      console.error('⏰ Timeout en carga del carrousel');
    } else if (error.status === 0) {
      this.errorMessage = 'No se puede conectar al servidor. Verifica tu conexión.';
      console.error('🌐 Error de conexión en carrousel');
    } else {
      this.errorMessage = 'Error al cargar los documentos. Intenta recargar la página.';
      console.error('💥 Error general en carrousel:', error);
    }
  }

  /**
   * Reinicia la carga limpiando caché
   */
  public reloadAllData(): void {
    
    // Limpiar caché específico de documentos
    this.cacheService.invalidateByPattern('documents:.*');
    this.sharedObservables.clear();
    
    // Reiniciar estados
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    Object.keys(this.loadingStates).forEach(key => {
      this.loadingStates[key as keyof typeof this.loadingStates] = true;
    });
    
    // Recargar datos
    this.loadAllDocumentsOptimized();
  }

  /**
   * Limpia caché específico (útil para invalidación selectiva)
   */
  public clearCache(type?: string): void {
    if (type) {
      const key = CacheService.generateKey(`documents:${type}`);
      this.cacheService.delete(key);
      this.sharedObservables.delete(type);
    } else {
      this.cacheService.invalidateByPattern('documents:.*');
      this.sharedObservables.clear();
    }
  }


}
