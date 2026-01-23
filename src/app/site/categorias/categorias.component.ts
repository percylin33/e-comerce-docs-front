import { Component, OnDestroy, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DocumentData, Document } from '../../@core/interfaces/documents';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { SearchComponent } from '../../shared/component/search/search.component';
import { debounce } from 'lodash';
import { trigger, style, transition, animate } from '@angular/animations';
import { UrlSyncService } from './services/url-sync.service';
import { NbToastrService } from '@nebular/theme';
import { CategoryConfigService } from './services/category-config.service';
import { CategoryFilterService } from './services/category-filter.service';
import { DocumentCacheService } from './services/document-cache.service';
import { PaginationService } from './services/core/pagination.service';
import { CategoryStateMachineService } from './services/core/category-state-machine.service';
import { Categoria, CurrentStep } from './models/category-state.model';
import { FilterParamsStrategyFactory } from './strategies/filter-params-strategy.factory';
import { FilterContext } from './strategies/filter-params-strategy.interface';
import { DocumentLoaderService } from './services/document-loader.service';
import { SearchService, SearchContext } from './services/search.service';
import { FilterVisibilityService, FilterVisibilityState } from './services/filter-visibility.service';

// Interfaces y tipos para mejor tipado
interface AreaData {
  nivel: string;
  area: string;
  icono: string;
  justificacion: string;
}

export interface FilterParams {
  [key: string]: string;
}

@Component({
  selector: 'ngx-categorias',
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: '0', opacity: '0', transform: 'translateY(-20px)' }),
        animate('0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          style({ height: '*', opacity: '1', transform: 'translateY(0)' })
        )
      ]),
      transition(':leave', [
        style({ height: '*', opacity: '1', transform: 'translateY(0)' }),
        animate('0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          style({ height: '0', opacity: '0', transform: 'translateY(-20px)' })
        )
      ])
    ])
  ]
})
export class CategoriasComponent implements OnInit, OnDestroy {
  @ViewChild(SearchComponent) searchComponent!: SearchComponent;

  // Constants
  private readonly DEBOUNCE_TIME = 300;

  // Properties
  categoriaActual: Categoria = 'PLANIFICACION';
  private routeSubscription!: Subscription;
  private readonly destroy$ = new Subject<void>();
  private isFirstInit = true; // Bandera para detectar primera inicialización
  private isInternalFilterChange = false; // Bandera para evitar ciclos al cambiar filtros
  private protectVisibilityFlags = false; // Protege banderas de visibilidad durante cambios internos

  ducumentList: Document[] = [];
  originalDocuments: Document[] = [];

  // Pagination (server-side) - Gestionado por PaginationService
  pagination$ = this.paginationService.pagination$;
  paginatedDocuments: Document[] = [];

  // State Machine - Gestiona el flujo de estados
  categoryState$ = this.stateMachine.state$;

  niveles: string[] = [];
  materias: string[] = [];
  grados: string[] = [];
  servicios: string[] = [];

  selectedMateria = '';
  selectedNivel = '';
  selectedGrado = '';
  selectedServicio = '';

  currentStep: CurrentStep = 'niveles';
  hasSearched = false;
  comingFromFilter = false;

  // Filter visibility state
  shouldShowNivelCard = false;
  shouldShowMateriaCard = false;
  shouldShowGradoCard = false;

  // Computed properties for select visibility
  get shouldShowMateriaSelect(): boolean {
    return (
      this.categoriaActual === 'PLANIFICACION' ||
      this.categoriaActual === 'EVALUACION' ||
      this.categoriaActual === 'ESTRATEGIAS' ||
      this.categoriaActual === 'EBOOKS' ||
      this.categoriaActual === 'TALLERES' ||
      this.categoriaActual === 'PLAN_LECTOR' ||
      this.categoriaActual === 'REFORZAMIENTO' ||
      (this.categoriaActual === 'KITS' && this.selectedNivel === 'SECUNDARIA') ||
      (this.categoriaActual === 'KITS' && !!this.selectedMateria)
    );
  }

  get shouldShowGradoSelect(): boolean {
    return (
      this.categoriaActual === 'PLANIFICACION' ||
      this.categoriaActual === 'EBOOKS' ||
      this.categoriaActual === 'PLAN_LECTOR' ||
      this.categoriaActual === 'REFORZAMIENTO' ||
      (this.categoriaActual === 'KITS' && (
        this.selectedNivel === 'INICIAL' ||
        this.selectedNivel === 'PRIMARIA' ||
        this.selectedNivel === 'SECUNDARIA'
      )) ||
      (this.categoriaActual === 'KITS' && !!this.selectedGrado)
    );
  }

  // EBOOKS/TALLERES functionality
  currentSubCategoria: 'EBOOKS' | 'TALLERES' = 'EBOOKS';
  showSubCategoryToggle = false;

  // KITS functionality
  showSituacionesButton = false;
  situaciones: any[] = [];
  selectedSituacion: any = null;
  isLoadingSituaciones = false;
  showSituacionesList = false;

  // Loading states
  isLoadingDocuments = false;
  isLoadingFilters = false;

  // Obtener áreas data desde el servicio
  get areasData() {
    return this.config.AREAS_DATA;
  }

  constructor(
    private route: ActivatedRoute,
    private document: DocumentData,
    private cdr: ChangeDetectorRef,
    private urlSync: UrlSyncService,
    private toastrService: NbToastrService,
    private config: CategoryConfigService,
    private filterService: CategoryFilterService,
    private cacheService: DocumentCacheService,
    private paginationService: PaginationService,
    private stateMachine: CategoryStateMachineService,
    private filterParamsFactory: FilterParamsStrategyFactory,
    private documentLoader: DocumentLoaderService,
    private searchService: SearchService,
    private filterVisibility: FilterVisibilityService
  ) {
    this.cargarDocumentos = debounce(this.cargarDocumentos.bind(this), this.DEBOUNCE_TIME);
  }

  ngOnInit(): void {
    this.initializeRouteSubscriptions();
    // NO suscribirse a filterChanges aquí - causa conflictos con valores de URL
    // Los cambios de filtros se manejan directamente en los event handlers
    this.subscribeToStateMachine();
    this.initializeFilterVisibility();
  }

  /**
   * Suscribe a cambios del state machine
   * Sincroniza currentStep con el estado del servicio
   */
  private subscribeToStateMachine(): void {
    this.stateMachine.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        const hasUrlParams = !!(this.route.snapshot.queryParams['nivel'] || this.route.snapshot.queryParams['materia']);

        // Si estamos en paso de materias y no hay materia seleccionada, NO sobrescribir
        // Esto es CRÍTICO para mantener la visibilidad de cartas cuando la categoría requiere materia
        const isWaitingForMateria = this.currentStep === 'materias' && !this.selectedMateria;

     

        // NO sobrescribir currentStep si:
        // 1. Las banderas están protegidas (cambio interno en proceso)
        // 2. Estamos esperando selección de materia (paso crítico)
        // 3. Hay URL params (FilterVisibilityService tiene prioridad)
        // 4. Ya estamos en paso de materias/grados/situaciones (pasos intermedios)
        const isIntermediateStep = ['materias', 'grados', 'situaciones'].includes(this.currentStep);
        if (!this.protectVisibilityFlags && !isWaitingForMateria && !hasUrlParams && !isIntermediateStep) {
          this.currentStep = state.currentStep;
          
        }
        this.comingFromFilter = state.comingFromFilter;
      });
  }

  /**
   * Inicializa la visibilidad de filtros basada en categoría y URL
   */
  private initializeFilterVisibility(): void {
    const urlParams = this.route.snapshot.queryParams;
    this.updateFilterVisibility(urlParams);
  }

  /**
   * Actualiza la visibilidad de filtros según categoría y parámetros URL
   */
  private updateFilterVisibility(urlParams: any = {}): void {
    // Primero cargar las listas de opciones para validar los valores
    this.niveles = this.config.getNiveles(this.categoriaActual);

    // Si hay nivel en URL, cargar materias y grados
    const nivelFromUrl = urlParams['nivel'];
    if (nivelFromUrl) {
      this.materias = this.config.getMaterias(nivelFromUrl, this.categoriaActual);

      const materiaFromUrl = urlParams['materia'];
      if (materiaFromUrl) {
        this.grados = this.config.getGrados(nivelFromUrl, materiaFromUrl, this.categoriaActual);
      }
    }

    const visibility = this.filterVisibility.calculateVisibility(
      this.categoriaActual,
      urlParams
    );

    this.applyVisibilityConfig(visibility);
  }

  /**
   * Aplica la configuración de visibilidad calculada
   */
  private applyVisibilityConfig(visibility: FilterVisibilityState): void {
    

    // Si hay protección activa, NO aplicar NINGUNA configuración
    // Esto evita que la URL sobrescriba los valores durante cambios internos
    if (this.protectVisibilityFlags) {
      
      return;
    }

    // Aplicar banderas de visibilidad
    this.shouldShowNivelCard = visibility.shouldShowNivelCard;
    this.shouldShowMateriaCard = visibility.shouldShowMateriaCard;
    this.shouldShowGradoCard = visibility.shouldShowGradoCard;

    // Aplicar valores preseleccionados desde URL
    if (visibility.preselectedNivel) {
      this.selectedNivel = visibility.preselectedNivel;
    }
    if (visibility.preselectedMateria) {
      this.selectedMateria = visibility.preselectedMateria;
    }
    if (visibility.preselectedGrado) {
      this.selectedGrado = visibility.preselectedGrado;
    }

    // Actualizar currentStep con el valor calculado por el servicio
    if (visibility.initialStep) {
      this.currentStep = visibility.initialStep;
      
    }

    // Sincronizar con filterService después de aplicar valores
    this.filterService.updateFilters({
      nivel: this.selectedNivel || '',
      materia: this.selectedMateria || '',
      grado: this.selectedGrado || '',
      servicio: this.selectedServicio || '',
      situacion: this.selectedSituacion
    });
  }

  /**
   * [DESHABILITADO] Suscribe a cambios en el estado de filtros desde el servicio
   * NOTA: Esta suscripción causa conflictos con valores de URL.
   * Los filtros se manejan directamente en los event handlers (onNivelChange, onMateriaChange, etc.)
   * y se sincronizan explícitamente donde es necesario.
   */
  private subscribeToFilterChanges(): void {
    // DESHABILITADO - causa conflictos con valores de URL
    // this.filterService.filterState$
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(state => {
    //     this.selectedNivel = state.nivel;
    //     this.selectedMateria = state.materia;
    //     this.selectedGrado = state.grado;
    //     this.selectedServicio = state.servicio;
    //     this.selectedSituacion = state.situacion;
    //   });
  }

  private initializeRouteSubscriptions(): void {
    this.routeSubscription = this.route.paramMap.pipe(
      switchMap(params => {
        const newCategoria = params.get('service') as Categoria || 'PLANIFICACION';
        // En la primera carga, obtener queryParams primero para saber si hay filtros
        if (this.isFirstInit) {
          const currentQueryParams = this.route.snapshot.queryParams;
          const hasQueryParams = !!(currentQueryParams['nivel'] || currentQueryParams['materia'] || currentQueryParams['grado']);
          this.handleCategoriaChange(newCategoria, hasQueryParams);
          this.isFirstInit = false;
        } else {
          this.handleCategoriaChange(newCategoria, false);
        }

        // Retornar los queryParams para el switchMap
        return this.route.queryParams;
      }),
      takeUntil(this.destroy$)
    ).subscribe(queryParams => {
      this.handleQueryParams(queryParams);
    });
  }

  private handleCategoriaChange(newCategoria: Categoria, hasQueryParams: boolean = false): void {

    if (newCategoria !== this.categoriaActual) {
      this.categoriaActual = newCategoria;

      // Invalidar caché al cambiar de categoría
      this.cacheService.clear();

      // Configure EBOOKS/TALLERES functionality
      if (newCategoria === 'EBOOKS') {
        this.showSubCategoryToggle = true;
        this.currentSubCategoria = 'EBOOKS';
      } else {
        this.showSubCategoryToggle = false;
        this.currentSubCategoria = 'EBOOKS'; // Reset to default
      }

      // Solo resetear si NO hay query params en la URL
      if (!hasQueryParams) {
        // RESETEAR TODOS LOS SELECTS al cambiar categoría
        this.selectedNivel = '';
        this.selectedMateria = '';
        this.selectedGrado = '';
        this.selectedServicio = newCategoria;
        this.selectedSituacion = null;

        // Resetear listas
        this.materias = [];
        this.grados = [];

        // Sincronizar con filterService
        this.filterService.updateFilters({
          nivel: '',
          materia: '',
          grado: '',
          servicio: newCategoria,
          situacion: null
        });

        this.resetFilters();
      }

      // Actualizar state machine con la nueva categoría
      this.stateMachine.setCategoria(newCategoria, hasQueryParams);
    } else {
      // Es la misma categoría (carga inicial), solo actualizar sin resetear
      this.categoriaActual = newCategoria;

      // Configure EBOOKS/TALLERES functionality
      if (newCategoria === 'EBOOKS') {
        this.showSubCategoryToggle = true;
        // No resetear currentSubCategoria aquí, se restaurará desde queryParams
      } else {
        this.showSubCategoryToggle = false;
      }

      // Actualizar state machine (sin resetear, solo sincronizar)
      this.stateMachine.setCategoria(newCategoria, hasQueryParams);
    }
  }

  private handleQueryParams(queryParams: any): void {
    // Si el cambio es interno (usuario modificando filtros), NO procesar queryParams
    // para evitar que se restauren valores viejos de la URL
    if (this.isInternalFilterChange) {
      
      this.isInternalFilterChange = false;
      return;
    }

    

    // Actualizar visibilidad de filtros según URL (esto carga listas y aplica valores)
    this.updateFilterVisibility(queryParams);

    // Ya no necesitamos asignar los valores aquí porque lo hace applyVisibilityConfig
    // pero sí necesitamos asignar selectedServicio
    this.selectedServicio = queryParams['servicio'] || this.getDefaultServicio();

    

    // Restaurar término de búsqueda si existe
    const searchTerm = queryParams['busqueda'];
    if (searchTerm && this.searchComponent) {
      setTimeout(() => {
        this.searchComponent.setSearchTerm(searchTerm);
      }, 100);
    }

    // Restaurar situación si existe (para KITS)
    const situacionId = queryParams['situacion'];
    
    if (situacionId && this.categoriaActual === 'KITS') {
      this.loadAndSelectSituacion(situacionId);
    }

    // Restaurar subcategoría para EBOOKS
    const subcategoria = queryParams['subcategoria'];
    if (subcategoria && this.categoriaActual === 'EBOOKS') {
      this.currentSubCategoria = subcategoria as 'EBOOKS' | 'TALLERES';
    }

    

    // Forzar change detection para actualizar la vista
    this.cdr.detectChanges();

    

    // Update state machine with filters from URL
    // NOTA: Esto puede disparar subscribeToStateMachine, pero está protegido por hasUrlParams
    this.stateMachine.updateFilters({
      nivel: this.selectedNivel || undefined,
      materia: this.selectedMateria || undefined,
      grado: this.selectedGrado || undefined,
      situacion: situacionId || undefined
    });

    

    // FORZAR visibilidad de cartas si la categoría requiere materia
    
    this.enforceMateriasCardVisibility();

    // EXTENDER protección para cubrir loadInitialDocuments y posibles re-entradas async
    // Esto previene que subscripciones asíncronas (queryParams, etc.) sobrescriban valores
    setTimeout(() => {
      this.protectVisibilityFlags = false;
     
    }, 1000);

    this.loadInitialDocuments();
  }

  private getDefaultServicio(): string {
    return this.categoriaActual === 'KITS' ? 'PLANIFICACION' : this.categoriaActual;

  }

  private loadInitialDocuments(): void {
    // Use DocumentLoaderService to build initial load params
    const params = this.documentLoader.buildInitialLoadParams(this.categoriaActual, this.currentSubCategoria);

    const hasFiltersFromUrl = !!(this.selectedNivel || this.selectedMateria || this.selectedGrado);
    const shouldLoadWithFilters = (this.comingFromFilter || this.currentStep === 'documentos') && hasFiltersFromUrl;

    

    if (shouldLoadWithFilters) {
      // Para KITS con SECUNDARIA sin materia, NO cargar documentos, esperar a que seleccione materia
      if (this.categoriaActual === 'KITS' && this.selectedNivel === 'SECUNDARIA' && !this.selectedMateria) {
        this.ducumentList = [];
        
        return;
      }

      // Para categorías que REQUIEREN materia, no cargar si solo hay nivel
      const requiresMateriaCategories = ['PLANIFICACION', 'PLAN_LECTOR', 'REFORZAMIENTO'];
      if (requiresMateriaCategories.includes(this.categoriaActual) && this.selectedNivel && !this.selectedMateria) {
        this.ducumentList = [];
        
        return;
      }

      // Resetear a página 1 cuando se carga desde URL con filtros
      this.paginationService.resetPagination();
      
      this.onFilterChange();
    } else if (this.categoriaActual === 'KITS' && !this.comingFromFilter && !hasFiltersFromUrl) {
      // Para KITS sin filtros, no cargar documentos inicialmente, mostrar niveles
      this.ducumentList = [];
      
    } else {
      
      this.cargarDocumentos(params);
    }
  }



  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * REGLA CRÍTICA: Si la categoría requiere materia y no hay materia seleccionada,
   * SIEMPRE mostrar el filtro en cartas de materia
   */
  private enforceMateriasCardVisibility(): void {
    const requiresMateriaCategories = ['PLANIFICACION', 'PLAN_LECTOR', 'REFORZAMIENTO'];
    const isKitsSecundaria = this.categoriaActual === 'KITS' && this.selectedNivel === 'SECUNDARIA';

    const categoryRequiresMateria = requiresMateriaCategories.includes(this.categoriaActual) || isKitsSecundaria;
    const hasNivel = !!this.selectedNivel;
    const hasMateria = !!this.selectedMateria;

    

    // Si requiere materia, tiene nivel, pero NO tiene materia → Forzar cartas de materia
    if (categoryRequiresMateria && hasNivel && !hasMateria) {
      

      this.currentStep = 'materias';
      this.shouldShowMateriaCard = true;
      this.shouldShowNivelCard = false;

      // CRÍTICO: Establecer comingFromFilter = false para que el template muestre las cartas
      // La condición del template es: currentStep !== 'documentos' && !comingFromFilter
      // Al establecer esto en false, permitimos que las cartas se muestren
      this.comingFromFilter = false;

      // ACTIVAR protección para evitar que applyVisibilityConfig sobrescriba
      this.protectVisibilityFlags = true;

      this.cdr.detectChanges();

      // Desactivar protección después de un delay más largo (1 segundo)
      // para cubrir todas las operaciones asíncronas pendientes
      setTimeout(() => {
        // Solo desactivar si no se reactivó desde handleQueryParams
        if (this.protectVisibilityFlags) {
          this.protectVisibilityFlags = false;
          
        }
      }, 1000);

      
    } else {
      console.log('⏭️ [EnforceMateriasCard] No se requiere forzar cartas de materia');
    }
  }

  // Método optimizado para cargar documentos usando DocumentLoaderService
  cargarDocumentos(params: FilterParams): void {
    this.isLoadingDocuments = true;

    this.documentLoader.loadDocuments(params, this.categoriaActual, this.destroy$)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.handleInitialDocumentsLoad(response);
          this.isLoadingDocuments = false;
        },
        error: (error) => {
          console.error('❌ Error loading documents:', error);
          this.handleDocumentsError(error);
          this.isLoadingDocuments = false;
        }
      });
  }

  // Método para manejar la carga inicial de documentos usando DocumentLoaderService
  private handleInitialDocumentsLoad(response: any): void {
    // Use service to process and filter original documents
    this.originalDocuments = this.documentLoader.processInitialLoad(response, this.categoriaActual, this.currentSubCategoria);

    if (this.categoriaActual === 'KITS') {
      this.handleKitsInitialLoad(response);
    } else {
      this.handleRegularInitialLoad(response);
    }

    this.materias = this.config.getMaterias(this.selectedNivel, this.categoriaActual);
    this.grados = this.config.getGrados(this.selectedNivel, this.selectedMateria, this.categoriaActual);
    this.hasSearched = this.ducumentList.length === 0;
  }

  // Método específico para carga inicial de KITS usando DocumentLoaderService
  private handleKitsInitialLoad(response: any): void {
    const result = this.documentLoader.processKitsInitialLoad(response, this.selectedServicio);
    this.ducumentList = result.documents;
    this.updatePagination(result.totalCount);
  }

  // Método específico para carga inicial regular usando DocumentLoaderService
  private handleRegularInitialLoad(response?: any): void {
    const result = this.documentLoader.processRegularInitialLoad(
      response,
      this.categoriaActual,
      this.currentSubCategoria,
      this.originalDocuments
    );
    this.ducumentList = result.documents;
    this.updatePagination(result.totalCount);
  }

  // Método para procesar imágenes de documentos (delegado a DocumentLoaderService)
  private processDocumentImage(doc: Document): Document {
    return this.documentLoader.processDocumentImage(doc);
  }

  // Método para manejar errores de carga de documentos
  private handleDocumentsError(error: any): void {
    console.error('Error al cargar documentos:', error);
    this.hasSearched = true;
    this.ducumentList = [];
    this.updatePagination();
  }

  processSearch(event: string): void {
    const searchTerm = event.trim();

    if (!searchTerm) {
      this.resetToOriginalDocuments();
      this.syncFiltersToUrl();
      return;
    }

    this.performDocumentSearchWithFilters(searchTerm);
    this.syncFiltersToUrl(searchTerm);
  }

  private resetToOriginalDocuments(): void {
    const context = this.buildSearchContext();
    const hasActiveFilters = this.searchService.hasActiveFilters(context);

    if (hasActiveFilters) {
      this.onFilterChange();
    } else {
      this.ducumentList = [...this.originalDocuments];
      this.updatePagination();
    }

    this.searchComponent?.updateSuggestions([]);
    this.hasSearched = false;
  }

  private performDocumentSearchWithFilters(searchTerm: string): void {
    this.isLoadingDocuments = true;
    const context = this.buildSearchContext();

    this.searchService.searchWithFilters(searchTerm, context, this.destroy$)
      .subscribe({
        next: (response) => {
          this.handleSearchWithFiltersResponse(response);
          this.isLoadingDocuments = false;
        },
        error: (error) => {
          this.handleSearchError(error);
          this.isLoadingDocuments = false;
        }
      });
  }

  // Helper para construir contexto de búsqueda
  private buildSearchContext(): SearchContext {
    return {
      categoria: this.categoriaActual,
      displayCategoria: this.displayCategoria,
      currentSubCategoria: this.currentSubCategoria,
      selectedNivel: this.selectedNivel,
      selectedMateria: this.selectedMateria,
      selectedGrado: this.selectedGrado
    };
  }

  private performDocumentSearch(searchTerm: string): void {
    this.isLoadingDocuments = true;

    this.searchService.searchDocuments(searchTerm, this.destroy$)
      .subscribe({
        next: (response) => {
          this.handleSearchResponse(response);
          this.isLoadingDocuments = false;
        },
        error: (error) => {
          this.handleSearchError(error);
          this.isLoadingDocuments = false;
        }
      });
  }

  private handleSearchResponse(response: any): void {
    const context = this.buildSearchContext();
    const result = this.searchService.processFilteredSearchResponse(response, context);

    this.ducumentList = result.documents;
    this.searchComponent?.updateSuggestions(result.suggestions);
    this.hasSearched = !result.hasResults;
    this.updatePagination(result.totalCount);
  }

  private handleSearchError(error: any): void {
    console.error('Error al buscar documentos:', error);
    this.hasSearched = true;
    this.ducumentList = [];
  }

  private handleSearchWithFiltersResponse(response: any): void {
    const context = this.buildSearchContext();
    const result = this.searchService.processSearchResponse(response, context);

    this.ducumentList = result.documents;
    this.searchComponent?.updateSuggestions(result.suggestions);
    this.hasSearched = !result.hasResults;
    this.updatePagination(result.totalCount);
  }



  onNivelChange(): void {
    const categoria = this.categoriaActual === 'KITS' ? this.selectedServicio : this.categoriaActual;

    // SIEMPRE limpiar materia y grado al cambiar nivel (incluso si nivel queda vacío)
    this.selectedMateria = '';
    this.selectedGrado = '';

    // Resetear situaciones al cambiar nivel
    this.situaciones = [];
    this.selectedSituacion = null;
    this.showSituacionesList = false;
    this.isLoadingSituaciones = false;

    // Proteger banderas desde el inicio para evitar sobrescrituras
    this.protectVisibilityFlags = true;

    // Forzar detección de cambios ANTES de sincronizar con servicios
    this.cdr.detectChanges();

    // Sincronizar con filterService DESPUÉS de detectar cambios
    this.filterService.setNivel(this.selectedNivel || '');
    this.filterService.updateFilters({ materia: '', grado: '' });

    // Si se selecciona "Todos los niveles", limpiar materias y grados
    if (!this.selectedNivel) {
      this.materias = [];
      this.grados = [];
      this.ducumentList = [];
      // Marcar como cambio interno antes de sincronizar URL
      this.isInternalFilterChange = true;
      this.syncFiltersToUrl();
      // Desactivar protección
      setTimeout(() => {
        this.protectVisibilityFlags = false;
      }, 200);
      return;
    }

    // Cargar listas de opciones
    this.materias = this.config.getMaterias(this.selectedNivel, categoria);

    if (this.categoriaActual === 'KITS') {
      this.grados = this.config.getGrados(this.selectedNivel, undefined, this.categoriaActual);
    } else {
      this.grados = [];
    }

    // Determinar si debe cargar documentos o esperar más filtros
    const shouldLoadDocuments = this.shouldLoadDocumentsAfterNivel();

    // IMPORTANTE: Establecer currentStep y banderas ANTES de actualizar stateMachine
    // para que cuando el stateMachine dispare su observable, ya tengamos los valores correctos
    if (shouldLoadDocuments) {
      this.currentStep = 'documentos';
      this.shouldShowMateriaCard = false; // Ocultar carta cuando vamos a documentos
    } else {
      // Mostrar cartas de materia cuando la categoría requiere materia
      this.currentStep = 'materias';
      this.shouldShowMateriaCard = true; // Mostrar carta de materia
      this.shouldShowNivelCard = false; // Ocultar carta de nivel
    }

    // Forzar detección para asegurar que los valores estén sincronizados
    this.cdr.detectChanges();

    // Actualizar state machine DESPUÉS de establecer currentStep
    this.stateMachine.updateFilters({
      nivel: this.selectedNivel || undefined,
      materia: undefined, // Forzar a undefined para limpiar
      grado: undefined    // Forzar a undefined para limpiar
    });

    // Ejecutar acciones según el paso
    if (shouldLoadDocuments) {
      // Marcar como cambio interno ANTES de llamar onFilterChange
      this.isInternalFilterChange = true;
      this.onFilterChange();
      // Desactivar protección después de que se carguen documentos
      setTimeout(() => {
        this.protectVisibilityFlags = false;
      }, 200);
    } else {
      // Marcar como cambio interno antes de sincronizar URL
      this.isInternalFilterChange = true;
      // Esperar a que seleccione materia/grado
      this.syncFiltersToUrl();

      // FORZAR visibilidad de cartas después de sincronizar
      setTimeout(() => {
        
        this.enforceMateriasCardVisibility();
        this.protectVisibilityFlags = false;
      }, 300);
    }
  }

  private shouldLoadDocumentsAfterNivel(): boolean {
    // KITS con SECUNDARIA requiere materia
    if (this.categoriaActual === 'KITS' && this.selectedNivel === 'SECUNDARIA') {
      return false;
    }

    // PLAN_LECTOR y REFORZAMIENTO requieren materia
    if (this.categoriaActual === 'PLAN_LECTOR' || this.categoriaActual === 'REFORZAMIENTO') {
      return false;
    }

    // PLANIFICACION requiere materia
    if (this.categoriaActual === 'PLANIFICACION') {
      return false;
    }

    // Otras categorías cargan directo
    return true;
  }

  onMateriaChange(): void {
    // SIEMPRE limpiar grado al cambiar materia (incluso si materia queda vacía)
    this.selectedGrado = '';

    // Forzar detección de cambios ANTES de sincronizar con servicios
    this.cdr.detectChanges();

    // Sincronizar con filterService DESPUÉS de detectar cambios
    this.filterService.setMateria(this.selectedMateria || '');
    this.filterService.setGrado('');

    // Si se selecciona "Todas las áreas", limpiar grados y documentos
    if (!this.selectedMateria) {
      this.grados = [];
      this.ducumentList = [];
      // Marcar como cambio interno antes de sincronizar URL
      this.isInternalFilterChange = true;
      this.syncFiltersToUrl();
      return;
    }

    // Cargar grados para la materia seleccionada
    this.grados = this.config.getGrados(this.selectedNivel, this.selectedMateria, this.categoriaActual);

    // Actualizar state machine con la materia seleccionada
    this.stateMachine.updateFilters({
      materia: this.selectedMateria || undefined,
      grado: undefined // Forzar a undefined para limpiar
    });

    // SIEMPRE cargar documentos cuando se selecciona materia
    this.currentStep = 'documentos';
    // Marcar como cambio interno ANTES de llamar onFilterChange
    this.isInternalFilterChange = true;
    this.onFilterChange();
  }

  // Method to handle level selection
  onNivelSelect(nivel: string): void {
    // Actualizar el valor local directamente
    this.selectedNivel = nivel;

    // LIMPIAR materia y grado al seleccionar nivel
    this.selectedMateria = '';
    this.selectedGrado = '';

    // Forzar detección de cambios PRIMERO
    this.cdr.detectChanges();

    // Actualizar filterService para mantener sincronización
    this.filterService.setNivel(nivel);
    this.filterService.updateFilters({ materia: '', grado: '' });
    this.paginationService.resetPagination();

    // Actualizar state machine
    this.stateMachine.updateFilters({
      nivel,
      materia: undefined,
      grado: undefined
    });

    if (this.categoriaActual === 'KITS') {
      // Para KITS: actualizar materias inmediatamente
      this.materias = this.config.getMaterias(nivel, 'PLANIFICACION');
      this.grados = this.config.getGrados(nivel, undefined, this.categoriaActual);

      // Cargar situaciones para el nivel seleccionado
      this.loadSituacionesByNivel();

      // Solo llamar onFilterChange si no vamos a materias
      if (nivel !== 'SECUNDARIA') {
        this.shouldShowMateriaCard = false;
        this.currentStep = 'documentos';
        this.onFilterChange();
      } else {
        // SECUNDARIA requiere materia
        this.shouldShowMateriaCard = true;
        this.shouldShowNivelCard = false;
        this.currentStep = 'materias';
      }
    } else {
      // Flujo normal para otras categorías
      this.materias = this.config.getMaterias(nivel, this.categoriaActual);
      this.grados = this.config.getGrados(nivel, undefined, this.categoriaActual);

      // Determinar si debe cargar documentos
      const shouldLoadDocuments = this.shouldLoadDocumentsAfterNivel();

      if (shouldLoadDocuments) {
        this.shouldShowMateriaCard = false;
        this.shouldShowNivelCard = false;
        this.currentStep = 'documentos';
        this.onFilterChange();
      } else {
        // Requiere materia - mostrar carta
        this.shouldShowMateriaCard = true;
        this.shouldShowNivelCard = false;
        this.currentStep = 'materias';
      }
    }

    // Marcar como cambio interno y sincronizar con URL
    this.isInternalFilterChange = true;
    this.syncFiltersToUrl();
  }

  // Method to handle subject selection
  onMateriaSelect(materia: string): void {
    // Actualizar el valor local directamente
    this.selectedMateria = materia;

    // LIMPIAR grado al seleccionar materia
    this.selectedGrado = '';

    // Forzar detección de cambios PRIMERO
    this.cdr.detectChanges();

    // Actualizar filterService para mantener sincronización
    this.filterService.setMateria(materia);
    this.filterService.setGrado('');
    this.paginationService.resetPagination();

    this.grados = this.config.getGrados(this.selectedNivel, materia, this.categoriaActual);

    // Actualizar state machine
    this.stateMachine.updateFilters({
      materia,
      grado: undefined
    });

    // Cargar documentos con la materia seleccionada
    this.currentStep = 'documentos';
    this.onFilterChange();

    // Marcar como cambio interno y sincronizar con URL
    this.isInternalFilterChange = true;
    this.syncFiltersToUrl();
  }

  onServicioChange(): void {
    this.paginationService.resetPagination(); // Resetear a página 1 al cambiar filtros
    this.onFilterChange();
  }

  /**
   * Maneja el cambio de grado desde el dropdown
   */
  onGradoChange(grado: string): void {
    // selectedGrado ya está actualizado por [(ngModel)]
    // Solo sincronizar con filterService
    this.filterService.setGrado(grado || '');
    this.paginationService.resetPagination(); // Resetear a página 1 al cambiar filtros

    // Actualizar state machine con el grado seleccionado
    this.stateMachine.updateFilters({ grado });

    this.onFilterChange();
  }

  // Adjusted onFilterChange to ensure it works with the new flow
  onFilterChange(): void {
    const params = this.buildFilterParams();

    // Mostrar loading solo cuando no hay cartas de filtro visibles
    if (this.currentStep === 'documentos' || this.comingFromFilter) {
      this.isLoadingDocuments = true;
    }

    // Marcar como cambio interno antes de sincronizar URL
    this.isInternalFilterChange = true;
    // Sincronizar filtros con la URL cuando cambian
    this.syncFiltersToUrl();

    // Generar clave de caché basada en los parámetros de filtro
    const cacheKey = this.cacheService.generateKey('filter-documents', { ...params, page: this.paginationService.getCurrentPage().toString() });

    this.cacheService.get(cacheKey, this.document.filterDocuments(params, this.paginationService.getCurrentPage(), this.paginationService.getPageSize()))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.handleFilterResponse(response);
          this.isLoadingDocuments = false;
        },
        error: (error) => {
          this.handleFilterError(error);
          this.isLoadingDocuments = false;
        }
      });
  }

  private buildFilterParams(): FilterParams {
    // Use Strategy Pattern to build params based on category
    const strategy = this.filterParamsFactory.getStrategy(this.categoriaActual);

    const context: FilterContext = {
      categoria: this.categoriaActual,
      selectedNivel: this.selectedNivel,
      selectedMateria: this.selectedMateria,
      selectedGrado: this.selectedGrado,
      selectedServicio: this.selectedServicio,
      currentSubCategoria: this.currentSubCategoria,
      selectedSituacion: this.selectedSituacion
    };

    

    const params = strategy.buildParams(context);

    

    return params;
  }

  private handleFilterResponse(response: any): void {
    // Normalizar servicio para KITS
    if (this.categoriaActual === 'KITS' && this.selectedServicio === 'SESIONES') {
      this.selectedServicio = 'PLANIFICACION';
    }

    // Procesar documentos con paginación server-side
    this.ducumentList = response.data.map((doc: Document) =>
      this.processDocumentImage(doc)
    );

    this.hasSearched = this.ducumentList.length === 0;
    this.updatePagination(response.pagination?.cantidadDeDocumentos || response.data.length);
  }

  private handleFilterError(error: any): void {
    console.error('Error al filtrar documentos:', error);
    this.hasSearched = true;
    this.ducumentList = [];
  }

  // Constants for subject configuration
  private resetSelections(): void {
    this.filterService.updateFilters({ materia: '', grado: '' });
    // Para KITS, no limpiar grados aquí ya que se actualizan después
    if (this.categoriaActual !== 'KITS') {
      this.grados = [];
    }
  }

  resetFilters(clearUrl: boolean = true): void {
    this.clearSelections();
    this.resetState();
    this.updateFiltersForCurrentCategory();
    this.reloadDocuments();

    // Limpiar todos los query parameters de la URL solo si se solicita
    if (clearUrl) {
      this.urlSync.clearQueryParams();
    }
  }

  private clearSelections(): void {
    // Resetear variables locales del componente
    this.selectedNivel = '';
    this.selectedMateria = '';
    this.selectedGrado = '';
    this.selectedSituacion = null;

    // Sincronizar con filterService
    this.filterService.resetSelections();
    this.comingFromFilter = false;
  }

  private resetState(): void {
    // Reset state machine to initial state
    this.stateMachine.reset();

    this.selectedServicio = this.categoriaActual;
    this.ducumentList = [...this.originalDocuments];

    // Resetear estado de situaciones
    this.situaciones = [];
    this.selectedSituacion = null;
    this.showSituacionesList = false;
    this.isLoadingSituaciones = false;
  }

  private updateFiltersForCurrentCategory(): void {
    this.niveles = this.config.getNiveles(this.categoriaActual);
    this.materias = this.config.getMaterias(this.selectedNivel, this.categoriaActual);
    this.grados = this.config.getGrados(this.selectedNivel, undefined, this.categoriaActual);
  }

  private reloadDocuments(): void {
    let params: FilterParams;

    if (this.categoriaActual === 'MATERIAL_GRATIS') {
      params = { documentoLibre: 'true' };
    } else if (this.categoriaActual === 'KITS') {
      params = { category: 'PLANIFICACION', format: 'ZIP' };
    } else if (this.categoriaActual === 'EBOOKS') {
      // Use currentSubCategoria for EBOOKS
      params = { category: this.currentSubCategoria };
      if (this.currentSubCategoria === 'TALLERES') {
        params['format'] = 'ZIP';
      }
    } else {
      params = { category: this.categoriaActual };
    }

    this.cargarDocumentos(params);
  }

  getColClass(index: number): string {
    const totalItems = this.ducumentList.length;

    if (totalItems < 5) {
      return `col-lg-${12 / totalItems}`;
    }

    return 'col-xl-2 col-lg-3 col-md-4 col-sm-6 col-12';
  }

  get displayCategoria(): string {
    if (this.categoriaActual === 'PLANIFICACION') {
      return 'SESIONES';
    } else if (this.categoriaActual === 'PLAN_LECTOR') {
      return 'PLAN LECTOR';
    } else if (this.categoriaActual === 'MATERIAL_GRATIS') {
      return 'MATERIAL GRATIS';
    } else if (this.categoriaActual === 'EBOOKS') {
      return 'TALLERES';
    } else {
      return this.categoriaActual;
    }
  }

  formatMateriaName(materia: string): string {
    return this.config.formatMateriaName(materia);
  }

  formatCategoriaName(categoria: string): string {
    return categoria.replace(/_/g, ' ');
  }

  // Toggle between EBOOKS and TALLERES
  toggleSubCategory(subCategoria: 'EBOOKS' | 'TALLERES'): void {
    if (this.currentSubCategoria !== subCategoria) {
      this.currentSubCategoria = subCategoria;

      // Reset filters and reload documents with new subcategory
      this.resetSelections();
      // State machine handles currentStep automatically
      this.loadDocumentsForSubCategory();
    }
  }

  private loadDocumentsForSubCategory(): void {
    const params = this.documentLoader.buildSubCategoryParams(this.currentSubCategoria);
    this.cargarDocumentos(params);
  }

  get areDropdownFiltersSelected(): boolean {
    return this.selectedServicio === 'RECURSOS'
      ? !!this.selectedNivel
      : !!(this.selectedMateria && this.selectedGrado);
  }

  get shouldShowLoading(): boolean {
    // Para EBOOKS con subcategoría EBOOKS, no mostrar loading después de cargar
    if (this.categoriaActual === 'EBOOKS' && this.currentSubCategoria === 'EBOOKS') {
      return false;
    }

    const isEbooksTalleres = this.categoriaActual === 'EBOOKS' && this.currentSubCategoria === 'TALLERES';
    const result = this.isLoadingDocuments && (
      this.currentStep === 'documentos' ||
      this.comingFromFilter ||
      this.categoriaActual === 'TALLERES' ||
      this.categoriaActual === 'EBOOKS' ||
      isEbooksTalleres
    );

    return result;
  }

  getDescription(area: string): string {
    return this.config.getDescription(area);
  }

  // Método para determinar si mostrar el banner de descuentos
  showDiscountBanner(): boolean {
    // Solo mostrar el banner DESPUÉS de los filtros en cartas (cuando estamos en documentos)
    const isInDocumentsStep = this.currentStep === 'documentos' || this.comingFromFilter;

    if (!isInDocumentsStep) {
      return false; // No mostrar en pasos de filtros
    }

    // Solo mostrar para categorías que tienen descuentos automáticos
    const categoriesWithDiscounts = ['KITS', 'REFORZAMIENTO', 'PLAN_LECTOR'];

    // Verificar si la categoría actual tiene descuentos
    return categoriesWithDiscounts.includes(this.categoriaActual);
  }

  // Método para obtener la descripción correcta de descuentos según la categoría
  getDiscountDescription(): string {
    switch (this.categoriaActual) {
      case 'KITS':
        return 'Combina documentos de la misma situación didáctica y nivel educativo para obtener descuentos automáticos';
      case 'REFORZAMIENTO':
        return 'Combina documentos de la misma materia para obtener descuentos progresivos';
      case 'PLAN_LECTOR':
        return 'Combina documentos del mismo nivel educativo para obtener descuentos';
      default:
        return 'Combina documentos para obtener descuentos automáticos';
    }
  }

  // Método para determinar si mostrar el botón de situaciones en KITS
  shouldShowSituacionesButton(): boolean {
    if (this.categoriaActual !== 'KITS' || !this.selectedNivel || this.currentStep !== 'documentos') {
      return false;
    }

    // Para SECUNDARIA, requerir que se haya seleccionado una materia
    if (this.selectedNivel === 'SECUNDARIA' && !this.selectedMateria) {
      return false;
    }

    return true;
  }

  // Método para cargar situaciones según el nivel seleccionado
  loadSituacionesByNivel(): void {
    if (!this.selectedNivel) return;

    // Si ya se cargaron las situaciones, solo alternar la visibilidad
    if (this.situaciones.length > 0) {
      this.showSituacionesList = !this.showSituacionesList;
      return;
    }

    this.isLoadingSituaciones = true;

    // Llamar al servicio para obtener situaciones por nivel
    this.document.getSituacionesByNivel(this.selectedNivel)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.situaciones = response.data || [];
          this.showSituacionesList = false; // NO mostrar automáticamente, mantener ocultas
          this.isLoadingSituaciones = false;
        },
        error: (error) => {
          console.error('Error al cargar situaciones:', error);
          this.situaciones = [];
          this.showSituacionesList = false;
          this.isLoadingSituaciones = false;
        }
      });
  }

  // Método para seleccionar una situación y cargar sus documentos
  onSituacionSelect(situacion: any): void {
    this.selectedSituacion = situacion;

    // Cargar documentos de la situación seleccionada
    const params: FilterParams = {
      category: 'PLANIFICACION',
      format: 'ZIP',
      nivel: this.selectedNivel,
      situacionId: situacion.id.toString()
    };

    // Si es SECUNDARIA y hay materia seleccionada, agregar filtro por materia
    if (this.selectedNivel === 'SECUNDARIA' && this.selectedMateria) {
      params['materia'] = this.selectedMateria;
    }

    // Sincronizar situación con la URL
    this.syncFiltersToUrl();

    this.isLoadingDocuments = true;

    const cacheKey = this.cacheService.generateKey('situacion-docs', { ...params, page: this.paginationService.getCurrentPage().toString() });

    this.cacheService.get(cacheKey, this.document.filterDocuments(params, this.paginationService.getCurrentPage(), this.paginationService.getPageSize()))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ducumentList = response.data
            .filter((doc: Document) => doc.category === 'PLANIFICACION' && doc.format === 'ZIP')
            .map((doc: Document) => this.processDocumentImage(doc));

          this.isLoadingDocuments = false;
          this.hasSearched = this.ducumentList.length === 0;
          this.updatePagination(response.pagination?.cantidadDeDocumentos || response.data.length);

          // Ocultar las situaciones después de cargar
          this.showSituacionesList = false;
        },
        error: (error) => {
          console.error('Error al cargar documentos de situación:', error);
          this.isLoadingDocuments = false;
          this.hasSearched = true;
          this.ducumentList = [];
          this.updatePagination();
        }
      });
  }

  // Método para alternar la visibilidad de la lista de situaciones
  toggleSituacionesList(): void {
    // Si es SECUNDARIA y no hay área seleccionada, mostrar mensaje amigable
    if (this.selectedNivel === 'SECUNDARIA' && !this.selectedMateria) {
      this.showMateriaRequiredMessage();
      return;
    }

    if (this.situaciones.length > 0) {
      this.showSituacionesList = !this.showSituacionesList;
    } else {
      // Si no hay situaciones, cargarlas primero
      this.loadSituacionesByNivel();
    }
  }

  // Método para mostrar mensaje amigable cuando falta seleccionar área
  private showMateriaRequiredMessage(): void {
    // Aquí puedes implementar un toast, modal o mensaje en la UI

    // Opcionalmente, puedes destacar visualmente el selector de materias
    this.highlightMateriaSelector();
  }

  // Método para destacar el selector de materias
  private highlightMateriaSelector(): void {
    // Este método puede ser usado para agregar una clase CSS que destaque el selector
    // o hacer scroll hacia el selector de materias
    setTimeout(() => {
      const materiaElement = document.querySelector('.materia-selector');
      if (materiaElement) {
        materiaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Agregar clase de destaque temporal
        materiaElement.classList.add('highlight-required');
        setTimeout(() => {
          materiaElement.classList.remove('highlight-required');
        }, 3000);
      }
    }, 100);
  }

  // Método mejorado para hacer scroll al selector de materias
  scrollToMateriaSelector(): void {
    setTimeout(() => {
      // Buscar diferentes posibles selectores
      const selectors = [
        '.materia-selector',
        '.card-materias',
        '.areas-container',
        '.filter-card:nth-child(2)', // Segundo filtro (materias)
        '[class*="materia"]'
      ];

      let materiaElement: Element | null = null;

      for (const selector of selectors) {
        materiaElement = document.querySelector(selector);
        if (materiaElement) break;
      }

      if (materiaElement) {
        materiaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Agregar clase de destaque temporal
        materiaElement.classList.add('highlight-required');
        setTimeout(() => {
          materiaElement.classList.remove('highlight-required');
        }, 3000);
      } else {
        console.warn('⚠️ No se encontró el selector de materias');
      }
    }, 100);
  }

  // Método para limpiar la selección de situación
  clearSituacionSelection(): void {
    this.selectedSituacion = null;
    // Ocultar la lista al limpiar la selección
    this.showSituacionesList = false;
    // Recargar documentos normales de KITS
    this.onFilterChange();
  }

  // Método trackBy para optimizar el rendimiento de la lista
  trackBySituacion(index: number, situacion: any): any {
    return situacion ? situacion.id : index;
  }

  // Método específico para el botón "Cambiar" situación
  cambiarSituacion(): void {
    this.showSituacionesList = true;
  }

  // Métodos para el banner renovado
  loadSituacionesForBanner(): void {
    if (!this.selectedNivel || this.isLoadingSituaciones) return;

    this.isLoadingSituaciones = true;

    this.document.getSituacionesByNivel(this.selectedNivel)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.situaciones = response.data || [];
          this.isLoadingSituaciones = false;
        },
        error: (error) => {
          console.error('Error al cargar situaciones para banner:', error);
          this.situaciones = [];
          this.isLoadingSituaciones = false;
        }
      });
  }

  onSituacionToggle(situacion: any): void {
    if (this.selectedSituacion?.id === situacion.id) {
      // Si ya está seleccionada, deseleccionar
      this.clearSituacionSelection();
    } else {
      // Seleccionar nueva situación
      this.onSituacionSelect(situacion);
    }
  }

  // Método para obtener mensaje informativo cuando se requiere seleccionar área en KITS
  getKitsSecundariaMessage(): string {
    if (this.categoriaActual === 'KITS' && this.selectedNivel === 'SECUNDARIA' && !this.selectedMateria && this.currentStep === 'documentos') {
      return 'Para ver situaciones didácticas específicas, selecciona primero un área curricular';
    }
    return '';
  }

  // Método para verificar si mostrar el mensaje informativo
  shouldShowKitsSecundariaMessage(): boolean {
    return this.categoriaActual === 'KITS' &&
      this.selectedNivel === 'SECUNDARIA' &&
      !this.selectedMateria &&
      this.currentStep === 'documentos';
  }

  getOfferCards() {
    const baseOffers = [
      {
        icon: '💰',
        title: 'Ahorra hasta 40%',
        subtitle: 'En paquetes de situaciones',
        isSpecial: false
      },
      {
        icon: '🎯',
        title: 'Acceso inmediato',
        subtitle: 'Descarga al instante',
        isSpecial: false
      },
      {
        icon: '📚',
        title: 'Material actualizado',
        subtitle: 'Contenido 2024',
        isSpecial: true
      }
    ];

    if (this.categoriaActual === 'KITS') {
      return [
        ...baseOffers,
        {
          icon: '🎁',
          title: 'Kit completo',
          subtitle: 'Todo incluido',
          isSpecial: true
        }
      ];
    }

    return baseOffers;
  }

  // ============================================
  // URL Synchronization Methods
  // ============================================

  /**
   * Sincroniza el estado actual de filtros con la URL.
   * Permite compartir URLs con filtros aplicados.
   * @param searchTerm - Término de búsqueda opcional
   */
  private syncFiltersToUrl(searchTerm?: string): void {
    const params: Record<string, string | null> = {
      nivel: this.selectedNivel || null,
      materia: this.selectedMateria || null,
      grado: this.selectedGrado || null,
      servicio: this.selectedServicio !== this.categoriaActual ? this.selectedServicio : null,
      busqueda: searchTerm || null,
      situacion: this.selectedSituacion?.id?.toString() || null,
      subcategoria: (this.categoriaActual === 'EBOOKS' && this.currentSubCategoria !== 'EBOOKS')
        ? this.currentSubCategoria
        : null
    };

    this.urlSync.updateQueryParams(params);
  }

  /**
   * Carga y selecciona una situación basada en su ID desde la URL.
   * Útil para restaurar estado cuando se comparte un enlace.
   * @param situacionId - ID de la situación a cargar
   */
  private loadAndSelectSituacion(situacionId: string): void {
    if (!this.selectedNivel) {
      return;
    }

    // Si las situaciones ya están cargadas, buscar y seleccionar
    if (this.situaciones.length > 0) {
      const situacion = this.situaciones.find(s => s.id.toString() === situacionId);
      if (situacion) {
        this.selectedSituacion = situacion;
        this.onSituacionSelect(situacion);
      }
      return;
    }

    // Si no están cargadas, cargarlas primero
    this.isLoadingSituaciones = true;

    this.document.getSituacionesByNivel(this.selectedNivel)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.situaciones = response.data || [];
          this.isLoadingSituaciones = false;

          // Ahora buscar y seleccionar la situación
          const situacion = this.situaciones.find(s => s.id.toString() === situacionId);
          if (situacion) {
            this.selectedSituacion = situacion;
            this.onSituacionSelect(situacion);
          }
        },
        error: (error) => {
          console.error('Error al cargar situaciones:', error);
          this.isLoadingSituaciones = false;
        }
      });
  }

  /**
   * Genera URL compartible con los filtros actuales.
   * @returns URL completa lista para copiar y compartir
   */
  getShareableUrl(): string {
    return this.urlSync.getShareableUrl();
  }

  /**
   * Copia la URL compartible al portapapeles.
   * Muestra notificación al usuario.
   */
  copyShareableUrl(): void {
    const url = this.getShareableUrl();
    navigator.clipboard.writeText(url).then(() => {
      this.toastrService.success(
        'Puedes compartir este enlace por WhatsApp, email o redes sociales',
        '🔗 Enlace copiado al portapapeles'
      );
    }).catch(err => {
      console.error('Error al copiar URL:', err);
      this.toastrService.danger(
        'No se pudo copiar el enlace. Por favor, inténtalo de nuevo',
        'Error al copiar'
      );
    });
  }

  // ============ MÉTODOS DE PAGINACIÓN ============

  // ============ MÉTODOS DE PAGINACIÓN (delegados a PaginationService) ============

  /**
   * Actualiza la paginación con el total del backend
   */
  private updatePagination(totalFromBackend?: number): void {
    if (totalFromBackend !== undefined) {
      this.paginationService.setTotalItems(totalFromBackend);
    }
    this.updatePaginatedDocuments();
  }

  /**
   * Actualiza los documentos visibles
   * En paginación server-side, paginatedDocuments = ducumentList
   */
  private updatePaginatedDocuments(): void {
    // En paginación server-side, el backend ya envió solo la página solicitada
    this.paginatedDocuments = [...this.ducumentList];
  }

  /**
   * Cambia a una página específica - hace nueva petición al backend
   */
  goToPage(page: number): void {
    if (this.paginationService.goToPage(page)) {
      // Recargar documentos con la nueva página desde el backend
      this.onFilterChange();
      // Scroll suave hacia arriba
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Página anterior
   */
  previousPage(): void {
    if (this.paginationService.previousPage()) {
      this.onFilterChange();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Página siguiente
   */
  nextPage(): void {
    if (this.paginationService.nextPage()) {
      this.onFilterChange();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Obtiene el rango de páginas para mostrar
   */
  getPageRange(): number[] {
    return this.paginationService.getPageRange();
  }
}
