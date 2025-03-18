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
  selectedServicio: string = 'SESIONES';

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
        this.selectedServicio = queryParams['servicio'] || (this.categoriaActual === 'KITS' ? 'PLANIFICACION' : '');
        this.cargarDocumentos(queryParams);
        console.log('Documentos cargados:', this.ducumentList);
    console.log('Categoría actual:', this.categoriaActual);
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
      this.document.searchDocuments('format', 'zip').pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {

          this.ducumentList = response.data.filter((doc: Document) => {
            return doc.category === this.selectedServicio
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
        },
        error: (error) => {
          console.error('Error al cargar documentos:', error);
        }
      });
    } else {
      this.document.filterDocuments(params).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          this.ducumentList = response.data.map((doc: Document) => {
            if (doc.format === 'ZIP') {
              const urls = doc.imagenUrlPublic.split('|');
              if (urls.length > 0) {
                doc.imagenUrlPublic = urls[0];
              }
            }
            return doc;
          });
          this.originalDocuments = [...response.data];
          this.updateMaterias(this.selectedNivel, this.categoriaActual);
          this.updateGrados(this.selectedNivel, this.selectedMateria);
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
    this.onFilterChange();
  }

  onMateriaChange(): void {
    this.updateGrados(this.selectedNivel, this.selectedMateria);
    this.selectedGrado = '';
    this.onFilterChange();
  }

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
        } else {

          const filtero = response.data.filter((doc: Document) => doc.category === this.categoriaActual);

          this.ducumentList = filtero.map((doc: Document) => {

            if (doc.format === 'ZIP') {
              const urls = doc.imagenUrlPublic.split('|');
              if (urls.length > 0) {
                doc.imagenUrlPublic = urls[0];
              }
            }
            return doc;
          });
          // console.log(this.selectedServicio + "aqss");
          // const filter = response.data.filter((doc: Document) => doc.category === this.categoriaActual);
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
}