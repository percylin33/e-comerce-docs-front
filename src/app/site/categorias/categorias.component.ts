import { Component, OnDestroy, OnInit, ViewChild, ChangeDetectorRef, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DocumentData, Document, Situaciones } from '../../@core/interfaces/documents';
import { Subject, Observable, fromEvent } from 'rxjs';
import { takeUntil, switchMap, take, debounceTime, map, distinctUntilChanged, auditTime } from 'rxjs/operators';
import { SearchComponent } from '../../shared/component/search/search.component';

import { UrlSyncService } from './services/url-sync.service';
import { NbToastrService, NbIconModule } from '@nebular/theme';
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
import { CategoryService, LevelDto, SubjectDto, GradeDto } from '../../@core/backend/services/category.service';
import { FormsModule } from '@angular/forms';
import { TalleresCardComponent } from '../../shared/component/talleres-card/talleres-card.component';
import { CardComponent } from '../../shared/component/card/card.component';
import { AsyncPipe } from '@angular/common';

export interface FilterParams {
  [key: string]: string;
}

export interface SidebarNavItem {
  title: string;
  link: string;
  queryParams: Record<string, string>;
  icon: string;
  code: string;
}

@Component({
    selector: 'ngx-categorias',
    templateUrl: './categorias.component.html',
    styleUrls: ['./categorias.component.scss'],
    standalone: true,
    imports: [RouterLink, NbIconModule, SearchComponent, FormsModule, TalleresCardComponent, CardComponent, AsyncPipe]
})
export class CategoriasComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(SearchComponent) searchComponent!: SearchComponent;
  @ViewChild('filterBar', { static: false }) filterBarRef!: ElementRef<HTMLElement>;

  // Constants
  private readonly DEBOUNCE_TIME = 300;

  // Properties
  categoriaActual: Categoria = 'PLANIFICACION';
  private readonly destroy$ = new Subject<void>();
  private readonly cargarDocumentos$ = new Subject<FilterParams>();
  private isFirstInit = true; // Bandera para detectar primera inicialización
  private isInternalFilterChange = false; // Bandera para evitar ciclos al cambiar filtros
  private protectVisibilityFlags = false; // Protege banderas de visibilidad durante cambios internos
  private _restoredPage: number | null = null; // Página restaurada desde URL
  private _categoryJustChanged = false; // Evita restaurar pagina vieja al cambiar categoría
  private _processingParams = false; // Guard contra re-entrancia en handleQueryParams

  documentList: Document[] = [];
  originalDocuments: Document[] = [];

  // Pagination (server-side) - Gestionado por PaginationService
  pagination$ = this.paginationService.pagination$;

  niveles: LevelDto[] = [];
  materias: SubjectDto[] = [];
  grados: GradeDto[] = [];
  anios: number[] = [];
  situaciones: Situaciones[] = [];

  selectedMateria = '';
  selectedNivel = '';
  selectedGrado = '';
  selectedServicio = '';
  selectedAnio: number | null = null;
  selectedSituacion: Situaciones | null = null;

  /** IDs del backend — usados para las peticiones de selects en cascada */
  categoryId: number | null = null;
  levelId: number | null = null;
  subjectId: number | null = null;
  gradeId: number | null = null;

  /** Mapa code → id de categorías activas (para resolver IDs cruzados, ej: KITS → PLANIFICACION) */
  private categoryIdMap: Map<string, number> = new Map();

  currentStep: CurrentStep = 'documentos';
  hasSearched = false;
  comingFromFilter = false;

  // Computed properties for select visibility
  get shouldShowAnioSelect(): boolean {
    return this.categoriaActual === 'KITS';
  }

  get shouldShowNivelSelect(): boolean {
    // Para KITS: nivel solo aparece después de seleccionar año
    if (this.categoriaActual === 'KITS') {
      return !!this.selectedAnio;
    }
    return true;
  }

  get shouldShowSituacionSelect(): boolean {
    return this.categoriaActual === 'KITS' && !!this.selectedAnio && !!this.selectedNivel;
  }

  get shouldShowMateriaSelect(): boolean {
    return (
      this.categoriaActual === 'PLANIFICACION' ||
      this.categoriaActual === 'EVALUACION' ||
      this.categoriaActual === 'ESTRATEGIAS' ||
      this.categoriaActual === 'EBOOKS' ||
      this.categoriaActual === 'TALLERES' ||
      this.categoriaActual === 'PLAN_LECTOR' ||
      this.categoriaActual === 'REFORZAMIENTO' ||
      (this.categoriaActual === 'KITS' && !!this.selectedSituacion && this.selectedNivel === 'SECUNDARIA') ||
      (this.categoriaActual === 'KITS' && !!this.selectedMateria)
    );
  }

  get shouldShowGradoSelect(): boolean {
    const result = (
      this.categoriaActual === 'PLANIFICACION' ||
      this.categoriaActual === 'EBOOKS' ||
      this.categoriaActual === 'PLAN_LECTOR' ||
      this.categoriaActual === 'REFORZAMIENTO' ||
      (this.categoriaActual === 'KITS' && !!this.selectedSituacion && (
        this.selectedNivel === 'INICIAL' ||
        this.selectedNivel === 'PRIMARIA' ||
        this.selectedNivel === 'SECUNDARIA'
      )) ||
      (this.categoriaActual === 'KITS' && !!this.selectedGrado)
    );
    // LOG temporal — eliminar después de debug
    // console.log(`[GRADO-VISIBILITY] show=${result} cat=${this.categoriaActual} nivel=${this.selectedNivel} situacion=${!!this.selectedSituacion} grados.length=${this.grados.length}`);
    return result;
  }



  // Loading states
  isLoadingDocuments = false;

  // ─── Scroll-aware filter bar ────────────────────────────────────────────────
  filterBarVisible = true;
  isScrolledPastFilter = false;
  filterBarHeight = 0;
  private lastScrollY = 0;
  private scrollContainer: HTMLElement | null = null;
  private filterBarOffsetTop = 0;

  // Sidebar navigation
  navItems$!: Observable<SidebarNavItem[]>;
  private readonly CATEGORY_ICONS: Record<string, string> = {
    'MEMBRESIAS':    'star-outline',
    'KITS':          'briefcase-outline',
    'PLANIFICACION': 'calendar-outline',
    'EVALUACION':    'checkmark-square-outline',
    'EBOOKS':        'book-open-outline',
    'ESTRATEGIAS':   'bulb-outline',
    'REFORZAMIENTO': 'trending-up-outline',
    'PLAN_LECTOR':   'bookmark-outline',
    'TALLERES':      'layers-outline',
    'MATERIAL_GRATIS': 'gift-outline',
    'RECURSOS':      'grid-outline',
    'CONCURSOS':     'award-outline',
  };

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
    private filterVisibility: FilterVisibilityService,
    private categoryService: CategoryService,
    private router: Router
  ) { }

  // ─── Tamaño de columnas para paginación responsiva ──────────────────────────
  // Replica la lógica de CSS Grid auto-fill minmax(250px, 1fr):
  // cuántas columnas de 250px + gap caben en el contenedor visible.
  private readonly CARD_MIN_WIDTH = 250;
  private readonly GRID_GAP = 20; // 1.25rem ≈ 20px

  private getColumnsForViewport(): number {
    const gridEl = document.querySelector('.docs-grid') as HTMLElement;
    const containerWidth = gridEl ? gridEl.clientWidth : window.innerWidth * 0.75;
    const cols = Math.floor((containerWidth + this.GRID_GAP) / (this.CARD_MIN_WIDTH + this.GRID_GAP));
    return Math.max(cols, 1);
  }

  /** Calcula el pageSize exacto para que no haya huecos: columnas × filas */
  private computeResponsivePageSize(targetRows = 3): number {
    return this.getColumnsForViewport() * targetRows;
  }

  private applyResponsivePageSize(): void {
    const newSize = this.computeResponsivePageSize(3);
    if (newSize !== this.paginationService.getPageSize()) {
      this.paginationService.setPageSize(newSize);
    }
  }

  private handleScrollForFilterBar(): void {
    const scrollTop = this.scrollContainer
      ? this.scrollContainer.scrollTop
      : window.scrollY;
    const delta = scrollTop - this.lastScrollY;

    // El filtro pasa a fixed cuando su posición natural queda detrás del header (70px)
    const threshold = this.filterBarOffsetTop - 70;
    this.isScrolledPastFilter = scrollTop > threshold;
    if (scrollTop <= threshold) {
      this.filterBarVisible = true;
    } else if (delta > 5) {
      this.filterBarVisible = false;
    } else if (delta < -5) {
      this.filterBarVisible = true;
    }
    this.lastScrollY = scrollTop;
  }

  ngAfterViewInit(): void {
    // Medir la barra de filtros y encontrar el scroll container de Nebular
    setTimeout(() => {
      // Nebular usa .scrollable-container como scroll viewport, no window
      this.scrollContainer = document.querySelector('nb-layout .scrollable-container') as HTMLElement;

      if (this.filterBarRef) {
        this.filterBarHeight = this.filterBarRef.nativeElement.offsetHeight;
        // Calcular offset real con getBoundingClientRect (offsetTop falla con position:relative)
        if (this.scrollContainer) {
          const filterRect = this.filterBarRef.nativeElement.getBoundingClientRect();
          const scrollRect = this.scrollContainer.getBoundingClientRect();
          this.filterBarOffsetTop = filterRect.top - scrollRect.top + this.scrollContainer.scrollTop;
        }
      }

      const target = this.scrollContainer || window;
      fromEvent(target, 'scroll').pipe(
        auditTime(50),
        takeUntil(this.destroy$)
      ).subscribe(() => this.handleScrollForFilterBar());
    });
  }

  ngOnInit(): void {
    // Ajusta pageSize al viewport actual y reactualiza al redimensionar
    this.applyResponsivePageSize();
    fromEvent(window, 'resize').pipe(
      auditTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyResponsivePageSize();
    });

    // Poblar mapa code → id de forma eagerly para que esté disponible antes del routing
    this.categoryService.getActiveCategories().pipe(take(1)).subscribe(cats => {
      cats.forEach(c => this.categoryIdMap.set(c.code, c.id));
    });

    // Construir items del sidebar (misma fuente que el dropdown del header)
    this.navItems$ = this.categoryService.getActiveCategories().pipe(
      map(cats => {
        // Poblar mapa code → id para resolución cruzada de categorías
        cats.forEach(c => this.categoryIdMap.set(c.code, c.id));

        const kitsCat       = cats.find(c => c.code === 'KITS');
        const materialCat   = cats.find(c => c.code === 'MATERIAL_GRATIS');

        const kitsQP: Record<string, string> = kitsCat
          ? { categoryId: String(kitsCat.id) }
          : {};

        const materialQP: Record<string, string> = materialCat
          ? { categoryId: String(materialCat.id) }
          : {};

        return [
          { title: 'Membresías',            link: '/site/membresia',                queryParams: {},      icon: 'star-outline',      code: 'MEMBRESIAS'     },
          { title: 'Kits de Planificación', link: '/site/categorias/KITS',           queryParams: kitsQP,  icon: 'briefcase-outline', code: 'KITS'           },
          ...cats
            .filter(c => !['KITS', 'MATERIAL_GRATIS'].includes(c.code))
            .map(c => ({
              title:       c.name,
              link:        `/site/categorias/${c.code}`,
              queryParams: { categoryId: String(c.id) },
              icon:        this.CATEGORY_ICONS[c.code] || 'file-text-outline',
              code:        c.code,
            })),
          { title: 'Material Gratis', link: '/site/categorias/MATERIAL_GRATIS', queryParams: materialQP, icon: 'gift-outline', code: 'MATERIAL_GRATIS' },
        ];
      })
    );

    this.cargarDocumentos$.pipe(debounceTime(this.DEBOUNCE_TIME), takeUntil(this.destroy$))
      .subscribe(params => this.executeCargarDocumentos(params));
    this.initializeRouteSubscriptions();
    // NO suscribirse a filterChanges aquí - causa conflictos con valores de URL
    // Los cambios de filtros se manejan directamente en los event handlers
    this.subscribeToStateMachine();
    // initializeFilterVisibility eliminado — handleQueryParams ya llama a
    // updateFilterVisibility con el callback onReady encadenado.
    // La llamada duplicada provocaba una race condition que sobreescribía
    // this.materias con un nuevo array, haciendo que Angular recreara los
    // <option> y el <select> perdiera la selección (ngModel binding).
  }

  /**
   * Suscribe a cambios del state machine
   * Sincroniza currentStep con el estado del servicio
   */
  private subscribeToStateMachine(): void {
    this.stateMachine.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        // Las tarjetas de filtro (niveles/materias/grados) han sido eliminadas.
        // currentStep siempre debe ser 'documentos'; no dejar que la state machine
        // lo sobreescriba con pasos intermedios del flujo antiguo.
        this.currentStep = 'documentos';
        this.comingFromFilter = state.comingFromFilter;
      });
  }

  /**
   * Actualiza la visibilidad de filtros según categoría y parámetros URL.
   * Carga los niveles por categoryId y encadena subjects/grades con levelId/subjectId.
   */
  private updateFilterVisibility(urlParams: any = {}, onReady?: () => void): void {
 
    const nivelFromUrl   = urlParams['nivel'];
    const materiaFromUrl = urlParams['materia'];
    const levelIdFromUrl   = urlParams['levelId']   ? Number(urlParams['levelId'])   : null;
    const subjectIdFromUrl = urlParams['subjectId'] ? Number(urlParams['subjectId']) : null;
    const gradeIdFromUrl   = urlParams['gradeId']   ? Number(urlParams['gradeId'])   : null;

    const applyVisibility = () => {
      
      const visibility = this.filterVisibility.calculateVisibility(this.categoriaActual, urlParams);
      this.applyVisibilityConfig(visibility);
      // Forzar detección de cambios para que los <select> reflejen los valores
      // asignados por la cascada async (niveles → materias → grados)
      this.cdr.detectChanges();
      
      if (onReady) onReady();
    };

    const loadLevelsById = (catId: number) => {
      
      this.categoryService.getLevels(catId).subscribe(levels => {
        this.niveles = levels;
        

        // Resolver nivel: ID primero, code como fallback
        const level = levelIdFromUrl
          ? levels.find(l => l.id === levelIdFromUrl)
          : nivelFromUrl ? levels.find(l => l.code === nivelFromUrl) : null;

        if (level) {
          this.levelId = level.id;
          this.selectedNivel = level.code; // asegurar que el select quede seleccionado
          
          this.categoryService.getSubjects(level.id).subscribe(subjects => {
            this.materias = subjects;

            // Resolver materia: ID primero, code como fallback
            const subject = subjectIdFromUrl
              ? subjects.find(s => s.id === subjectIdFromUrl)
              : materiaFromUrl ? subjects.find(s => s.code === materiaFromUrl) : null;

            if (subject) {
              this.subjectId = subject.id;
              this.selectedMateria = subject.code; // asegurar que el select quede seleccionado
              
              this.categoryService.getGrades(subject.id).subscribe(grades => {
                console.log(`[GRADOS-UFV] getGrades(${subject.id}) → ${grades.length} grados:`, grades.map((g: any) => g.code));
                this.grados = grades;
                console.log(`[GRADOS-UFV] this.grados asignados, length=${this.grados.length}`);

                // Resolver grado: ID primero
                if (gradeIdFromUrl) {
                  const grade = grades.find(g => g.id === gradeIdFromUrl);
                  if (grade) {
                    this.gradeId = grade.id;
                    this.selectedGrado = grade.code;
                  }
                }

                applyVisibility();
              });
            } else {
              applyVisibility();
            }
          });
        } else {
          applyVisibility();
        }
      });
    };

    if (this.categoryId) {
      // KITS usa los niveles de PLANIFICACION, no los propios de la categoría KITS
      if (this.categoriaActual === 'KITS') {
        const planId = this.categoryIdMap.get('PLANIFICACION');
        if (planId) {
          loadLevelsById(planId);
        } else {
          // Mapa aún no cargado — resolver desde backend
          this.categoryService.getActiveCategories().pipe(take(1)).subscribe(cats => {
            cats.forEach(c => this.categoryIdMap.set(c.code, c.id));
            const resolvedPlanId = this.categoryIdMap.get('PLANIFICACION');
            if (resolvedPlanId) {
              loadLevelsById(resolvedPlanId);
            } else {
              applyVisibility();
            }
          });
        }
      } else {
        loadLevelsById(this.categoryId);
      }
    } else {
      // Fallback: resolver categoryId desde la lista de categorías activas.
      // NO escribir a la URL aquí — syncFiltersToUrl (vía onFilterChange) será
      // la ÚNICA autoridad para escribir la URL final. Esto evita emisiones
      // intermedias de queryParams que causan re-entrancia en handleQueryParams.
      this.categoryService.getActiveCategories().pipe(take(1)).subscribe(cats => {
        cats.forEach(c => this.categoryIdMap.set(c.code, c.id));
        // KITS no existe como categoría backend — usar PLANIFICACION como base
        const lookupCode = this.categoriaActual === 'KITS' ? 'PLANIFICACION' : this.categoriaActual;
        const found = cats.find(c => c.code === lookupCode);
        if (found) {
          this.categoryId = found.id;
          // KITS usa niveles de PLANIFICACION, no los propios
          const catIdForLevels = this.categoriaActual === 'KITS'
            ? (this.categoryIdMap.get('PLANIFICACION') || this.categoryId)
            : this.categoryId;
          loadLevelsById(catIdForLevels);
        } else {
          applyVisibility();
        }
      });
    }
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

    // Las cartas de filtro han sido eliminadas; siempre se muestran los documentos
    this.currentStep = 'documentos';

    // Sincronizar con filterService después de aplicar valores
    this.filterService.updateFilters({
      nivel: this.selectedNivel || '',
      materia: this.selectedMateria || '',
      grado: this.selectedGrado || '',
      servicio: this.selectedServicio || '',
      situacion: null
    });
  }

  private initializeRouteSubscriptions(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const newCategoria = params.get('service') as Categoria || 'PLANIFICACION';
        // En la primera carga, obtener queryParams primero para saber si hay filtros
        if (this.isFirstInit) {
          const currentQueryParams = this.route.snapshot.queryParams;
          const hasQueryParams = !!(
            currentQueryParams['nivel']     || currentQueryParams['materia']   || currentQueryParams['grado'] ||
            currentQueryParams['levelId']   || currentQueryParams['subjectId'] || currentQueryParams['gradeId'] ||
            currentQueryParams['anio']      || currentQueryParams['situacionId']
          );
          
          this.handleCategoriaChange(newCategoria, hasQueryParams);
          this.isFirstInit = false;
        } else {
          
          this.handleCategoriaChange(newCategoria, false);
        }

        // Retornar los queryParams para el switchMap
        return this.route.queryParams.pipe(
          // Evitar emisiones duplicadas (ej: navegación inicial + commit)
          distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
        );
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

      // Solo resetear si NO hay query params en la URL
      if (!hasQueryParams) {
        // RESETEAR TODOS LOS SELECTS al cambiar categoría
        this.selectedNivel = '';
        this.selectedMateria = '';
        this.selectedGrado = '';
        this.selectedServicio = newCategoria;
        this.selectedAnio = null;
        this.selectedSituacion = null;
        this.categoryId = null;   // ← reset para que updateFilterVisibility haga el lookup correcto
        this.levelId = null;
        this.subjectId = null;
        this.gradeId = null;

        // Resetear listas
        this.materias = [];
        console.log('[GRADOS-RESET] handleCategoriaChange → grados=[]');
        this.grados = [];
        this.anios = [];
        this.situaciones = [];

        // Resetear paginación al cambiar de categoría
        this.paginationService.resetPagination();
        this._restoredPage = null;
        this._categoryJustChanged = true;

        // Sincronizar con filterService
        this.filterService.updateFilters({
          nivel: '',
          materia: '',
          grado: '',
          servicio: newCategoria,
        });

        // Limpiar documentos sin recargar — handleQueryParams se encargará de:
        // 1. Resolver categoryId desde la URL
        // 2. Cargar listas (niveles, anios para KITS) via updateFilterVisibility
        // 3. Cargar documentos via loadInitialDocuments
        this.documentList = [];
        this.originalDocuments = [];
        this.stateMachine.reset();

        // Para KITS: cargar los años disponibles y los niveles (de PLANIFICACION) de inmediato
        if (newCategoria === 'KITS') {
          this.document.getAniosSituaciones()
            .pipe(takeUntil(this.destroy$))
            .subscribe(res => {
              this.anios = res.data || [];
              this.cdr.markForCheck();
            });
          const planId = this.categoryIdMap.get('PLANIFICACION');
          if (planId) {
            this.categoryService.getLevels(planId)
              .pipe(takeUntil(this.destroy$))
              .subscribe(levels => {
                this.niveles = levels;
                this.cdr.markForCheck();
              });
          } else {
            // Mapa aún no cargado — resolver desde backend
            this.categoryService.getActiveCategories().pipe(take(1)).subscribe(cats => {
              cats.forEach(c => this.categoryIdMap.set(c.code, c.id));
              const resolvedPlanId = this.categoryIdMap.get('PLANIFICACION');
              if (resolvedPlanId) {
                this.categoryService.getLevels(resolvedPlanId)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe(levels => {
                    this.niveles = levels;
                    this.cdr.markForCheck();
                  });
              }
            });
          }
        }
      }

      // Actualizar state machine con la nueva categoría
      this.stateMachine.setCategoria(newCategoria, hasQueryParams);
    } else {
      // Es la misma categoría (carga inicial), solo actualizar sin resetear
      this.categoriaActual = newCategoria;

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

    // Guard contra re-entrancia: si ya estamos procesando params (ej: por una
    // emisión duplicada de queryParams durante la navegación inicial), ignorar.
    if (this._processingParams) {
      
      return;
    }
    this._processingParams = true;
    

    // Categoría recién cambió — los filtros ya fueron reseteados por handleCategoriaChange.
    // Solo procesar categoryId y cargar docs con estado limpio, ignorando params obsoletos.
    if (this._categoryJustChanged) {
      this._categoryJustChanged = false;
      this._restoredPage = null;

      const proceedCatChanged = () => {
        this.selectedServicio = this.categoriaActual === 'KITS' ? 'PLANIFICACION' : this.categoriaActual;

        // Cargar niveles para la nueva categoría (params limpios, solo categoryId)
        // Encadenar loadInitialDocuments como callback para esperar resolución async
        this.updateFilterVisibility(
          { categoryId: this.categoryId ? String(this.categoryId) : '' },
          () => this.loadInitialDocuments()
        );
        this._processingParams = false;
      };

      const catIdParamCC = queryParams['categoryId'];
      if (catIdParamCC) {
        this.categoryId = Number(catIdParamCC);
        proceedCatChanged();
      } else if (!this.categoryId) {
        this.categoryService.getActiveCategories().pipe(take(1)).subscribe(cats => {
          cats.forEach(c => this.categoryIdMap.set(c.code, c.id));
          // KITS no existe como categoría backend — usar PLANIFICACION como base
          const lookupCode = this.categoriaActual === 'KITS' ? 'PLANIFICACION' : this.categoriaActual;
          const found = cats.find(c => c.code === lookupCode);
          if (found) this.categoryId = found.id;
          proceedCatChanged();
        });
      } else {
        proceedCatChanged();
      }
      return;
    }

    // Actualizar visibilidad de filtros según URL (esto carga listas y aplica valores)
    // Extraer categoryId de los params de URL (enviado por el header en queryParams)
    const catIdParam = queryParams['categoryId'];

    // ── Función que contiene TODO el flujo post-resolución de categoryId ──
    const proceedAfterCategoryResolved = () => {
      

      
      this.updateFilterVisibility(queryParams, () => {
        // Restaurar año y situación desde URL (KITS)
        // Se ejecuta DESPUÉS de la cascada async (niveles/materias/grados)
        // para que selectedNivel ya esté asignado.
        
        const anioFromUrl = queryParams['anio'] ? Number(queryParams['anio']) : null;
        const situacionIdFromUrl = queryParams['situacionId'] ? Number(queryParams['situacionId']) : null;
        if (anioFromUrl) {
          this.selectedAnio = anioFromUrl;
        }

        if (this.categoriaActual === 'KITS') {
          this.document.getAniosSituaciones()
            .pipe(takeUntil(this.destroy$))
            .subscribe(res => {
              this.anios = res.data || [];
              // Si hay año y nivel, cargar situaciones y DESPUÉS cargar documentos
              if (this.selectedAnio && this.selectedNivel) {
                this.document.getSituacionesByNivelAndAnio(this.selectedNivel, this.selectedAnio)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe(sitRes => {
                    this.situaciones = sitRes.data || [];
                    if (situacionIdFromUrl) {
                      this.selectedSituacion = this.situaciones.find(s => s.id === situacionIdFromUrl) || null;
                    }
                    this.cdr.detectChanges();
                    // Cargar documentos con selectedSituacion ya asignada
                    this.loadInitialDocuments();
                  });
              } else {
                this.cdr.detectChanges();
                this.loadInitialDocuments();
              }
            });
          return; // No llamar loadInitialDocuments abajo
        }

        this.loadInitialDocuments();
      });

      // Ya no necesitamos asignar los valores aquí porque lo hace applyVisibilityConfig
      // pero sí necesitamos asignar selectedServicio
      this.selectedServicio = queryParams['servicio'] || (this.categoriaActual === 'KITS' ? 'PLANIFICACION' : this.categoriaActual);

      

      // Restaurar página desde URL si existe
      const pageFromUrl = queryParams['pagina'] ? Number(queryParams['pagina']) : null;
      if (pageFromUrl && pageFromUrl > 1) {
        this._restoredPage = pageFromUrl;
      } else {
        this._restoredPage = null;
      }

      // Restaurar término de búsqueda si existe
      const searchTerm = queryParams['busqueda'];
      if (searchTerm && this.searchComponent) {
        setTimeout(() => {
          this.searchComponent.setSearchTerm(searchTerm);
        }, 100);
      }

      

      // Forzar change detection para actualizar la vista
      this.cdr.detectChanges();

      

      // Update state machine with filters from URL
      // NOTA: Esto puede disparar subscribeToStateMachine, pero está protegido por hasUrlParams
      this.stateMachine.updateFilters({
        nivel: this.selectedNivel || undefined,
        materia: this.selectedMateria || undefined,
        grado: this.selectedGrado || undefined
      });

      

      // EXTENDER protección para cubrir loadInitialDocuments y posibles re-entradas async
      // Esto previene que subscripciones asíncronas (queryParams, etc.) sobrescriban valores
      setTimeout(() => {
        this.protectVisibilityFlags = false;
      }, 1000);

      // Guard reset — la protección de re-entrancia del flujo síncrono se libera.
      // Escrituras URL futuras (vía syncFiltersToUrl) usan isInternalFilterChange.
      this._processingParams = false;
    };

    // ── Resolver categoryId ANTES de proceder ──
    // Si no hay categoryId en la URL, debemos esperar la resolución async
    // ANTES de llamar updateFilterVisibility (que necesita categoryId para cargar niveles).
    if (catIdParam) {
      this.categoryId = Number(catIdParam);
      proceedAfterCategoryResolved();
    } else if (!this.categoryId) {
      // categoryId no está en URL ni en estado → resolver desde backend
      // y SOLO DESPUÉS proceder con el flujo de filtros
      
      this.categoryService.getActiveCategories().pipe(take(1)).subscribe(cats => {
        cats.forEach(c => this.categoryIdMap.set(c.code, c.id));
        // KITS no existe como categoría backend — usar PLANIFICACION como base
        const lookupCode = this.categoriaActual === 'KITS' ? 'PLANIFICACION' : this.categoriaActual;
        const found = cats.find(c => c.code === lookupCode);
        if (found) {
          this.categoryId = found.id;
        }
        
        proceedAfterCategoryResolved();
      });
    } else {
      proceedAfterCategoryResolved();
    }

    // loadInitialDocuments ya se invoca como callback de updateFilterVisibility
    // (esperando a que la cascada async de getLevels → getSubjects → getGrades termine)
  }

  private loadInitialDocuments(): void {
    // Use strategy (buildFilterParams) so categoryId is preferred over category code
    const params = this.buildFilterParams();
    

    const hasFiltersFromUrl = !!(this.selectedNivel || this.selectedMateria || this.selectedGrado ||
                              this.levelId || this.subjectId || this.gradeId ||
                              (this.categoriaActual === 'KITS' && this.selectedAnio));
    const shouldLoadWithFilters = (this.comingFromFilter || this.currentStep === 'documentos') && hasFiltersFromUrl;

    

    if (shouldLoadWithFilters) {
      // Restaurar página desde URL si existe, sino resetear a página 1
      if (this._restoredPage && this._restoredPage > 1) {
        this.paginationService.setCurrentPage(this._restoredPage);
        this._restoredPage = null;
      } else {
        this.paginationService.resetPagination();
      }
      
      this.onFilterChange();
    } else if (this.categoriaActual === 'KITS') {
      // KITS: cargar con filtros base (categoryId=PLANIFICACION, format=ZIP, etc.)
      // KitsStrategy siempre incluye los params base, aún sin filtros adicionales
      if (this._restoredPage && this._restoredPage > 1) {
        this.paginationService.setCurrentPage(this._restoredPage);
        this._restoredPage = null;
      } else {
        this.paginationService.resetPagination();
      }
      this.onFilterChange();
    } else {
      // Restaurar página desde URL si existe
      if (this._restoredPage && this._restoredPage > 1) {
        this.paginationService.setCurrentPage(this._restoredPage);
        this._restoredPage = null;
      }

      this.onFilterChange();
    }
  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Método optimizado para cargar documentos usando DocumentLoaderService
  cargarDocumentos(params: FilterParams): void {
    this.cargarDocumentos$.next(params);
  }

  private executeCargarDocumentos(params: FilterParams): void {
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
    this.originalDocuments = this.documentLoader.processInitialLoad(response, this.categoriaActual);

    if (this.categoriaActual === 'KITS') {
      this.handleKitsInitialLoad(response);
    } else {
      this.handleRegularInitialLoad(response);
    }

    // Reload subjects/grades from backend if nivel/materia are set
    if (this.selectedNivel && this.levelId) {
      this.categoryService.getSubjects(this.levelId).subscribe(subjects => {
        this.materias = subjects;
        if (this.selectedMateria && this.subjectId) {
          this.categoryService.getGrades(this.subjectId).subscribe(grades => {
            this.grados = grades;
            this.cdr.markForCheck();
          });
        } else if (
          this.categoriaActual === 'KITS' &&
          (this.selectedNivel === 'INICIAL' || this.selectedNivel === 'PRIMARIA') &&
          this.selectedSituacion
        ) {
          // KITS+INICIAL/PRIMARIA: auto-cargar grados desde COMUNICACION
          const comunicacion = subjects.find(s =>
            s.code === 'COMUNICACION' || s.code === 'COMUNICACIÓN' ||
            s.name?.toUpperCase().includes('COMUNICACI')
          );
          if (comunicacion) {
            this.subjectId = comunicacion.id;
            console.log('[GRADOS-INIT] KITS INICIAL/PRIMARIA: getGrades subjectId=', comunicacion.id);
            this.categoryService.getGrades(comunicacion.id).subscribe(grades => {
              console.log('[GRADOS-INIT] getGrades respuesta:', grades.map((g: any) => g.code));
              this.grados = grades;
              console.log('[GRADOS-INIT] this.grados.length=', this.grados.length);
              this.cdr.detectChanges();
            });
          } else {
            console.warn('[GRADOS-INIT] ⚠️ COMUNICACION no encontrada en subjects:', subjects.map((s: any) => s.code));
          }
        } else {
          console.log('[GRADOS-RESET] else-branch en handleInitialDocumentsLoad → grados=[]');
          this.grados = [];
          this.cdr.markForCheck();
        }
      });
    } else {
      this.materias = [];
      console.log('[GRADOS-RESET] handleInitialDocumentsLoad else-noMateria → grados=[]');
      this.grados = [];
    }
    this.hasSearched = this.documentList.length === 0;
  }

  // Método específico para carga inicial de KITS usando DocumentLoaderService
  private handleKitsInitialLoad(response: any): void {
    const result = this.documentLoader.processKitsInitialLoad(response, this.selectedServicio);
    this.documentList = result.documents;
    this.updatePagination(result.totalCount);
  }

  // Método específico para carga inicial regular usando DocumentLoaderService
  private handleRegularInitialLoad(response?: any): void {
    const result = this.documentLoader.processRegularInitialLoad(
      response,
      this.categoriaActual,
      this.originalDocuments
    );
    this.documentList = result.documents;
    this.updatePagination(result.totalCount);
  }

  // Método para manejar errores de carga de documentos
  private handleDocumentsError(error: any): void {
    console.error('Error al cargar documentos:', error);
    this.hasSearched = true;
    this.documentList = [];
    this.updatePagination();
  }

  processSearch(event: string): void {
    const searchTerm = event.trim();

    if (!searchTerm) {
      this.resetToOriginalDocuments();
      this.isInternalFilterChange = true;
      this.syncFiltersToUrl();
      return;
    }

    this.performDocumentSearchWithFilters(searchTerm);
    this.isInternalFilterChange = true;
    this.syncFiltersToUrl(searchTerm);
  }

  private resetToOriginalDocuments(): void {
    const context = this.buildSearchContext();
    const hasActiveFilters = this.searchService.hasActiveFilters(context);

    if (hasActiveFilters) {
      this.onFilterChange();
    } else {
      this.documentList = [...this.originalDocuments];
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
      selectedNivel: this.selectedNivel,
      selectedMateria: this.selectedMateria,
      selectedGrado: this.selectedGrado
    };
  }

  private handleSearchError(error: any): void {
    console.error('Error al buscar documentos:', error);
    this.hasSearched = true;
    this.documentList = [];
  }

  private handleSearchWithFiltersResponse(response: any): void {
    const context = this.buildSearchContext();
    const result = this.searchService.processSearchResponse(response, context);

    this.documentList = result.documents;
    this.searchComponent?.updateSuggestions(result.suggestions);
    this.hasSearched = !result.hasResults;
    this.updatePagination(result.totalCount);
  }



  onNivelChange(): void {
    // SIEMPRE limpiar materia y grado al cambiar nivel (incluso si nivel queda vacío)
    this.selectedMateria = '';
    this.selectedGrado = '';
    this.gradeId = null;
    // Para KITS: también resetear situación
    if (this.categoriaActual === 'KITS') {
      this.selectedSituacion = null;
      this.situaciones = [];
    }

    // Proteger banderas desde el inicio para evitar sobrescrituras
    this.protectVisibilityFlags = true;

    // Forzar detección de cambios ANTES de sincronizar con servicios
    this.cdr.detectChanges();

    // Sincronizar con filterService DESPUÉS de detectar cambios
    this.filterService.setNivel(this.selectedNivel || '');
    this.filterService.updateFilters({ materia: '', grado: '' });

    // Si se selecciona "Todos los niveles", limpiar materias/grados y recargar sin filtro de nivel
    if (!this.selectedNivel) {
      this.materias = [];
      console.log('[GRADOS-RESET] onNivelChange nivel=null → grados=[]');
      this.grados = [];
      this.levelId = null;
      this.subjectId = null;
      this.paginationService.resetPagination();
      // Marcar como cambio interno antes de sincronizar URL
      this.isInternalFilterChange = true;
      // Para KITS sin nivel: recargar con filtros base (año si seleccionado)
      if (this.categoriaActual === 'KITS') {
        this.onFilterChange();
        setTimeout(() => { this.protectVisibilityFlags = false; }, 200);
        return;
      }
      this.onFilterChange();
      // Desactivar protección
      setTimeout(() => {
        this.protectVisibilityFlags = false;
      }, 200);
      return;
    }

    // Cargar materias desde el backend
    const lvl = this.niveles.find(l => l.code === this.selectedNivel);
    this.levelId = lvl?.id ?? null;
    this.subjectId = null;
    if (this.levelId) {
      this.categoryService.getSubjects(this.levelId).subscribe(subjects => {
        this.materias = subjects;
        this.cdr.markForCheck();
      });
    }
    // Grados se cargan cuando el usuario seleccione materia
    console.log('[GRADOS-RESET] onNivelChange → grados=[]');
    this.grados = [];

    // Para KITS: cargar situaciones por nivel + año y cargar documentos filtrados
    if (this.categoriaActual === 'KITS' && this.selectedAnio) {
      this.document.getSituacionesByNivelAndAnio(this.selectedNivel, this.selectedAnio)
        .pipe(takeUntil(this.destroy$))
        .subscribe(res => {
          this.situaciones = res.data || [];
          this.cdr.markForCheck();
        });
      // Cargar documentos filtrados por año + nivel
      this.currentStep = 'documentos';
      this.paginationService.resetPagination();
      this.isInternalFilterChange = true;
      this.onFilterChange();
      setTimeout(() => { this.protectVisibilityFlags = false; }, 300);
      return;
    }

    // Determinar si debe cargar documentos o esperar más filtros
    const shouldLoadDocuments = this.shouldLoadDocumentsAfterNivel();

    // IMPORTANTE: Establecer currentStep y banderas ANTES de actualizar stateMachine
    // para que cuando el stateMachine dispare su observable, ya tengamos los valores correctos
    // Siempre mostrar documentos (cartas eliminadas)
    this.currentStep = 'documentos';

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
      // Resetear a página 1 al cambiar de nivel
      this.paginationService.resetPagination();
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

      // Desactivar protección después de sincronizar
      setTimeout(() => {
        this.protectVisibilityFlags = false;
      }, 300);
    }
  }

  private shouldLoadDocumentsAfterNivel(): boolean {
    // KITS siempre requiere selección de situación antes de cargar documentos
    if (this.categoriaActual === 'KITS') {
      return false;
    }

    // Todas las demás categorías cargan directo al seleccionar nivel
    // (las filter-cards fueron eliminadas, ya no se espera selección de materia antes de cargar)
    return true;
  }

  onMateriaChange(): void {
    // SIEMPRE limpiar grado al cambiar materia (incluso si materia queda vacía)
    this.selectedGrado = '';
    this.gradeId = null;

    // Forzar detección de cambios ANTES de sincronizar con servicios
    this.cdr.detectChanges();

    // Sincronizar con filterService DESPUÉS de detectar cambios
    this.filterService.setMateria(this.selectedMateria || '');
    this.filterService.setGrado('');

    // Si se selecciona "Todas las áreas", limpiar grados y recargar
    if (!this.selectedMateria) {
      console.log('[GRADOS-RESET] onMateriaChange materia=null → grados=[]');
      this.grados = [];
      this.subjectId = null;
      this.paginationService.resetPagination();
      // Marcar como cambio interno antes de sincronizar URL
      this.isInternalFilterChange = true;
      // KITS+SECUNDARIA exige materia — dejar pantalla vacía
      if (this.categoriaActual === 'KITS' && this.selectedNivel === 'SECUNDARIA') {
        this.documentList = [];
        this.syncFiltersToUrl();
        return;
      }
      this.onFilterChange();
      return;
    }

    // Cargar grados desde el backend para la materia seleccionada
    const sub = this.materias.find(s => s.code === this.selectedMateria);
    this.subjectId = sub?.id ?? null;
    console.log(`[GRADOS-MATERIA] onMateriaChange: materia=${this.selectedMateria} subjectId=${this.subjectId}`);
    if (this.subjectId) {
      this.categoryService.getGrades(this.subjectId).subscribe(grades => {
        console.log('[GRADOS-MATERIA] getGrades(', this.subjectId, ') →', grades.length, 'grados:', grades.map((g: any) => g.code));
        this.grados = grades;
        console.log('[GRADOS-MATERIA] this.grados asignados, length=', this.grados.length);
        this.cdr.detectChanges();
        setTimeout(() => {
          console.log('[GRADOS-MATERIA+200ms] this.grados.length=', this.grados.length, '| shouldShow=', this.shouldShowGradoSelect);
        }, 200);
      });
    } else {
      console.warn('[GRADOS-MATERIA] ⚠️ subjectId null — no se pueden cargar grados. materias=', this.materias.map(m => m.code), 'buscando=', this.selectedMateria);
    }

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

  onServicioChange(): void {
    this.paginationService.resetPagination(); // Resetear a página 1 al cambiar filtros
    this.onFilterChange();
  }

  /**
   * Maneja el cambio de grado desde el dropdown
   */
  onGradoChange(grado: string): void {
    // Resolver ID del grado seleccionado por code (el select enlaza grado.code)
    const gradoObj = this.grados.find(g => g.code === grado);
    this.gradeId = gradoObj?.id ?? null;

    this.filterService.setGrado(grado || '');
    this.paginationService.resetPagination(); // Resetear a página 1 al cambiar filtros

    // Actualizar state machine con el grado seleccionado
    this.stateMachine.updateFilters({ grado });

    this.onFilterChange();
  }

  /**
   * Maneja el cambio de año desde el dropdown (solo KITS)
   * Cascada: AÑO → resetear NIVEL, SITUACIÓN, MATERIA, GRADO
   */
  onAnioChange(): void {
    // Resetear filtros dependientes
    this.selectedNivel = '';
    this.selectedSituacion = null;
    this.selectedMateria = '';
    this.selectedGrado = '';
    this.levelId = null;
    this.subjectId = null;
    this.gradeId = null;
    this.situaciones = [];
    this.materias = [];
    console.log('[GRADOS-RESET] onAnioChange → grados=[]');
    this.grados = [];

    // Cargar niveles de PLANIFICACION si aún no están disponibles
    if (this.niveles.length === 0) {
      const planId = this.categoryIdMap.get('PLANIFICACION');
      if (planId) {
        this.categoryService.getLevels(planId)
          .pipe(takeUntil(this.destroy$))
          .subscribe(levels => {
            this.niveles = levels;
            this.cdr.markForCheck();
          });
      }
    }

    this.paginationService.resetPagination();

    // Si no hay año seleccionado, recargar con filtros base (todos los kits aprobados)
    if (!this.selectedAnio) {
      this.isInternalFilterChange = true;
      this.onFilterChange();
      return;
    }

    // Cargar documentos del año seleccionado (filtro progresivo)
    this.isInternalFilterChange = true;
    this.onFilterChange();
  }

  /**
   * Maneja el cambio de situación significativa (solo KITS)
   * Cascada: SITUACIÓN → resetear MATERIA, GRADO → cargar documentos
   */
  onSituacionChange(): void {
    // Resetear filtros dependientes (pero conservar materias — ya cargadas en onNivelChange)
    this.selectedMateria = '';
    this.selectedGrado = '';
    this.subjectId = null;
    this.gradeId = null;
    console.log('[GRADOS-RESET] onSituacionChange top → grados=[]');
    this.grados = [];

    this.paginationService.resetPagination();

    if (!this.selectedSituacion) {
      // Recargar con filtros actuales (año + nivel, sin situación)
      this.isInternalFilterChange = true;
      this.onFilterChange();
      return;
    }

    // Para KITS+SECUNDARIA: recargar materias para que el usuario pueda refinar
    if (this.selectedNivel === 'SECUNDARIA' && this.levelId) {
      this.categoryService.getSubjects(this.levelId).subscribe(subjects => {
        this.materias = subjects;
        this.cdr.markForCheck();
      });
    }

    // Para KITS+INICIAL/PRIMARIA: no se muestra select de área.
    // Usar this.materias (ya cargada en onNivelChange) para buscar COMUNICACION
    // y cargar sus grados automáticamente.
    if (this.selectedNivel === 'INICIAL' || this.selectedNivel === 'PRIMARIA') {
      console.log('[DEBUG-SITUACION] INICIAL/PRIMARIA: buscando COMUNICACION en materias ya cargadas:', this.materias.map(s => s.code));
      const comunicacion = this.materias.find(s =>
        s.code === 'COMUNICACION' || s.code === 'COMUNICACIÓN' ||
        s.name?.toUpperCase().includes('COMUNICACI')
      );
      if (comunicacion) {
        this.subjectId = comunicacion.id;
        console.log('[GRADOS-SIT] COMUNICACION encontrada, subjectId=', comunicacion.id, '→ getGrades...');
        this.categoryService.getGrades(comunicacion.id).subscribe(grades => {
          console.log(`[GRADOS-SIT] getGrades(${comunicacion.id}) → ${grades.length} grados:`, grades.map((g: any) => g.code));
          this.grados = grades;
          console.log('[GRADOS-SIT] this.grados.length=', this.grados.length, '| shouldShow=', this.shouldShowGradoSelect);
          this.cdr.detectChanges();
          // Verificar estado 200ms después por si algo lo resetea
          setTimeout(() => {
            console.log('[GRADOS-SIT+200ms] this.grados.length=', this.grados.length, '| shouldShow=', this.shouldShowGradoSelect);
          }, 200);
        });
      } else {
        console.warn('[GRADOS-SIT] ⚠️ COMUNICACION no encontrada. materias=', this.materias.map((s: any) => s.code));
      }
    }

    // Siempre cargar documentos al seleccionar situación
    this.isInternalFilterChange = true;
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
      selectedSituacion: this.selectedSituacion ?? undefined,
      selectedAnio: this.selectedAnio ?? undefined,
      categoryId: this.categoryId ?? undefined,
      // Para KITS: resolver el ID de PLANIFICACION como categoría destino
      targetCategoryId: this.categoriaActual === 'KITS'
        ? this.categoryIdMap.get('PLANIFICACION')
        : undefined,
      levelId: this.levelId ?? undefined,
      subjectId: this.subjectId ?? undefined,
      // Fallback inline: resuelve por code en caso de que onGradoChange no se haya ejecutado
      gradeId: this.gradeId ?? this.grados.find(g => g.code === this.selectedGrado)?.id ?? undefined
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
    this.documentList = response.data.map((doc: Document) =>
      this.documentLoader.processDocumentImage(doc)
    );

    this.hasSearched = this.documentList.length === 0;
    this.updatePagination(response.pagination?.cantidadDeDocumentos || response.data.length);
  }

  private handleFilterError(error: any): void {
    console.error('Error al filtrar documentos:', error);
    this.hasSearched = true;
    this.documentList = [];
  }

  resetFilters(clearUrl: boolean = true): void {
    this.clearSelections();
    this.resetState();
    this.updateFiltersForCurrentCategory();

    // Limpiar URL antes de cargar docs — marcar como interno para evitar doble procesamiento
    if (clearUrl) {
      this.isInternalFilterChange = true;
      this.urlSync.clearQueryParams();
    }

    this.loadInitialDocuments();
  }

  private clearSelections(): void {
    // Resetear variables locales del componente
    this.selectedNivel = '';
    this.selectedMateria = '';
    this.selectedGrado = '';
    this.gradeId = null;

    // Sincronizar con filterService
    this.filterService.resetSelections();
    this.comingFromFilter = false;
  }

  private resetState(): void {
    // Reset state machine to initial state
    this.stateMachine.reset();

    this.selectedServicio = this.categoriaActual;
    this.documentList = [];
    this.originalDocuments = [];
    this.levelId = null;
    this.subjectId = null;
    this.gradeId = null;
    // Resolver categoryId del mapa para que buildFilterParams tenga ID numérico
    this.categoryId = this.categoryIdMap.get(this.categoriaActual) ?? null;
    this.selectedAnio = null;
    this.selectedSituacion = null;
    this.anios = [];
    this.situaciones = [];
  }

  private updateFiltersForCurrentCategory(): void {
    const loadLevels = (catId: number) => {
      this.categoryService.getLevels(catId).subscribe(levels => {
        this.niveles = levels;
        this.cdr.markForCheck();
      });
    };

    // KITS usa los niveles de PLANIFICACION y necesita cargar los años disponibles
    if (this.categoriaActual === 'KITS') {
      const planId = this.categoryIdMap.get('PLANIFICACION');
      if (planId) {
        loadLevels(planId);
      }
      this.document.getAniosSituaciones()
        .pipe(takeUntil(this.destroy$))
        .subscribe(res => {
          this.anios = res.data || [];
          this.cdr.markForCheck();
        });
      return;
    }

    if (this.categoryId) {
      loadLevels(this.categoryId);
    } else {
      this.categoryService.getActiveCategories().pipe(take(1)).subscribe(cats => {
        // KITS no existe como categoría backend — usar PLANIFICACION como base
        const lookupCode = this.categoriaActual === 'KITS' ? 'PLANIFICACION' : this.categoriaActual;
        const found = cats.find(c => c.code === lookupCode);
        if (found) {
          this.categoryId = found.id;
          loadLevels(this.categoryId);
        }
      });
    }

    if (this.selectedNivel && this.levelId) {
      this.categoryService.getSubjects(this.levelId).subscribe(subjects => {
        this.materias = subjects;
        this.cdr.markForCheck();
      });
    } else {
      this.materias = [];
    }
    console.log('[GRADOS-RESET] updateFiltersForCurrentCategory end → grados=[]');
    this.grados = [];
  }

  private reloadDocuments(): void {
    const params = this.buildFilterParams();
    this.cargarDocumentos(params);
  }

  getColClass(index: number): string {
    const totalItems = this.documentList.length;

    if (totalItems > 0 && totalItems < 4) {
      return `col-lg-${12 / totalItems}`;
    }

    return 'col-xl-3 col-lg-4 col-md-6 col-sm-12 col-12';
  }

  get displayCategoria(): string {
    if (this.categoriaActual === 'PLANIFICACION') {
      return 'SESIONES';
    } else if (this.categoriaActual === 'PLAN_LECTOR') {
      return 'PLAN LECTOR';
    } else if (this.categoriaActual === 'MATERIAL_GRATIS') {
      return 'MATERIAL GRATIS';
    } else if (this.categoriaActual === 'EBOOKS') {
      return 'EBOOKS';
    } else {
      return this.categoriaActual;
    }
  }

  formatMateriaName(materia: string): string {
    return this.config.formatMateriaName(materia);
  }

  get areDropdownFiltersSelected(): boolean {
    return this.selectedServicio === 'RECURSOS'
      ? !!this.selectedNivel
      : !!(this.selectedMateria && this.selectedGrado);
  }

  get shouldShowLoading(): boolean {
    return this.isLoadingDocuments && (
      this.currentStep === 'documentos' ||
      this.comingFromFilter ||
      this.categoriaActual === 'TALLERES' ||
      this.categoriaActual === 'EBOOKS'
    );
  }

  getDescription(area: string): string {
    return this.config.getDescription(area);
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
    
    const currentPage = this.paginationService.getCurrentPage();
    const params: Record<string, string | null> = {
      // IDs numéricos — fuente de verdad para compartir URLs
      categoryId: this.categoryId ? String(this.categoryId) : null,
      levelId:    this.levelId    ? String(this.levelId)    : null,
      subjectId:  this.subjectId  ? String(this.subjectId)  : null,
      gradeId:    this.gradeId    ? String(this.gradeId)    : null,
      // KITS: año y situación
      anio:         this.selectedAnio        ? String(this.selectedAnio)        : null,
      situacionId:  this.selectedSituacion   ? String(this.selectedSituacion.id) : null,
      // Strings solo como fallback cuando no hay ID disponible
      nivel:   (!this.levelId   && this.selectedNivel)   ? this.selectedNivel   : null,
      materia: (!this.subjectId && this.selectedMateria) ? this.selectedMateria : null,
      grado:   (!this.gradeId   && this.selectedGrado)   ? this.selectedGrado   : null,
      // Para KITS el servicio siempre es PLANIFICACION, incluirlo explícitamente
      servicio: this.selectedServicio && this.selectedServicio !== this.categoriaActual
        ? this.selectedServicio : null,
      busqueda: searchTerm || null,
      // Página actual — solo incluir si no es la primera (evitar ruido en URL)
      pagina: currentPage > 1 ? String(currentPage) : null
    };

    
    this.urlSync.updateQueryParams(params);
  }

  /**
   * Genera URL compartible con los filtros actuales.
   * @returns URL completa lista para copiar y compartir
   */
  /**
   * Copia la URL compartible al portapapeles.
   * Muestra notificación al usuario.
   */
  copyShareableUrl(): void {
    const url = this.urlSync.getShareableUrl();
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

  // ============ MÉTODOS DE PAGINACIÓN (delegados a PaginationService) ============

  /**
   * Actualiza la paginación con el total del backend
   */
  private updatePagination(totalFromBackend?: number): void {
    if (totalFromBackend !== undefined) {
      this.paginationService.setTotalItems(totalFromBackend);
    }
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

  isActiveSidebarItem(item: SidebarNavItem): boolean {
    if (item.code === 'MEMBRESIAS') {
      return this.router.url.startsWith('/site/membresia');
    }
    return item.code === this.categoriaActual;
  }
}
