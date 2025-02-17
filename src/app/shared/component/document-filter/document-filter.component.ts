import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { DocumentData, Document } from '../../../@core/interfaces/documents';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'ngx-document-filter',
  templateUrl: './document-filter.component.html',
  styleUrls: ['./document-filter.component.scss']
})
export class DocumentFilterComponent implements OnInit, OnDestroy {
  filters = ['Categoría', 'Nivel', 'Materia', 'Grado'];

  labelMap: Record<string, string> = {
    'Categoría': 'Categoría',
    'Nivel': 'Nivel',
    'Materia': 'Área',
    'Grado': 'Grado'
  };

  menuMap = {};

  categoriaActual: string = '';
  selectedNivel: string = '';
  selectedMateria: string = '';
  selectedGrado: string = '';

  documentos: Document[] = [];
  originalDocuments: Document[] = [];

  private destroy$ = new Subject<void>();

  constructor(private document: DocumentData, private router: Router) {}

  ngOnInit(): void {
   //this.cargarDocumentos({ category: this.categoriaActual });
    if (this.categoriaActual != 'PLANIFICACION') {
      this.filters = ['Categoría', 'Nivel', 'Materia'];
    }else{
      this.filters = ['Categoría', 'Nivel', 'Materia', 'Grado'];
    }
  }

  cargarDocumentos(params: Record<string, string>): void {
    this.document.filterDocuments(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.documentos = response.data;
        this.originalDocuments = [...response.data];
      },
      error: (err) => {
        console.error('Error al buscar documentos:', err);
      },
    });
  }


  getOptions(filter: string): string[] {
    switch (filter) {
      case 'Categoría':
        return ['PLANIFICACION', 'EVALUACION', 'ESTRATEGIAS','RECURSOS', 'CONCURSOS'];
      case 'Nivel':
        if (this.categoriaActual === 'CONCURSOS') {
          return ['PRIMARIA', 'SECUNDARIA'];
        }
        return ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
      case 'Materia':
        return this.getMaterias(this.selectedNivel, this.categoriaActual);
      case 'Grado':

        return this.getGrados(this.selectedNivel, this.selectedMateria);
      default:
        return [];
    }
  }

  shouldHideFilter(filter: string): boolean {
    if (this.categoriaActual === 'RECURSOS' || this.categoriaActual === 'CONCURSOS') {
      return filter !== 'Categoría' && filter !== 'Nivel';
    }
    return false;
  }

  onFilterSelect(filter: string, option: string) {
    switch (filter) {
      case 'Categoría':
        this.categoriaActual = option;
        if (option === 'CONCURSOS') {
          this.selectedNivel = '';
          this.selectedMateria = '';
          this.selectedGrado = '';
        }
        break;
      case 'Nivel':
        this.selectedNivel = option;
        this.selectedMateria = '';
        this.selectedGrado = '';
        break;
      case 'Materia':
        this.selectedMateria = option;
        this.selectedGrado = '';
        break;
      case 'Grado':
        this.selectedGrado = option;
        break;
    }
   // this.onFilterChange();
  }

  private getMaterias(nivel: string, categoria: string): string[] {
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
      }
    };

    return materiasPorCategoria[categoria]?.[nivel] || [];
  }

  private getGrados(nivel: string, materia?: string): string[] {
    const gradosPorNivel: Record<string, string[]> = {
      'INICIAL': ['3 años', '4 años', '5 años'],
      'PRIMARIA': ['III CICLO 1°-2°', 'IV CICLO 3°-4°', 'V CICLO 5°-6°'],
      'SECUNDARIA': materia && ['ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT', 'TUTORIA'].includes(materia)
        ? ['1°-2°', '3°-4°', '5°']
        : ['1°', '2°', '3°', '4°', '5°']
    };

    return gradosPorNivel[nivel] || [];
  }

  // private onFilterChange(): void {
  //   const params: Record<string, string> = {};
  //   if (this.categoriaActual) params['category'] = this.categoriaActual;
  //   if (this.selectedNivel) params['nivel'] = this.selectedNivel;
  //   if (this.selectedMateria) params['materia'] = this.selectedMateria;
  //   if (this.selectedGrado) params['grado'] = this.selectedGrado;

  //   this.document.filterDocuments(params).pipe(takeUntil(this.destroy$)).subscribe({
  //     next: (response) => {
  //       console.log('Documentos filtrados:', response.data);
        
  //       this.documentos = response.data;
  //       this.originalDocuments = [...response.data];
  //     },
  //     error: (err) => {
  //       console.error('Error al filtrar documentos:', err);
  //     },
  //   });
  // }

  isSearchButtonDisabled(): boolean {
    return !this.categoriaActual || !this.selectedNivel;
  }

  buscarDocumentos(): void {
    const params: Record<string, string> = {};
    if (this.categoriaActual) params['category'] = this.categoriaActual;
    if (this.selectedNivel) params['nivel'] = this.selectedNivel;
    if (this.selectedMateria) params['materia'] = this.selectedMateria;
    if (this.selectedGrado) params['grado'] = this.selectedGrado;

    this.router.navigate(['/site/categorias', this.categoriaActual], { queryParams: params });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
