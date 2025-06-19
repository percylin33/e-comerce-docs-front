import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DocumentData, Document } from '../../@core/interfaces/documents';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SearchComponent } from '../../shared/component/search/search.component';
import { debounce } from 'lodash';

@Component({
  selector: 'ngx-categorias',
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.scss']
})
export class CategoriasComponent implements OnInit, OnDestroy {
  @ViewChild(SearchComponent) searchComponent: SearchComponent; // Referencia al componente de búsqueda

  categoriaActual: string = '';
  private routeSubscription: Subscription;
  private destroy$ = new Subject<void>();

  ducumentList: Document[] = [];
  originalDocuments: Document[] = [];

  niveles: string[] = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
  materias: string[] = [];
  grados: string[] = [];
  servicios: string[] = ['PLANIFICACION', 'EVALUACION', 'ESTRATEGIAS', 'RECURSOS', 'CONCURSOS', 'EBOOKS', 'TALLERES'];
  selectedMateria: string = '';
  selectedNivel: string = '';
  selectedGrado: string = '';
  selectedServicio: string = '';

  // New state variables for the three-step filtering process
  currentStep: 'niveles' | 'materias' | 'documentos' = 'niveles';

  // Flag to track if a search has been performed
  hasSearched: boolean = false;

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
    this.cargarDocumentos = debounce(this.cargarDocumentos.bind(this), 300);
  }

  ngOnInit(): void {

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.categoriaActual = params.get('service') || '';
      this.route.queryParams.subscribe(queryParams => {
        this.selectedNivel = queryParams['nivel'] || '';
        this.selectedMateria = queryParams['materia'] || '';
        this.selectedGrado = queryParams['grado'] || '';
        this.selectedServicio = queryParams['servicio'] || (this.categoriaActual === 'KITS' ? 'PLANIFICACION' : this.categoriaActual);
       
        if (this.categoriaActual === 'KITS' || this.categoriaActual === 'TALLERES') {
          this.currentStep = 'documentos';
          const updatedParams = {
            ...queryParams, category: this.categoriaActual === 'KITS' ? 'PLANIFICACION' : this.categoriaActual,
            format: 'ZIP'
          };


          // Llamar a cargarDocumentos con los parámetros actualizados
          this.cargarDocumentos(updatedParams);
        }


        

        if (this.categoriaActual === 'KITS') {
          this.currentStep = 'documentos'; // Muestra directamente los documentos para KITS
          this.selectedServicio = 'PLANIFICACION'; // Establece el servicio por defecto para KITS
          this.cargarDocumentos({ category: this.selectedServicio , format: "ZIP"}); // Car
        } else {
          this.currentStep = 'niveles';
          this.cargarDocumentos({ category: this.categoriaActual });

        }
        const nuevaCategoria = params.get('service') || '';
        if (nuevaCategoria !== this.categoriaActual) {
          this.categoriaActual = nuevaCategoria;
          this.resetFilters(); // Reinicia los filtros al cambiar de categoría
          // Muestra las cartas de niveles al cambiar de categoría
         

          if (this.categoriaActual === 'KITS') {
            this.currentStep = 'documentos'; // Muestra directamente los documentos para KITS
            this.selectedServicio = 'PLANIFICACION'; // Establece el servicio por defecto para KITS
            this.cargarDocumentos({ category: this.selectedServicio }); // Car
          } else {
            this.currentStep = 'niveles';
            this.cargarDocumentos({ category: this.categoriaActual });
          }
        }
        this.updateNiveles();
        this.updateMaterias(this.selectedNivel, this.categoriaActual);
        this.updateGrados(this.selectedNivel, this.selectedMateria);
      });
    });
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
      this.niveles = ['PRIMARIA', 'SECUNDARIA'];
    } else {
      this.niveles = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
    }
  }

  cargarDocumentos(params: Record<string, string>): void {

    if (this.categoriaActual === 'KITS') {
      this.document.filterDocuments(params).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
         

          this.ducumentList = response.data.filter((doc: Document) => {
            if (this.selectedServicio === 'KITS') {
              return doc.category === 'PLANIFICACION';
            } else {
              return doc.category === this.selectedServicio
            }
          }).map((doc: Document) => {
            const urls = doc.imagenUrlPublic.split('|');
            if (urls.length > 0) {
              doc.imagenUrlPublic = urls[0];
            }
            return doc;
          });
          this.originalDocuments = [...response.data];
          this.updateMaterias(this.selectedNivel, this.categoriaActual);
          this.updateGrados(this.selectedNivel, this.selectedMateria);
          
          if (this.ducumentList.length === 0) {
            this.hasSearched = true;

          } else {
            this.hasSearched = false; // Reset the search flag if documents are found
          }
        },
        error: (error) => {
          console.error('Error al cargar documentos:', error);
        }
      });
    } else {
      this.document.filterDocuments(params).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.ducumentList = response.data.filter((doc: Document) => {
            if (this.categoriaActual === 'TALLERES') {
              return doc.category === this.categoriaActual;
            }
            return doc.format !== 'ZIP'
          }).map((doc: Document) => {
            const urls = doc.imagenUrlPublic.split('|');
            if (urls.length > 0) {
              doc.imagenUrlPublic = urls[0];
            }
            return doc;
          });
          this.originalDocuments = [...response.data];
          this.updateMaterias(this.selectedNivel, this.categoriaActual);
          this.updateGrados(this.selectedNivel, this.selectedMateria);
          if (this.ducumentList.length === 0) {
            this.hasSearched = true;

          } else {
            this.hasSearched = false; // Reset the search flag if documents are found
          }
        },
        error: (err) => {
          console.error('Error al buscar documentos:', err);
        },
      });
    }
  }

  onServicioChange(): void {
    this.onFilterChange();
  }

  processSearch(event: string): void {
    //  this.hasSearched = true; // Mark that a search has been performed
    if (event.trim() === '') {
      this.ducumentList = [...this.originalDocuments];
      this.searchComponent.updateSuggestions([]);
      return;
    }

    this.document.searchDocuments('title', event).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        const searchResults = response.data.filter((doc: Document) => doc.category === this.categoriaActual);
        this.ducumentList = searchResults.map((doc: Document) => {
          if (doc.format === 'ZIP') {
            const urls = doc.imagenUrlPublic.split('|');
            if (urls.length > 0) {
              doc.imagenUrlPublic = urls[0];
            }
          }
          return doc;
        });
        const suggestions = searchResults.map((doc: Document) => doc.title);
        this.searchComponent.updateSuggestions(suggestions);
        if (this.ducumentList.length === 0) {
          this.hasSearched = true;

        } else {
          this.hasSearched = false; // Reset the search flag if documents are found
        }
      },
      error: (error) => {
        console.error('Error al cargar documentos:', error);
      }
    });
  }

  onNivelChange(): void {
    if (this.categoriaActual === 'KITS') {
      this.updateMaterias(this.selectedNivel, this.selectedServicio);
    } else {
      this.updateMaterias(this.selectedNivel, this.categoriaActual);
    }
    this.resetSelections();
    if (this.selectedServicio === 'CONCURSOS') {
      this.currentStep = 'documentos';
    }



    this.onFilterChange();

  }

  onMateriaChange(): void {
    this.updateGrados(this.selectedNivel, this.selectedMateria);
    this.selectedGrado = '';
    this.onFilterChange();
    this.currentStep = 'documentos';
  }

  // Method to handle level selection
  onNivelSelect(nivel: string): void {
    this.selectedNivel = nivel;

    this.updateMaterias(nivel, this.categoriaActual);
    this.updateGrados(nivel); // Ensure grades are updated when a level is selected
    this.currentStep = 'materias';


    if (this.selectedServicio === 'RECURSOS' || this.selectedServicio === 'ESTRATEGIAS' || this.selectedServicio === 'EBOOKS') {
      this.onFilterChange();
      this.currentStep = 'documentos';
    }


  }

  // Method to handle subject selection
  onMateriaSelect(materia: string): void {
    this.selectedMateria = materia;
    this.updateGrados(this.selectedNivel, materia); // Ensure grades are updated when a subject is selected
    this.onFilterChange();
    this.currentStep = 'documentos';
  }

  // Adjusted onFilterChange to ensure it works with the new flow
  onFilterChange(): void {

    const params: Record<string, string> = {};
    if (this.selectedMateria) params['materia'] = this.selectedMateria;
    if (this.selectedNivel) params['nivel'] = this.selectedNivel;
    if (this.selectedGrado) params['grado'] = this.selectedGrado;

    if (this.selectedServicio) {

      if (this.selectedServicio === 'SESIONES') {
        params['category'] = 'PLANIFICACION';
      } else {

        params['category'] = this.selectedServicio;
      }
    }

    if (this.categoriaActual === 'KITS' || this.categoriaActual === 'TALLERES') {
      params['format'] = 'ZIP'; // Add format filter if needed

    }

    this.document.filterDocuments(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {

        if (this.categoriaActual === 'KITS') {

          if (this.selectedServicio === 'SESIONES') {
            const act = 'PLANIFICACION';
            this.selectedServicio = act
          }

          const filter = response.data.filter((doc: Document) => doc.category === this.selectedServicio && doc.format === 'ZIP');

          this.ducumentList = filter.map((doc: Document) => {
            /* if (this.categoriaActual === 'KITS') {
               console.log(doc.category + "aqui");
               console.log(this.selectedServicio + "aqss");
               doc.category === this.selectedServicio;
               
             }*/

            if (doc.format === 'ZIP') {
              const urls = doc.imagenUrlPublic.split('|');
              if (urls.length > 0) {
                doc.imagenUrlPublic = urls[0];
              }
            }
            return doc;
          });
          if (this.ducumentList.length === 0) {
            this.hasSearched = true;

          } else {
            this.hasSearched = false; // Reset the search flag if documents are found
          }
        } else {

          const filtero = response.data.filter((doc: Document) => doc.category === this.categoriaActual);

          this.ducumentList = filtero.filter((doc: Document) => {

            if (this.categoriaActual === 'TALLERES') {
              return doc.category === this.categoriaActual;
            }
            return doc.format !== 'ZIP';
          })
            .map((doc: Document) => {
              return doc
            });
          // console.log(this.selectedServicio + "aqss");
          // const filter = response.data.filter((doc: Document) => doc.category === this.categoriaActual);
          if (this.ducumentList.length === 0) {
            this.hasSearched = true;

          } else {
            this.hasSearched = false; // Reset the search flag if documents are found
          }
        }
        //const filter = response.data.filter((doc: Document) => doc.category === this.categoriaActual);

      },
      error: (err) => {
        console.error('Error al filtrar documentos:', err);
      },
    });
  }

  private updateMaterias(nivel: string, categoria: string): void {
    const materiasPorCategoria: Record<string, Record<string, string[]>> = {
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
    };
    this.materias = materiasPorCategoria[categoria]?.[nivel] || [];
  }

  private updateGrados(nivel: string, materia?: string): void {
    const gradosPorNivel: Record<string, string[]> = {
      'INICIAL': ['3 años', '4 años', '5 años'],
      'PRIMARIA': ['III CICLO 1°-2°', 'IV CICLO 3°-4°', 'V CICLO 5°-6°'],
      'SECUNDARIA': materia && ['ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT', 'TUTORIA'].includes(materia)
        ? ['1°-2°', '3°-4°', '5°']
        : ['1°', '2°', '3°', '4°', '5°']
    };

    this.grados = gradosPorNivel[nivel] || [];
  }

  private resetSelections(): void {
    this.selectedMateria = '';
    this.selectedGrado = '';
    this.grados = [];
  }

  resetFilters(): void {
    this.selectedNivel = '';
    this.selectedMateria = '';
    this.selectedGrado = '';
    this.selectedServicio = this.categoriaActual;
    this.ducumentList = [...this.originalDocuments];
    this.updateNiveles();
    this.updateMaterias(this.selectedNivel, this.categoriaActual);
    this.updateGrados(this.selectedNivel);
    let params: Record<string, string>;
    if (this.categoriaActual === 'KITS') {
      params = { category: 'PLANIFICACION', format: 'ZIP' };
    } else {
      params = { category: this.categoriaActual };
    }
    this.cargarDocumentos(params);
  }

  getColClass(index: number): string {
    const totalItems = this.ducumentList.length;
    if (totalItems < 5) {
      return 'col-lg-' + (12 / totalItems);
    } else {
      return 'col-xl-2 col-lg-3 col-md-4 col-sm-6 col-12';
    }
  }

  get displayCategoria(): string {
    return this.categoriaActual === 'PLANIFICACION' ? 'SESIONES' : this.categoriaActual;
  }

  formatMateriaName(materia: string): string {
    return materia.replace(/_/g, ' ');
  }

  get areDropdownFiltersSelected(): boolean {

    if (this.selectedServicio === 'RECURSOS') {

      return !!this.selectedNivel; // Only Nivel is required for CONCURSOS

    } else {
      // For other categories, both Materia and Grado are required
      return !!this.selectedMateria && !!this.selectedGrado;
    }
  }

  getDescription(area: string): string {
    const areaData = this.areasData.find(data => data.area === area && data.nivel === this.selectedNivel);
    if (areaData) {
      return `${areaData.icono} ${areaData.justificacion}`;
    } else {
      return 'Descripción no disponible.';
    }
  }
}