import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { register } from 'swiper/element';
import { DocumentData, Document } from '../../../@core/interfaces/documents';
import { CacheService } from '../../../@core/backend/services/cache.service';
import { forkJoin, Subject, Observable, of, timer } from 'rxjs';
import { takeUntil, catchError, timeout, retry, tap, shareReplay } from 'rxjs/operators';
register();

@Component({
  selector: 'ngx-carrousel',
  templateUrl: './carrousel.component.html',
  styleUrls: [
    './carrousel.component.scss',
  ]
})
export class CarrouselComponent implements OnInit, OnDestroy {
  // Configuración de títulos
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

  constructor(
    private router: Router,
    private documents: DocumentData,
    private cacheService: CacheService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Iniciando carga optimizada del carrousel principal');
    this.loadAllDocumentsOptimized();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.sharedObservables.clear();
  }

  /**
   * Carga optimizada de todos los documentos usando forkJoin y caché avanzado
   */
  private loadAllDocumentsOptimized(): void {
    const startTime = performance.now();
    this.isLoading = true;
    this.hasError = false;

    console.log('🚀 Iniciando carga optimizada con CacheService');

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
      () => this.documents.getDocumentFree(),
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
        
        console.log(`✅ Carrousel cargado en ${totalTime}ms`);
        console.log('📊 Estadísticas de caché:', this.cacheService.getStats());
        
        // Procesar cada respuesta
        this.resientesList = this.processDocumentResponse(responses.recientes, 'recientes');
        this.popularesList = this.processDocumentResponse(responses.populares, 'populares');
        this.vendidosList = this.processDocumentResponse(responses.vendidos, 'vendidos');
        this.freeList = this.processDocumentResponse(responses.gratis, 'gratis');
        
        this.isLoading = false;
        this.markAllLoaded();
      },
      error: (error) => {
        this.handleGlobalError(error);
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
      console.log(`📦 Usando caché para ${key}`);
      return of(cached.data);
    }

    // Si ya existe una petición en curso, compartirla
    if (this.sharedObservables.has(key)) {
      console.log(`🔄 Reutilizando petición en curso para ${key}`);
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
          console.log(`💾 Guardado en caché: ${key}`);
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
    console.log('🔄 Recargando carrousel con invalidación de caché...');
    
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
      console.log(`🗑️ Caché limpiado para ${type}`);
    } else {
      this.cacheService.invalidateByPattern('documents:.*');
      this.sharedObservables.clear();
      console.log('🗑️ Todo el caché de documentos limpiado');
    }
  }


}
