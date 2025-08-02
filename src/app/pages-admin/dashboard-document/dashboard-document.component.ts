import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Router } from '@angular/router';
import { Document, DocumentData } from '../../@core/interfaces/documents';
import { on } from 'events';
import { MatDialog } from '@angular/material/dialog';
import { FormularioDocumentosComponent } from '../formulario-documentos/formulario-documentos.component';
import { FormDeleteDocumentsComponent } from './form-delete-documents/form-delete-documents.component';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { GraphicsData } from '../../@core/interfaces/graphics';
import { NbSidebarService } from '@nebular/theme';
import { MembresiaService } from '../../@core/backend/services/membresia.service';
import { Materias, Opciones } from '../../@core/interfaces/membresia';

@Component({
  selector: 'ngx-dashboard-document',
  templateUrl: './dashboard-document.component.html',
  styleUrls: ['./dashboard-document.component.scss']
})
export class DashboardDocumentComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  documentsList: Document[] = [];
  dataSource: MatTableDataSource<Document> = new MatTableDataSource<Document>();
  padre: string = "dashboard-document";
  documentSelection: { id: number; checked: boolean }[] = [];
  enableDelete: boolean = false;
  countDelete: number = 0;
  ready: boolean = false;
  totalItems: number = 0; // Total de elementos disponibles

  // Variables para almacenar el estado de la paginación
  currentPage: number = 1;
  pageSize: number = 6;

  structTable = [
    { column: 'title', title: 'Title' },
    { column: 'format', title: 'Format' },
    { column: 'price', title: 'Price' },
    { column: 'category', title: 'Category' },
    { column: 'numeroDePaginas', title: 'Pag' },
    { column: 'id', title: '' }
  ];

  suggestions: string[] = [];
  private destroy$ = new Subject<void>();
  private searchSubject: Subject<string> = new Subject();
  chartSidebarState: string = 'collapsed';
  documentChartData: number[] = [];
  documentChartLabels: string[] = [];

  // Variables para el sistema de filtros
  showFilters: boolean = false;
  selectedFilters: any = {
    category: '',
    format: '',
    nivel: '',
    materia: '',
    documentoLibre: '',
    suscripcion: '',
    tipoSuscripcion: '',
    materiaSuscripcion: '',
    opcionSuscripcion: ''
  };

  // Arrays con opciones disponibles para los filtros
  availableCategories: string[] = ['PLANIFICACION', 'EBOOKS', 'CONCURSOS', 'RECURSOS'];
  availableFormats: string[] = ['PDF', 'DOCX', 'ZIP'];
  availableNiveles: string[] = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
  availableMaterias: string[] = [
    'MATEMATICA', 'COMUNICACION', 'CIENCIA_Y_TECNOLOGIA', 'PERSONAL_SOCIAL',
    'ARTE_Y_CULTURA', 'EDUCACION_FISICA', 'EDUCACION_RELIGIOSA', 'INGLES'
  ];

  // Arrays para filtros de suscripción
  availableTiposSuscripcion  = [
    { id: 1, nombre: 'Membresia Mensual Inicial' },
    { id: 2, nombre: 'Membresia Mensual Primaria' },
    { id: 3, nombre: 'Membresia Mensual Secundaria' },
    { id: 4, nombre: 'Membresia Anual Secundaria' }
  ];
  availableMateriasSubscription: Materias[] = [];
  availableOpcionesSubscription: Opciones[] = [];
  
  // Datos auxiliares para filtros dinámicos
  allMateriasData: Materias[] = [];

  private filtersSubject: Subject<any> = new Subject();
  private isFilteringActive: boolean = false;

  constructor(
    private router: Router,
    private documents: DocumentData,
    private dialogService: MatDialog,
    private graphicsService: GraphicsData,
    private sidebarService: NbSidebarService,
    private membresiaService: MembresiaService
  ) {}

  ngOnInit(): void {
    this.onGetDocuments(this.currentPage, this.pageSize);
    this.loadMateriasOpciones(); // Cargar datos de suscripción dinámicamente

    this.searchSubject.pipe(
      debounceTime(500), // Espera 500ms
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });

    // Configurar filtros con debounce
    this.filtersSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.performFiltering();
    });

    // Obtener datos para el gráfico
    this.graphicsService.getGraphics().subscribe((response) => {
      this.documentChartData = response.data.dataDocument.map(item => item.salesCount);
      this.documentChartLabels = response.data.dataDocument.map(item => item.title);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const sidebar = document.querySelector('.chart-sidebar');
    const button = document.querySelector('.chart-toggle-btn');

    if (sidebar && button &&
        !sidebar.contains(event.target as Node) &&
        !button.contains(event.target as Node)) {
      this.closeSidebar();
    }
  }

  toggleChartSidebar() {
    this.chartSidebarState = this.chartSidebarState === 'expanded' ? 'collapsed' : 'expanded';
    this.sidebarService.toggle(true, 'chart-sidebar');

    if (this.chartSidebarState === 'expanded') {
      document.body.classList.add('sidebar-overlay');
    } else {
      document.body.classList.remove('sidebar-overlay');
    }
  }

  closeSidebar() {
    this.chartSidebarState = 'collapsed';
    this.sidebarService.collapse('chart-sidebar');
    document.body.classList.remove('sidebar-overlay');
  }

  onGetDocuments(pagina: number, cantElementos: number) {
    this.ready = false;
    this.documents.getDocuments(pagina, cantElementos).subscribe(
      (response) => {
        this.ready = true;
        this.documentsList = response.data;
        this.totalItems = response.pagination.cantidadDeDocumentos;
        this.dataSource.data = this.documentsList; // Actualizar la fuente de datos de la tabla
        this.paginator.length = this.totalItems; // Asegurarse de que el paginator se actualice correctamente
        this.paginator.pageIndex = response.pagination.paginaActual - 1;

        this.documentSelection = this.documentsList.map(doc => ({
          id: doc.id,
          checked: false
        }));
      },
      (error) => {
        console.error('Error al obtener los documentos', error);
      }
    );
  }

  onSearchInput(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.performSearch((event.target as HTMLInputElement).value);
    }
  }

  performSearch(searchTerm: string): void {
    if (searchTerm.trim() === '') {
      this.onGetDocuments(this.currentPage, this.pageSize);
      return;
    }
  
    this.documents.searchDocuments('title', searchTerm).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.documentsList = response.data;
        this.totalItems = response.pagination.cantidadDeDocumentos;
        this.dataSource.data = this.documentsList;
        this.paginator.length = this.totalItems;
        this.paginator.pageIndex = 0;
  
        // Actualizar la selección de documentos
        this.documentSelection = this.documentsList.map(doc => ({
          id: doc.id,
          checked: false
        }));
  
        // Reiniciar el estado del botón de borrar
        this.enableDelete = false;
        this.countDelete = 0;
      },
      error: (error) => {
        console.error('Error al buscar documentos:', error);
      }
    });
  }

  // Override del método de paginación para manejar filtros
  onPageChange(event: any) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    
    if (this.isFilteringActive) {
      this.performFiltering();
    } else {
      this.onGetDocuments(this.currentPage, this.pageSize);
    }
  }

  onCheckboxChangeInChild(event: { id: number; checked: boolean }) {
    const item = this.documentSelection.find(doc => doc.id === event.id);
    if (item) {
      item.checked = event.checked;
      if (event.checked === true) {
        this.countDelete++;
      } else {
        this.countDelete--;
      }
    }
    this.enableDelete = this.countDelete > 0;
  }

  onEditClickInChild(event: string) {
    this.navigateToFormulario('edit', event);
  }

  onDeleteClick() {
    const selectedIds = this.documentSelection
      .filter(doc => doc.checked === true)
      .map(doc => doc.id);

    this.dialogService.open(FormDeleteDocumentsComponent, {
      width: '40%',
      height: '40%',
      data: { selectedIds },
    }).afterClosed().subscribe(() => { this.onGetDocuments(this.currentPage, this.pageSize); }); // Usar las variables de clase para mantener el estado de la paginación
    this.enableDelete = false;
    this.countDelete = 0;
  }

  navigateToFormulario(mode: string, id?: string) {
    this.dialogService.open(FormularioDocumentosComponent, {
      width: '90%',
      height: '80%',
      position: { top: '85px' },
      data: {
        mode: mode,
        id: id
      }
    }).afterClosed().subscribe(() => { this.onGetDocuments(this.currentPage, this.pageSize); }); // Usar las variables de clase para mantener el estado de la paginación
  }

  // Métodos para el sistema de filtros
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  applyFilters(): void {
    this.filtersSubject.next(this.selectedFilters);
  }

  onSuscripcionChange(value: boolean | string): void {
    this.selectedFilters.suscripcion = value;
    
    // Si se deselecciona suscripción, limpiar filtros relacionados
    if (value !== true) {
      this.selectedFilters.tipoSuscripcion = '';
      this.selectedFilters.materiaSuscripcion = '';
      this.selectedFilters.opcionSuscripcion = '';
      
      // Limpiar arrays de opciones
      this.availableMateriasSubscription = [];
      this.availableOpcionesSubscription = [];
      this.allMateriasData = [];
    }
    
    this.applyFilters();
  }

  performFiltering(): void {
    this.ready = false;
    this.isFilteringActive = true;
    
    // Construir parámetros de filtros
    const filterParams: Record<string, string> = {};
    
    if (this.selectedFilters.category) {
      filterParams['category'] = this.selectedFilters.category;
    }
    if (this.selectedFilters.format) {
      filterParams['format'] = this.selectedFilters.format;
    }
    if (this.selectedFilters.nivel) {
      filterParams['nivel'] = this.selectedFilters.nivel;
    }
    if (this.selectedFilters.materia) {
      filterParams['materia'] = this.selectedFilters.materia;
    }
    if (this.selectedFilters.documentoLibre !== '') {
      filterParams['documentoLibre'] = this.selectedFilters.documentoLibre.toString();
    }
    if (this.selectedFilters.suscripcion !== '') {
      filterParams['suscripcion'] = this.selectedFilters.suscripcion.toString();
    }
    if (this.selectedFilters.tipoSuscripcion) {
      filterParams['tipoSuscripcion'] = this.selectedFilters.tipoSuscripcion;
    }
    if (this.selectedFilters.materiaSuscripcion) {
      filterParams['materiaSuscripcion'] = this.selectedFilters.materiaSuscripcion;
    }
    if (this.selectedFilters.opcionSuscripcion) {
      filterParams['opcionSuscripcion'] = this.selectedFilters.opcionSuscripcion;
    }

    // Si no hay filtros activos, obtener todos los documentos
    if (Object.keys(filterParams).length === 0) {
      this.isFilteringActive = false;
      this.onGetDocuments(this.currentPage, this.pageSize);
      return;
    }

    // Aplicar filtros
    this.documents.filterDocuments(filterParams, this.currentPage, this.pageSize).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.ready = true;
        this.documentsList = response.data;
        this.totalItems = response.pagination?.cantidadDeDocumentos || response.data.length;
        this.dataSource.data = this.documentsList;
        this.paginator.length = this.totalItems;
        this.paginator.pageIndex = response.pagination?.paginaActual ? response.pagination.paginaActual - 1 : 0;

        // Actualizar la selección de documentos
        this.documentSelection = this.documentsList.map(doc => ({
          id: doc.id,
          checked: false
        }));

        // Reiniciar el estado del botón de borrar
        this.enableDelete = false;
        this.countDelete = 0;
      },
      error: (error) => {
        this.ready = true;
        console.error('Error al filtrar documentos:', error);
      }
    });
  }

  clearFilters(): void {
    this.selectedFilters = {
      category: '',
      format: '',
      nivel: '',
      materia: '',
      documentoLibre: '',
      suscripcion: '',
      tipoSuscripcion: '',
      materiaSuscripcion: '',
      opcionSuscripcion: ''
    };
    this.isFilteringActive = false;
    this.onGetDocuments(this.currentPage, this.pageSize);
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedFilters.category) count++;
    if (this.selectedFilters.format) count++;
    if (this.selectedFilters.nivel) count++;
    if (this.selectedFilters.materia) count++;
    if (this.selectedFilters.documentoLibre !== '') count++;
    if (this.selectedFilters.suscripcion !== '') count++;
    if (this.selectedFilters.tipoSuscripcion) count++;
    if (this.selectedFilters.materiaSuscripcion) count++;
    if (this.selectedFilters.opcionSuscripcion) count++;
    return count;
  }

  // Cargar materias y opciones dinámicamente para los filtros de suscripción
  loadMateriasOpciones(): void {
    // Inicialmente, los selects de materia y opciones están vacíos
    // Se llenarán cuando se seleccione un tipo de suscripción
    this.availableMateriasSubscription = [];
    this.availableOpcionesSubscription = [];
    this.allMateriasData = [];
  }

  // Cargar materias y opciones cuando se selecciona un tipo de suscripción
  onTipoSuscripcionChange(): void {
    const tipoSuscripcionId = this.selectedFilters.tipoSuscripcion;
    
    if (!tipoSuscripcionId) {
      // Si no hay tipo de suscripción seleccionado, limpiar todo
      this.availableMateriasSubscription = [];
      this.availableOpcionesSubscription = [];
      this.allMateriasData = [];
      this.selectedFilters.materiaSuscripcion = '';
      this.selectedFilters.opcionSuscripcion = '';
      this.applyFilters();
      return;
    }

    // Cargar materias y opciones para el tipo de suscripción seleccionado
    this.membresiaService.getMateriasOpciones(tipoSuscripcionId).subscribe({
      next: (response) => {
        if (response.result && response.data && response.data.length > 0) {
          this.allMateriasData = response.data;
          this.availableMateriasSubscription = response.data;
          
          // Recopilar todas las opciones únicas
          const allOpciones: Opciones[] = [];
          this.allMateriasData.forEach(materia => {
            materia.opciones.forEach(opcion => {
              const existing = allOpciones.find(o => o.nombre === opcion.nombre);
              if (!existing) {
                allOpciones.push(opcion);
              }
            });
          });
          this.availableOpcionesSubscription = allOpciones;
          
          console.log('Materias cargadas para tipo de suscripción:', this.availableMateriasSubscription);
          console.log('Opciones cargadas para tipo de suscripción:', this.availableOpcionesSubscription);
        } else {
          this.availableMateriasSubscription = [];
          this.availableOpcionesSubscription = [];
          this.allMateriasData = [];
        }
        
        // Limpiar selecciones anteriores
        this.selectedFilters.materiaSuscripcion = '';
        this.selectedFilters.opcionSuscripcion = '';
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error al cargar materias y opciones:', error);
        this.availableMateriasSubscription = [];
        this.availableOpcionesSubscription = [];
        this.allMateriasData = [];
        this.selectedFilters.materiaSuscripcion = '';
        this.selectedFilters.opcionSuscripcion = '';
      }
    });
  }

  // Actualizar opciones basado en la materia seleccionada
  onMateriaSuscripcionChange(): void {
    const materiaSeleccionada = this.allMateriasData.find(
      materia => materia.id.toString() === this.selectedFilters.materiaSuscripcion
    );

    if (materiaSeleccionada) {
      this.availableOpcionesSubscription = materiaSeleccionada.opciones;
    } else {
      // Si no hay materia seleccionada, mostrar todas las opciones
      const allOpciones: Opciones[] = [];
      this.allMateriasData.forEach(materia => {
        materia.opciones.forEach(opcion => {
          const existing = allOpciones.find(o => o.nombre === opcion.nombre);
          if (!existing) {
            allOpciones.push(opcion);
          }
        });
      });
      this.availableOpcionesSubscription = allOpciones;
    }

    // Limpiar la selección de opción si no está disponible
    const currentOpcion = this.selectedFilters.opcionSuscripcion;
    if (currentOpcion && !this.availableOpcionesSubscription.find(o => o.nombre === currentOpcion)) {
      this.selectedFilters.opcionSuscripcion = '';
    }

    // Aplicar filtros si hay cambios
    this.filtersSubject.next(this.selectedFilters);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
