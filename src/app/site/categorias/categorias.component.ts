import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DocumentData, Document } from '../../@core/interfaces/documents';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SearchComponent } from '../../shared/component/search/search.component';
import { debounce } from 'lodash';

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
type Categoria = 'PLANIFICACION' | 'EVALUACION' | 'ESTRATEGIAS' | 'RECURSOS' | 'CONCURSOS' | 'EBOOKS' | 'TALLERES' | 'KITS';

@Component({
  selector: 'ngx-categorias',
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.scss']
})
export class CategoriasComponent implements OnInit, OnDestroy {
  @ViewChild(SearchComponent) searchComponent!: SearchComponent;

  // Constants
  private readonly DEBOUNCE_TIME = 300;
  private readonly DEFAULT_NIVELES = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
  private readonly CONCURSOS_NIVELES = ['PRIMARIA', 'SECUNDARIA'];
  private readonly SERVICIOS = ['PLANIFICACION', 'EVALUACION', 'ESTRATEGIAS', 'RECURSOS', 'CONCURSOS', 'EBOOKS', 'TALLERES'];

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

  constructor(private route: ActivatedRoute, private document: DocumentData) {
    this.cargarDocumentos = debounce(this.cargarDocumentos.bind(this), this.DEBOUNCE_TIME);
  }

  ngOnInit(): void {
    this.initializeRouteSubscriptions();
  }

  private initializeRouteSubscriptions(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const newCategoria = params.get('service') as Categoria || 'PLANIFICACION';
      this.handleCategoriaChange(newCategoria);
      
      this.route.queryParams.subscribe(queryParams => {
        this.handleQueryParams(queryParams);
      });
    });
  }

  private handleCategoriaChange(newCategoria: Categoria): void {
    if (newCategoria !== this.categoriaActual) {
      this.categoriaActual = newCategoria;
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
    } else if (this.categoriaActual === 'KITS' || this.categoriaActual === 'TALLERES') {
      this.currentStep = 'documentos';
    } else {
      this.currentStep = 'niveles';
    }
  }

  private initializeCategoriaSpecificSettings(): void {
    if (this.categoriaActual === 'KITS' || this.categoriaActual === 'TALLERES') {
      this.currentStep = 'documentos';
      if (this.categoriaActual === 'KITS') {
        this.selectedServicio = 'PLANIFICACION';
      }
    } else {
      this.currentStep = 'niveles';
    }
  }

  private loadInitialDocuments(): void {
    let params: FilterParams;
    
    if (this.categoriaActual === 'KITS' || this.categoriaActual === 'TALLERES') {
      params = {
        category: this.categoriaActual === 'KITS' ? 'PLANIFICACION' : this.categoriaActual,
        format: 'ZIP'
      };
    } else {
      params = { category: this.categoriaActual };
    }

    if (this.comingFromFilter && (this.selectedNivel || this.selectedMateria || this.selectedGrado)) {
      this.onFilterChange();
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
    this.niveles = this.categoriaActual === 'CONCURSOS' 
      ? this.CONCURSOS_NIVELES 
      : this.DEFAULT_NIVELES;
  }

  // Método optimizado para cargar documentos
  cargarDocumentos(params: FilterParams): void {
    this.document.filterDocuments(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleInitialDocumentsLoad(response),
        error: (error) => this.handleDocumentsError(error)
      });
  }

  // Método para manejar la carga inicial de documentos
  private handleInitialDocumentsLoad(response: any): void {
    this.originalDocuments = [...response.data];
    
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
  private handleRegularInitialLoad(response: any): void {
    this.ducumentList = response.data
      .filter((doc: Document) => {
        if (this.categoriaActual === 'TALLERES') {
          return doc.category === this.categoriaActual;
        }
        return doc.format !== 'ZIP';
      })
      .map((doc: Document) => this.processDocumentImage(doc));
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

    this.performDocumentSearch(searchTerm);
  }

  private resetToOriginalDocuments(): void {
    this.ducumentList = [...this.originalDocuments];
    this.searchComponent?.updateSuggestions([]);
    this.hasSearched = false;
  }

  private performDocumentSearch(searchTerm: string): void {
    this.document.searchDocuments('title', searchTerm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleSearchResponse(response),
        error: (error) => this.handleSearchError(error)
      });
  }

  private handleSearchResponse(response: any): void {
    const searchResults = response.data.filter((doc: Document) => 
      doc.category === this.categoriaActual
    );
    
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

  onNivelChange(): void {
    const categoria = this.categoriaActual === 'KITS' ? this.selectedServicio : this.categoriaActual;
    this.updateMaterias(this.selectedNivel, categoria);
    this.resetSelections();
    
    if (this.categoriaActual === 'KITS') {
      this.updateGrados(this.selectedNivel);
    }
    
    if (this.selectedServicio === 'CONCURSOS') {
      this.currentStep = 'documentos';
    }
    
    this.onFilterChange();
  }

  onMateriaChange(): void {
    this.updateGrados(this.selectedNivel, this.selectedMateria);
    this.selectedGrado = '';
    this.currentStep = 'documentos';
    this.onFilterChange();
  }

  // Method to handle level selection
  onNivelSelect(nivel: string): void {
    this.selectedNivel = nivel;
    this.comingFromFilter = false;
    
    this.updateMaterias(nivel, this.categoriaActual);
    this.updateGrados(nivel);
    this.currentStep = 'materias';

    const shouldGoDirectToDocuments = ['RECURSOS', 'ESTRATEGIAS', 'EBOOKS'].includes(this.selectedServicio);
    if (shouldGoDirectToDocuments) {
      this.currentStep = 'documentos';
      this.onFilterChange();
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
    
    this.document.filterDocuments(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleFilterResponse(response),
        error: (error) => this.handleFilterError(error)
      });
  }

  private buildFilterParams(): FilterParams {
    const params: FilterParams = {};
    
    if (this.selectedMateria) params['materia'] = this.selectedMateria;
    if (this.selectedNivel) params['nivel'] = this.selectedNivel;
    if (this.selectedGrado) params['grado'] = this.selectedGrado;

    if (this.selectedServicio) {
      params['category'] = this.selectedServicio === 'SESIONES' 
        ? 'PLANIFICACION' 
        : this.selectedServicio;
    }

    if (this.categoriaActual === 'KITS' || this.categoriaActual === 'TALLERES') {
      params['format'] = 'ZIP';
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
      if (this.categoriaActual === 'TALLERES') {
        return doc.category === this.categoriaActual;
      }
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
    this.materias = this.MATERIAS_CONFIG[categoria]?.[nivel] || [];
  }

  private updateGrados(nivel: string, materia?: string): void {
    this.grados = this.getGradosForLevel(nivel, materia);
    
    // Lógica específica para KITS
    if (this.categoriaActual === 'KITS') {
      this.applyKitsSpecificLogic(nivel, materia);
    }
  }

  private getGradosForLevel(nivel: string, materia?: string): string[] {
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
  }

  private updateFiltersForCurrentCategory(): void {
    this.updateNiveles();
    this.updateMaterias(this.selectedNivel, this.categoriaActual);
    this.updateGrados(this.selectedNivel);
  }

  private reloadDocuments(): void {
    const params: FilterParams = this.categoriaActual === 'KITS' 
      ? { category: 'PLANIFICACION', format: 'ZIP' }
      : { category: this.categoriaActual };
      
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
    return this.categoriaActual === 'PLANIFICACION' ? 'SESIONES' : this.categoriaActual;
  }

  formatMateriaName(materia: string): string {
    return materia.replace(/_/g, ' ');
  }

  get areDropdownFiltersSelected(): boolean {
    return this.selectedServicio === 'RECURSOS' 
      ? !!this.selectedNivel 
      : !!(this.selectedMateria && this.selectedGrado);
  }

  getDescription(area: string): string {
    const areaData = this.areasData.find(data => 
      data.area === area && data.nivel === this.selectedNivel
    );
    
    return areaData 
      ? `${areaData.icono} ${areaData.justificacion}`
      : 'Descripción no disponible.';
  }
}