import { Component, OnDestroy, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DocumentData, Document } from '../../@core/interfaces/documents';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { SearchComponent } from '../../shared/component/search/search.component';
import { debounce } from 'lodash';
import { trigger, style, transition, animate } from '@angular/animations';

// Interfaces y tipos para mejor tipado
interface AreaData {
  nivel: string;
  area: string;
  icono: string;
  justificacion: string;
}

interface FilterParams {
  [key: string]: string;
}

type CurrentStep = 'niveles' | 'materias' | 'documentos';
type Categoria = 'PLANIFICACION' | 'EVALUACION' | 'ESTRATEGIAS' | 'RECURSOS' | 'CONCURSOS' | 'EBOOKS' | 'TALLERES' | 'PLAN_LECTOR' | 'REFORZAMIENTO' | 'KITS' | 'MATERIAL_GRATIS';

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
  private readonly DEFAULT_NIVELES = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
  private readonly CONCURSOS_NIVELES = ['PRIMARIA', 'SECUNDARIA'];
  private readonly SERVICIOS = ['PLANIFICACION', 'EVALUACION', 'ESTRATEGIAS', 'RECURSOS', 'CONCURSOS', 'EBOOKS', 'TALLERES', 'PLAN_LECTOR', 'REFORZAMIENTO', 'MATERIAL_GRATIS'];

  // Properties
  categoriaActual: Categoria = 'PLANIFICACION';
  private routeSubscription!: Subscription;
  private readonly destroy$ = new Subject<void>();

  ducumentList: Document[] = [];
  originalDocuments: Document[] = [];

  niveles: string[] = this.DEFAULT_NIVELES;
  materias: string[] = [];
  grados: string[] = [];
  servicios: string[] = this.SERVICIOS;
  
  selectedMateria = '';
  selectedNivel = '';
  selectedGrado = '';
  selectedServicio = '';

  currentStep: CurrentStep = 'niveles';
  hasSearched = false;
  comingFromFilter = false; 
  
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

  areasData = [
    // Nivel Inicial
    {
      nivel: 'INICIAL',
      area: 'PERSONAL_SOCIAL',
      icono: '👧🧒',
      justificacion: 'Representa interacción social y desarrollo emocional.',
    },
    {
      nivel: 'INICIAL',
      area: 'COMUNICACION',
      icono: '🗣📖',
      justificacion: 'Evoca el lenguaje oral y la lectura inicial.',
    },
    {
      nivel: 'INICIAL',
      area: 'MATEMATICA',
      icono: '🔢🧮',
      justificacion: 'Asociado al conteo, nociones básicas de número.',
    },
    {
      nivel: 'INICIAL',
      area: 'CIENCIA_Y_TECNOLOGIA',
      icono: '🔬🐛',
      justificacion: 'Exploración del entorno natural y tecnológico.',
    },
    {
      nivel: 'INICIAL',
      area: 'PSICOMOTRICIDAD',
      icono: '🧘‍♂🏃‍♀',
      justificacion: 'Movimiento corporal y coordinación.',
    },
    {
      nivel: 'INICIAL',
      area: 'TUTORIA',
      icono: '💬🧑‍🏫',
      justificacion: 'Acompañamiento afectivo y orientación personal.',
    },
    {
      nivel: 'PRIMARIA',
      area: 'PERSONAL_SOCIAL',
      icono: '🧍‍♂🧍‍♀🌍',
      justificacion: 'Formación en ciudadanía y entorno social.',
    },
    {
      nivel: 'PRIMARIA',
      area: 'COMUNICACION',
      icono: '📚📝',
      justificacion: 'Comprensión lectora y producción de textos.',
    },
    {
      nivel: 'PRIMARIA',
      area: 'MATEMATICA',
      icono: '➕➖✖➗',
      justificacion: 'Operaciones básicas, resolución de problemas.',
    },
    {
      nivel: 'PRIMARIA',
      area: 'CIENCIA_Y_TECNOLOGIA',
      icono: '⚗🌱💡',
      justificacion: 'Ciencias naturales, experimentación y curiosidad.',
    },
    {
      nivel: 'PRIMARIA',
      area: 'ARTE_Y_CULTURA',
      icono: '🎨🎭🎵',
      justificacion: 'Creatividad, expresión plástica y artística.',
    },
    {
      nivel: 'PRIMARIA',
      area: 'RELIGION',
      icono: '✝🕊',
      justificacion: 'Formación espiritual y valores. (Cambiar según creencias)',
    },
    {
      nivel: 'PRIMARIA',
      area: 'TUTORIA',
      icono: '🧠❤',
      justificacion: 'Formación socioemocional, habilidades blandas.',
    },
    {
      nivel: 'PRIMARIA',
      area: 'FISICA',
      icono: '🧠❤',
      justificacion: 'Formación socioemocional, habilidades blandas.',
    },
    // Secundaria
    {
      nivel: 'SECUNDARIA',
      area: 'COMUNICACION',
      icono: '🗞🖊',
      justificacion: 'Producción de textos, comprensión crítica.',
    },
    {
      nivel: 'SECUNDARIA',
      area: 'MATEMATICA',
      icono: '📐📊',
      justificacion: 'Geometría, álgebra, estadística.',
    },
    {
      nivel: 'SECUNDARIA',
      area: 'CIENCIAS_SOCIALES',
      icono: '🏛🌎',
      justificacion: 'Historia, geografía, formación ciudadana.',
    },
    {
      nivel: 'SECUNDARIA',
      area: 'DESARROLLO_PERSONAL',
      icono: '🧠🧘‍♀',
      justificacion: 'Identidad, proyecto de vida, autocuidado.',
    },
    {
      nivel: 'SECUNDARIA',
      area: 'CIENCIA_Y_TECNOLOGIA',
      icono: '🧬🔭',
      justificacion: 'Física, química, biología, investigación.',
    },
    {
      nivel: 'SECUNDARIA',
      area: 'ARTE_Y_CULTURA',
      icono: '🎼🖌🎬',
      justificacion: 'Apreciación artística, producción cultural.',
    },
    {
      nivel: 'SECUNDARIA',
      area: 'INGLES',
      icono: '📘',
      justificacion: 'Idioma extranjero, comunicación global.',
    },
    {
      nivel: 'SECUNDARIA',
      area: 'RELIGION',
      icono: '⛪📿',
      justificacion: 'Dimensión espiritual, ética.',
    },
    {
      nivel: 'SECUNDARIA',
      area: 'EPT',
      icono: '🛠💼',
      justificacion: 'Emprendimiento, habilidades técnicas.',
    },
    {
      nivel: 'SECUNDARIA',
      area: 'TUTORIA',
      icono: '🗣🧭',
      justificacion: 'Orientación vocacional, emocional, convivencia.',
    },
    {
      nivel: 'SECUNDARIA',
      area: 'FISICA',
      icono: '🧠❤',
      justificacion: 'Formación socioemocional, habilidades blandas.',
    },
    {
      nivel: 'SECUNDARIA',
      area: 'EMPRENDIMIENTO',
      icono: '🧠❤',
      justificacion: '🛠🤔💭 Habilidades técnicas y design thinkin',
    },
  ];

  constructor(
    private route: ActivatedRoute, 
    private document: DocumentData,
    private cdr: ChangeDetectorRef
  ) {
    this.cargarDocumentos = debounce(this.cargarDocumentos.bind(this), this.DEBOUNCE_TIME);
  }

  ngOnInit(): void {
    this.initializeRouteSubscriptions();
  }

  private initializeRouteSubscriptions(): void {
    this.routeSubscription = this.route.paramMap.pipe(
      switchMap(params => {
        const newCategoria = params.get('service') as Categoria || 'PLANIFICACION';
        this.handleCategoriaChange(newCategoria);
        
        // Retornar los queryParams para el switchMap
        return this.route.queryParams;
      }),
      takeUntil(this.destroy$)
    ).subscribe(queryParams => {
      this.handleQueryParams(queryParams);
    });
  }

  private handleCategoriaChange(newCategoria: Categoria): void {
    
    if (newCategoria !== this.categoriaActual) {
      this.categoriaActual = newCategoria;
      
      // Configure EBOOKS/TALLERES functionality
      if (newCategoria === 'EBOOKS') {
        this.showSubCategoryToggle = true;
        this.currentSubCategoria = 'EBOOKS';
      } else {
        this.showSubCategoryToggle = false;
        this.currentSubCategoria = 'EBOOKS'; // Reset to default
      }
      
      this.resetFilters();
      this.initializeCategoriaSpecificSettings();
    } else {
      this.categoriaActual = newCategoria;
    }
  }

  private handleQueryParams(queryParams: any): void {
    this.selectedNivel = queryParams['nivel'] || '';
    this.selectedMateria = queryParams['materia'] || '';
    this.selectedGrado = queryParams['grado'] || '';
    
    this.comingFromFilter = !!(queryParams['nivel'] || queryParams['materia'] || queryParams['grado']);
    this.selectedServicio = queryParams['servicio'] || this.getDefaultServicio();

    this.updateNiveles();
    this.updateMaterias(this.selectedNivel, this.categoriaActual);
    this.updateGrados(this.selectedNivel, this.selectedMateria);

    this.determineCurrentStep();
    this.loadInitialDocuments();
  }

  private getDefaultServicio(): string {
    return this.categoriaActual === 'KITS' ? 'PLANIFICACION' : this.categoriaActual;
    
  }

  private determineCurrentStep(): void {
    
    if (this.comingFromFilter && (this.selectedNivel || this.selectedMateria || this.selectedGrado)) {
      this.currentStep = 'documentos';
    } else if (this.categoriaActual === 'TALLERES') {
      this.currentStep = 'documentos';
    } else if (this.categoriaActual === 'MATERIAL_GRATIS') {
      // Material Gratuito siempre muestra documentos directamente
      this.currentStep = 'documentos';
    } else if (this.categoriaActual === 'EBOOKS' && this.currentSubCategoria === 'TALLERES') {
      this.currentStep = 'documentos';
    } else if (this.categoriaActual === 'KITS') {
      // Para KITS: mostrar niveles primero, luego materias si es SECUNDARIA
      if (!this.selectedNivel) {
        this.currentStep = 'niveles';
      } else if (this.selectedNivel === 'SECUNDARIA' && !this.selectedMateria) {
        // Asegurar que las materias estén actualizadas
        this.updateMaterias(this.selectedNivel, 'PLANIFICACION');
        this.currentStep = 'materias';
      } else {
        this.currentStep = 'documentos';
      }
    } else {
      this.currentStep = 'niveles';
    }
  }

  private initializeCategoriaSpecificSettings(): void {
    
    if (this.categoriaActual === 'TALLERES') {
      this.currentStep = 'documentos';
    } else if (this.categoriaActual === 'MATERIAL_GRATIS') {
      // Material Gratuito siempre muestra documentos directamente
      this.currentStep = 'documentos';
    } else if (this.categoriaActual === 'EBOOKS') {
      // For EBOOKS, always go to documents and use currentSubCategoria
      this.currentStep = 'documentos';
    } else if (this.categoriaActual === 'KITS') {
      // Para KITS: empezar con niveles
      this.currentStep = 'niveles';
      this.selectedServicio = 'PLANIFICACION';
    } else {
      this.currentStep = 'niveles';
    }
  }

  private loadInitialDocuments(): void {
    let params: FilterParams;
    
    if (this.categoriaActual === 'MATERIAL_GRATIS') {
      params = {
        documentoLibre: 'true'
      };
    } else if (this.categoriaActual === 'TALLERES') {
      params = {
        category: this.categoriaActual,
        format: 'ZIP'
      };
    } else if (this.categoriaActual === 'EBOOKS') {
      // Use currentSubCategoria to determine which documents to load
      params = {
        category: this.currentSubCategoria,
        format: this.currentSubCategoria === 'TALLERES' ? 'ZIP' : undefined
      };
      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
    } else if (this.categoriaActual === 'KITS') {
      params = {
        category: 'PLANIFICACION',
        format: 'ZIP'
      };
    } else if (this.categoriaActual === 'PLANIFICACION') {
      params = {
        category: 'PLANIFICACION',
        format: 'DOCX'
      };
    } else {
      params = { category: this.categoriaActual };
    }

    if (this.comingFromFilter && (this.selectedNivel || this.selectedMateria || this.selectedGrado)) {
      this.onFilterChange();
    } else if (this.categoriaActual === 'KITS' && !this.comingFromFilter) {
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

  private updateNiveles(): void {
    if (this.categoriaActual === 'CONCURSOS') {
      this.niveles = this.CONCURSOS_NIVELES;
    } else if (this.categoriaActual === 'REFORZAMIENTO') {
      this.niveles = ['SECUNDARIA'];
    } else {
      this.niveles = this.DEFAULT_NIVELES;
    }
  }

  // Método optimizado para cargar documentos
  cargarDocumentos(params: FilterParams): void {
    this.isLoadingDocuments = true;
    
    // Para Material Gratuito, usar endpoint específico
    if (this.categoriaActual === 'MATERIAL_GRATIS') {
      this.document.getDocumentFree()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.handleInitialDocumentsLoad(response);
            
            // FIX CRÍTICO: Para EBOOKS, forzar currentStep a 'documentos'
            if (this.categoriaActual === 'EBOOKS') {
              this.currentStep = 'documentos';
              this.cdr.detectChanges();
            }
            
            this.isLoadingDocuments = false;
          },
          error: (error) => {
            console.error('❌ Material Gratuito error:', error);
            this.handleDocumentsError(error);
            this.isLoadingDocuments = false;
          }
        });
    } else {
      // Para otras categorías, usar filtrado normal
      this.document.filterDocuments(params)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.handleInitialDocumentsLoad(response);
            
            // FIX CRÍTICO: Para EBOOKS, forzar currentStep a 'documentos'
            if (this.categoriaActual === 'EBOOKS') {
              this.currentStep = 'documentos';
              this.cdr.detectChanges();
            }
            
            this.isLoadingDocuments = false;
          },
          error: (error) => {
            console.error('🔥 cargarDocumentos error:', error);
            this.handleDocumentsError(error);
            this.isLoadingDocuments = false;
          }
        });
    }
  }

  // Método para manejar la carga inicial de documentos
  private handleInitialDocumentsLoad(response: any): void {
    
    // Filtrar originalDocuments según la categoría para que reset funcione correctamente
    if (this.categoriaActual === 'MATERIAL_GRATIS') {
      // Para MATERIAL_GRATIS, los documentos ya vienen filtrados del endpoint específico
      this.originalDocuments = response.data || [];
    } else if (this.categoriaActual === 'PLANIFICACION') {
      // Para PLANIFICACION, solo guardar documentos que NO sean ZIP
      this.originalDocuments = response.data.filter((doc: Document) => 
        doc.category === this.categoriaActual && doc.format !== 'ZIP'
      );
    } else if (this.categoriaActual === 'KITS') {
      // Para KITS, solo guardar documentos ZIP de PLANIFICACION
      this.originalDocuments = response.data.filter((doc: Document) => 
        doc.category === 'PLANIFICACION' && doc.format === 'ZIP'
      );
    } else if (this.categoriaActual === 'EBOOKS') {
      // Para EBOOKS, guardar documentos según la subcategoría actual
      if (this.currentSubCategoria === 'TALLERES') {
        this.originalDocuments = response.data.filter((doc: Document) => 
          doc.category === 'TALLERES'
        );
      } else {
        this.originalDocuments = response.data.filter((doc: Document) => 
          doc.category === 'EBOOKS'
        );
      }
    } else {
      // Para otras categorías, guardar todos los documentos de la categoría
      this.originalDocuments = response.data.filter((doc: Document) => 
        doc.category === this.categoriaActual
      );
    }
    
    if (this.categoriaActual === 'KITS') {
      this.handleKitsInitialLoad(response);
    } else {
      this.handleRegularInitialLoad(response);
    }
    
    this.updateMaterias(this.selectedNivel, this.categoriaActual);
    this.updateGrados(this.selectedNivel, this.selectedMateria);
    this.hasSearched = this.ducumentList.length === 0;
  }

  // Método específico para carga inicial de KITS
  private handleKitsInitialLoad(response: any): void {
    this.ducumentList = response.data
      .filter((doc: Document) => {
        if (this.selectedServicio === 'KITS') {
          return doc.category === 'PLANIFICACION';  
        }
        return doc.category === this.selectedServicio;
      })
      .map((doc: Document) => this.processDocumentImage(doc));
  }

  // Método específico para carga inicial regular
  private handleRegularInitialLoad(response?: any): void {
    
    if (this.categoriaActual === 'MATERIAL_GRATIS') {
      // Para MATERIAL_GRATIS, usar directamente originalDocuments (ya vienen filtrados)
      this.ducumentList = this.originalDocuments.map((doc: Document) => {
        return this.processDocumentImage(doc);
      });
    } else if (this.categoriaActual === 'EBOOKS') {
      // Para EBOOKS, usar directamente originalDocuments (ya filtrados por categoría)
      this.ducumentList = this.originalDocuments.map((doc: Document) => {
        return this.processDocumentImage(doc);
      });
    } else {
      // Para otras categorías, usar la lógica de filtrado normal con response.data
      
      // Listar todas las categorías únicas para debug
      const categorias = [...new Set(response.data.map(doc => doc.category))];
      
      this.ducumentList = response.data
        .filter((doc: Document) => {
          let shouldInclude = false;
          if (this.categoriaActual === 'EBOOKS') {
            // Para EBOOKS, filtrar según la subcategoría actual
            if (this.currentSubCategoria === 'TALLERES') {
              shouldInclude = doc.category === 'TALLERES';
            } else {
              shouldInclude = doc.category === 'EBOOKS';
            }
          } else if (['TALLERES', 'REFORZAMIENTO', 'PLAN_LECTOR'].includes(this.categoriaActual)) {
            // Para TALLERES, REFORZAMIENTO y PLAN_LECTOR, mostrar todos los formatos
            shouldInclude = doc.category === this.categoriaActual;
          } else {
            // Para PLANIFICACION y otras categorías, solo documentos que NO sean ZIP
            shouldInclude = doc.category === this.categoriaActual && doc.format !== 'ZIP';
          }
          return shouldInclude;
        })
        .map((doc: Document) => this.processDocumentImage(doc));
    }
  }

  // Método para procesar imágenes de documentos
  private processDocumentImage(doc: Document): Document {
    if (doc.imagenUrlPublic && doc.imagenUrlPublic.includes('|')) {
      const urls = doc.imagenUrlPublic.split('|');
      if (urls.length > 0) {
        doc.imagenUrlPublic = urls[0];
      }
    }
    return doc;
  }

  // Método para manejar errores de carga de documentos
  private handleDocumentsError(error: any): void {
    console.error('Error al cargar documentos:', error);
    this.hasSearched = true;
    this.ducumentList = [];
  }

  processSearch(event: string): void {
    const searchTerm = event.trim();
    
    if (!searchTerm) {
      this.resetToOriginalDocuments();
      return;
    }

    this.performDocumentSearchWithFilters(searchTerm);
  }

  private resetToOriginalDocuments(): void {
    // Verificar si hay filtros activos
    const hasActiveFilters = this.selectedNivel || this.selectedMateria || this.selectedGrado;
    
    if (hasActiveFilters) {
      // Si hay filtros activos, aplicar filtros en lugar de mostrar todos los documentos
      this.onFilterChange();
    } else {
      // Si no hay filtros, mostrar documentos originales
      this.ducumentList = [...this.originalDocuments];
    }
    
    this.searchComponent?.updateSuggestions([]);
    this.hasSearched = false;
  }

  private performDocumentSearchWithFilters(searchTerm: string): void {
    this.isLoadingDocuments = true;
    
    // Construir parámetros de búsqueda que incluyen el término y los filtros actuales
    const searchParams = this.buildSearchParams(searchTerm);
    
    this.document.getSearch(searchParams, 1, 50) // Página 1, 50 elementos por defecto
      .pipe(takeUntil(this.destroy$))
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

  private buildSearchParams(searchTerm: string): Record<string, string> {
    const params: Record<string, string> = {
      title: searchTerm
    };

    // Agregar filtros seleccionados
    if (this.selectedNivel) params['nivel'] = this.selectedNivel;
    if (this.selectedMateria) params['area'] = this.selectedMateria;
    if (this.selectedGrado) params['grado'] = this.selectedGrado;

    // Lógica de categoría y formato
    if (this.categoriaActual === 'MATERIAL_GRATIS') {
      // Para MATERIAL_GRATIS usar documentoLibre=true en lugar de category
      params['documentoLibre'] = 'true';
    } else if (this.categoriaActual === 'KITS') {
      params['category'] = 'PLANIFICACION';
      params['format'] = 'ZIP';
    } else if (this.categoriaActual === 'EBOOKS') {
      // Use currentSubCategoria for EBOOKS
      params['category'] = this.currentSubCategoria;
      if (this.currentSubCategoria === 'TALLERES') {
        params['format'] = 'ZIP';
        params['category'] = 'TALLERES';
      }
    } else if (this.categoriaActual === 'PLANIFICACION' || this.displayCategoria === 'SESIONES') {
      params['category'] = 'PLANIFICACION';
      params['format'] = 'DOCX';
    } else if (['REFORZAMIENTO', 'PLAN_LECTOR', 'TALLERES'].includes(this.categoriaActual)) {
      // Para estas categorías, no especificar formato para permitir todos
      params['category'] = this.categoriaActual;
    } else {
      params['category'] = this.categoriaActual;
    }
    params['suscripcion'] = 'false';
    return params;
  }

  private performDocumentSearch(searchTerm: string): void {
    this.isLoadingDocuments = true;
    this.document.searchDocuments('title', searchTerm)
      .pipe(takeUntil(this.destroy$))
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
    const searchResults = response.data.filter((doc: Document) => {
      // Filtrar por categoría
      let categoryMatch = false;
      
      if (this.categoriaActual === 'MATERIAL_GRATIS') {
        // Para MATERIAL_GRATIS, buscar documentos con documentoLibre=true
        return doc.documentoLibre === true;
      } else if (this.categoriaActual === 'KITS') {
        // Para KITS, buscar en documentos de categoría PLANIFICACION
        categoryMatch = doc.category === 'PLANIFICACION';
      } else {
        categoryMatch = doc.category === this.categoriaActual;
      }
      
      if (!categoryMatch) {
        return false;
      }
      
      // Filtrar por formato según la categoría actual
      if (this.categoriaActual === 'PLANIFICACION') {
        // PLANIFICACION: Solo documentos que NO sean ZIP
        return doc.format !== 'ZIP';
      } else if (this.categoriaActual === 'KITS') {
        // KITS: Solo documentos que SÍ sean ZIP
        return doc.format === 'ZIP';
      } else if (['TALLERES', 'REFORZAMIENTO', 'PLAN_LECTOR'].includes(this.categoriaActual)) {
        // Para TALLERES, REFORZAMIENTO y PLAN_LECTOR, aceptar todos los formatos
        return true;
      } else {
        // Para otras categorías, solo documentos que NO sean ZIP
        return doc.format !== 'ZIP';
      }
    });
    
    this.ducumentList = searchResults.map((doc: Document) => 
      this.processDocumentImage(doc)
    );
    
    const suggestions = searchResults.map((doc: Document) => doc.title);
    this.searchComponent?.updateSuggestions(suggestions);
    
    this.hasSearched = this.ducumentList.length === 0;
  }

  private handleSearchError(error: any): void {
    console.error('Error al buscar documentos:', error);
    this.hasSearched = true;
    this.ducumentList = [];
  }

  private handleSearchWithFiltersResponse(response: any): void {
    // Procesar la respuesta de búsqueda con filtros
    this.ducumentList = response.data.map((doc: Document) => 
      this.processDocumentImage(doc)
    );
    
    const suggestions = response.data.map((doc: Document) => doc.title);
    this.searchComponent?.updateSuggestions(suggestions);
    
    this.hasSearched = this.ducumentList.length === 0;
  }

  onNivelChange(): void {
    const categoria = this.categoriaActual === 'KITS' ? this.selectedServicio : this.categoriaActual;
    
    // Resetear situaciones al cambiar nivel
    this.situaciones = [];
    this.selectedSituacion = null;
    this.showSituacionesList = false;
    this.isLoadingSituaciones = false;
    
    // Si se selecciona "Todos los niveles", limpiar materias y grados
    if (!this.selectedNivel) {
      this.materias = [];
      this.grados = [];
      this.selectedMateria = '';
      this.selectedGrado = '';
      this.currentStep = 'documentos';
    } else {
      this.updateMaterias(this.selectedNivel, categoria);
      this.resetSelections();
      
      if (this.categoriaActual === 'KITS') {
        this.updateGrados(this.selectedNivel);
      }
      
      if (this.selectedServicio === 'CONCURSOS') {
        this.currentStep = 'documentos';
      }
    }
    
    this.onFilterChange();
  }

  onMateriaChange(): void {
    // Si se selecciona "Todas las áreas", limpiar grados
    if (!this.selectedMateria) {
      this.grados = [];
      this.selectedGrado = '';
    } else {
      this.updateGrados(this.selectedNivel, this.selectedMateria);
      this.selectedGrado = '';
    }
    
    this.currentStep = 'documentos';
    this.onFilterChange();
  }

  // Method to handle level selection
  onNivelSelect(nivel: string): void {
    this.selectedNivel = nivel;
    this.comingFromFilter = false;
    
    if (this.categoriaActual === 'KITS') {
      // Para KITS: actualizar materias inmediatamente
      this.updateMaterias(nivel, 'PLANIFICACION');
      this.updateGrados(nivel);
      
      // Cargar situaciones para el nivel seleccionado
      this.loadSituacionesByNivel();
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
      
      if (nivel === 'SECUNDARIA') {
        // Usar setTimeout para asegurar que el DOM se actualice
        setTimeout(() => {
          this.currentStep = 'materias';
          this.cdr.detectChanges();
        }, 10);
      } else {
        this.currentStep = 'documentos';
        this.onFilterChange();
      }
    } else {
      // Flujo normal para otras categorías
      this.updateMaterias(nivel, this.categoriaActual);
      this.updateGrados(nivel);
      this.currentStep = 'materias';
      
      // Categorías que van directo a documentos después de seleccionar nivel
      const shouldGoDirectToDocuments = ['RECURSOS', 'ESTRATEGIAS', 'EBOOKS'].includes(this.selectedServicio);
      
      // PLAN_LECTOR y REFORZAMIENTO siempre pasan por materias para mostrar grados
      const shouldShowMaterias = ['PLAN_LECTOR', 'REFORZAMIENTO'].includes(this.categoriaActual);
      
      if (shouldGoDirectToDocuments && !shouldShowMaterias) {
        this.currentStep = 'documentos';
        this.onFilterChange();
      }
    }
  }

  // Method to handle subject selection
  onMateriaSelect(materia: string): void {
    this.selectedMateria = materia;
    this.comingFromFilter = false;
    
    this.updateGrados(this.selectedNivel, materia);
    this.currentStep = 'documentos';
    this.onFilterChange();
  }

  onServicioChange(): void {
    this.onFilterChange();
  }

  // Adjusted onFilterChange to ensure it works with the new flow
  onFilterChange(): void {
    const params = this.buildFilterParams();
    
    // Mostrar loading solo cuando no hay cartas de filtro visibles
    if (this.currentStep === 'documentos' || this.comingFromFilter) {
      this.isLoadingDocuments = true;
    }
    
    this.document.filterDocuments(params)
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
    const params: FilterParams = {};
    
    if (this.selectedMateria) params['materia'] = this.selectedMateria;
    if (this.selectedNivel) params['nivel'] = this.selectedNivel;
    if (this.selectedGrado) params['grado'] = this.selectedGrado;

    if (this.categoriaActual === 'MATERIAL_GRATIS') {
      // Para MATERIAL_GRATIS usar documentoLibre=true en lugar de category
      params['documentoLibre'] = 'true';
    } else if (this.categoriaActual === 'KITS') {
      params['category'] = 'PLANIFICACION';
      params['format'] = 'ZIP';
    } else if (this.categoriaActual === 'EBOOKS') {
      // Use currentSubCategoria for EBOOKS
      params['category'] = this.currentSubCategoria;
      if (this.currentSubCategoria === 'TALLERES') {
        params['format'] = 'ZIP';
      }
    } else if (this.categoriaActual === 'TALLERES') {
      params['category'] = this.categoriaActual;
      params['format'] = 'ZIP';
    } else if (['REFORZAMIENTO', 'PLAN_LECTOR'].includes(this.categoriaActual)) {
      // Para REFORZAMIENTO y PLAN_LECTOR, permitir todos los formatos
      params['category'] = this.categoriaActual;
    } else if (this.selectedServicio) {
      params['category'] = this.selectedServicio === 'SESIONES' 
        ? 'PLANIFICACION' 
        : this.selectedServicio;
      
      // Para SESIONES (PLANIFICACION) siempre DOCX

      if (this.categoriaActual === 'PLANIFICACION') {
        params['format'] = 'DOCX';
      }
    }
    return params;
  }

  private handleFilterResponse(response: any): void {
    if (this.categoriaActual === 'KITS') {
      this.handleKitsFilterResponse(response);
    } else {
      this.handleRegularFilterResponse(response);
    }
  }

  private handleKitsFilterResponse(response: any): void {
    if (this.selectedServicio === 'SESIONES') {
      this.selectedServicio = 'PLANIFICACION';
    }

    const filteredDocs = response.data.filter((doc: Document) => 
      doc.category === this.selectedServicio && doc.format === 'ZIP'
    );

    this.ducumentList = filteredDocs.map((doc: Document) => 
      this.processDocumentImage(doc)
    );

    this.hasSearched = this.ducumentList.length === 0;
  }

  private handleRegularFilterResponse(response: any): void {
    const filteredDocs = response.data.filter((doc: Document) => {
      if (this.categoriaActual === 'MATERIAL_GRATIS') {
        // Para MATERIAL_GRATIS, mostrar documentos con documentoLibre=true
        return doc.documentoLibre === true;
      } else if (['TALLERES', 'REFORZAMIENTO', 'PLAN_LECTOR'].includes(this.categoriaActual)) {
        // Para TALLERES, REFORZAMIENTO y PLAN_LECTOR, mostrar todos los formatos
        return doc.category === this.categoriaActual;
      }
      // Para PLANIFICACION y otras categorías, solo documentos que NO sean ZIP
      return doc.category === this.categoriaActual && doc.format !== 'ZIP';
    });

    this.ducumentList = filteredDocs;
    this.hasSearched = this.ducumentList.length === 0;
  }

  private handleFilterError(error: any): void {
    console.error('Error al filtrar documentos:', error);
    this.hasSearched = true;
    this.ducumentList = [];
  }

  // Constants for subject configuration
  private readonly MATERIAS_CONFIG: Record<string, Record<string, string[]>> = {
    'PLANIFICACION': {
      'INICIAL': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD', 'TUTORIA'],
      'PRIMARIA': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION', 'TUTORIA'],
      'SECUNDARIA': ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT', 'TUTORIA']
    },
    'EVALUACION': {
      'INICIAL': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD'],
      'PRIMARIA': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION', 'FISICA'],
      'SECUNDARIA': ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EMPRENDIMIENTO', 'FISICA']
    },
    'ESTRATEGIAS': {
      'INICIAL': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD'],
      'PRIMARIA': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION'],
      'SECUNDARIA': ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT']
    },
    'EBOOKS': {
      'INICIAL': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD', 'TUTORIA'],
      'PRIMARIA': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION', 'TUTORIA'],
      'SECUNDARIA': ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT', 'TUTORIA']
    },
    'TALLERES': {
      'INICIAL': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD'],
      'PRIMARIA': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION', 'FISICA'],
      'SECUNDARIA': ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EMPRENDIMIENTO', 'FISICA']
    },
    'PLAN_LECTOR': {
      'INICIAL': ['COMUNICACION'],
      'PRIMARIA': ['COMUNICACION'],
      'SECUNDARIA': ['COMUNICACION']
    },
    'REFORZAMIENTO': {
      'SECUNDARIA': ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA']
    },
    'MATERIAL_GRATIS': {
      'INICIAL': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD', 'TUTORIA'],
      'PRIMARIA': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION', 'TUTORIA', 'FISICA'],
      'SECUNDARIA': ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT', 'TUTORIA', 'EMPRENDIMIENTO', 'FISICA']
    }
  };

  private readonly GRADOS_CONFIG: Record<string, string[]> = {
    'INICIAL': ['3 años', '4 años', '5 años'],
    'PRIMARIA': ['III CICLO 1°-2°', 'IV CICLO 3°-4°', 'V CICLO 5°-6°'],
    'SECUNDARIA': ['1°', '2°', '3°', '4°', '5°']
  };

  private readonly GRADOS_ESPECIALES_SECUNDARIA = ['1°-2°', '3°-4°', '5°'];
  private readonly MATERIAS_GRADOS_ESPECIALES = ['ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT', 'TUTORIA'];

  private updateMaterias(nivel: string, categoria: string): void {
    // Si no hay nivel seleccionado, obtener todas las materias disponibles para la categoría
    if (!nivel) {
      // Para KITS usar PLANIFICACION, para MATERIAL_GRATIS usar MATERIAL_GRATIS
      const categoriaParaMaterias = this.categoriaActual === 'KITS' ? 'PLANIFICACION' : categoria;
      const allMaterias = new Set<string>();
      
      // Recopilar todas las materias de todos los niveles para esta categoría
      Object.keys(this.MATERIAS_CONFIG[categoriaParaMaterias] || {}).forEach(nivelKey => {
        this.MATERIAS_CONFIG[categoriaParaMaterias][nivelKey].forEach(materia => {
          allMaterias.add(materia);
        });
      });
      
      this.materias = Array.from(allMaterias).sort();
    } else {
      // Para KITS, siempre usar PLANIFICACION como categoría
      // Para MATERIAL_GRATIS, usar MATERIAL_GRATIS
      const categoriaParaMaterias = this.categoriaActual === 'KITS' ? 'PLANIFICACION' : categoria;
      this.materias = this.MATERIAS_CONFIG[categoriaParaMaterias]?.[nivel] || [];
    }
  }

  private updateGrados(nivel: string, materia?: string): void {
    // Si no hay nivel seleccionado, obtener todos los grados disponibles
    if (!nivel) {
      const allGrados = new Set<string>();
      
      // Recopilar todos los grados de todos los niveles
      Object.keys(this.GRADOS_CONFIG).forEach(nivelKey => {
        this.GRADOS_CONFIG[nivelKey].forEach(grado => {
          allGrados.add(grado);
        });
      });
      
      // Añadir grados especiales
      this.GRADOS_ESPECIALES_SECUNDARIA.forEach(grado => {
        allGrados.add(grado);
      });
      
      // Para KITS, añadir UNIDOCENTE si es aplicable
      if (this.categoriaActual === 'KITS') {
        allGrados.add('UNIDOCENTE');
      }
      
      this.grados = Array.from(allGrados).sort();
    } else {
      this.grados = this.getGradosForLevel(nivel, materia);
      
      // Lógica específica para KITS
      if (this.categoriaActual === 'KITS') {
        this.applyKitsSpecificLogic(nivel, materia);
      }
    }
  }

  private getGradosForLevel(nivel: string, materia?: string): string[] {
    if (!nivel) {
      return []; // Será manejado por updateGrados
    }
    
    // Para REFORZAMIENTO, siempre usar grados individuales en SECUNDARIA
    if (this.categoriaActual === 'REFORZAMIENTO' && nivel === 'SECUNDARIA') {
      return ['1°', '2°', '3°', '4°', '5°'];
    }
    
    // Para PLAN_LECTOR, usar los mismos grados que PLANIFICACION
    if (this.categoriaActual === 'PLAN_LECTOR') {
      return [...(this.GRADOS_CONFIG[nivel] || [])];
    }
    
    // Lógica normal para otras categorías
    if (nivel === 'SECUNDARIA' && materia && this.MATERIAS_GRADOS_ESPECIALES.includes(materia)) {
      return [...this.GRADOS_ESPECIALES_SECUNDARIA];
    }
    return [...(this.GRADOS_CONFIG[nivel] || [])];
  }

  private applyKitsSpecificLogic(nivel: string, materia?: string): void {
    if (nivel === 'INICIAL') {
      this.grados = [...this.grados, 'UNIDOCENTE'];
    } else if (nivel === 'SECUNDARIA' && materia === 'ARTE_Y_CULTURA') {
      this.grados = ['1°', '2°', '3°', '4°', '5°'];
    }
  }

  private resetSelections(): void {
    this.selectedMateria = '';
    this.selectedGrado = '';
    // Para KITS, no limpiar grados aquí ya que se actualizan después
    if (this.categoriaActual !== 'KITS') {
      this.grados = [];
    }
  }

  resetFilters(): void {
    this.clearSelections();
    this.resetState();
    this.updateFiltersForCurrentCategory();
    this.reloadDocuments();
  }

  private clearSelections(): void {
    this.selectedNivel = '';
    this.selectedMateria = '';
    this.selectedGrado = '';
    this.comingFromFilter = false;
  }

  private resetState(): void {
    this.currentStep = 'niveles';
    this.selectedServicio = this.categoriaActual;
    this.ducumentList = [...this.originalDocuments];
    
    // Resetear estado de situaciones
    this.situaciones = [];
    this.selectedSituacion = null;
    this.showSituacionesList = false;
    this.isLoadingSituaciones = false;
  }

  private updateFiltersForCurrentCategory(): void {
    this.updateNiveles();
    this.updateMaterias(this.selectedNivel, this.categoriaActual);
    this.updateGrados(this.selectedNivel);
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
    return materia.replace(/_/g, ' ');
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
      this.determineCurrentStep();
      this.loadDocumentsForSubCategory();
    }
  }

  private loadDocumentsForSubCategory(): void {
    let params: FilterParams;
    
    if (this.currentSubCategoria === 'TALLERES') {
      params = { 
        category: 'TALLERES',
        format: 'ZIP'
      };
    } else {
      params = { category: 'EBOOKS' };
    }
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
    const areaData = this.areasData.find(data => 
      data.area === area && data.nivel === this.selectedNivel
    );
    
    return areaData 
      ? `${areaData.icono} ${areaData.justificacion}`
      : 'Descripción no disponible.';
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
    
    this.isLoadingDocuments = true;
    
    this.document.filterDocuments(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ducumentList = response.data
            .filter((doc: Document) => doc.category === 'PLANIFICACION' && doc.format === 'ZIP')
            .map((doc: Document) => this.processDocumentImage(doc));
          
          this.isLoadingDocuments = false;
          this.hasSearched = this.ducumentList.length === 0;
          
          // Ocultar las situaciones después de cargar
          this.showSituacionesList = false;
        },
        error: (error) => {
          console.error('Error al cargar documentos de situación:', error);
          this.isLoadingDocuments = false;
          this.hasSearched = true;
          this.ducumentList = [];
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
}
