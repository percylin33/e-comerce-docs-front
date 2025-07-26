import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
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

@Component({
  selector: 'ngx-dashboard-document',
  templateUrl: './dashboard-document.component.html',
  styleUrls: ['./dashboard-document.component.scss']
})
export class DashboardDocumentComponent implements OnInit{
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

  constructor(
    private router: Router,
    private documents: DocumentData,
    private dialogService: MatDialog,
    private graphicsService: GraphicsData,
    private sidebarService: NbSidebarService
  ) {}

  ngOnInit(): void {
    this.onGetDocuments(this.currentPage, this.pageSize);

    this.searchSubject.pipe(
      debounceTime(500), // Espera 300ms
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
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

  onPageChange(event: any) {
    this.currentPage = event.pageIndex + 1; // Actualizar la página actual
    this.pageSize = event.pageSize; // Actualizar el tamaño de página
    this.onGetDocuments(this.currentPage, this.pageSize); // Llamar a onGetDocuments con los parámetros correctos
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
}
