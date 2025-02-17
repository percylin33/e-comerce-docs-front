import { Component, OnInit, ViewChild } from '@angular/core';
import { DocumentsService } from '../../@core/backend/services/documents.service';
import { Document, DocumentData, DocumentTable } from '../../@core/interfaces/documents';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormDeleteFisicoComponent } from '../dashboard-document/form-delete-fisico/form-delete-fisico.component';
import { forkJoin } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'ngx-app-trash',
  templateUrl: './trash.component.html',
  styleUrls: ['./trash.component.scss']
})
export class TrashComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  trashedDocuments: any[] = [];
  documentsList: any[] = [];
  documentTable: DocumentTable[] = [];
  padre: string = "users-management";
  dataSource: MatTableDataSource<Document> = new MatTableDataSource<Document>();
  documentSelection: { id: number; checked: boolean }[] = [];
  enableDelete: boolean = false;
  countDelete: number = 0;
  ready: boolean = false;
  totalItems: number = 0; // Total de elementos disponibles

  // Variables para almacenar el estado de la paginación
  currentPage: number = 1;
  pageSize: number = 6;

  constructor(private documents: DocumentData,
              private dialogService: MatDialog,
              private snackBar: MatSnackBar ) {}

  structTable = [
    { column: 'title', title: 'Title' },
    { column: 'format', title: 'Format' },
    { column: 'price', title: 'Price' },
    { column: 'category', title: 'Category' },
    { column: 'numeroDePaginas', title: 'Pag' },
    { column: 'id', title: '' }
  ];

  ngOnInit(): void {
   this.onGetDocuments(this.currentPage, this.pageSize);

  }

  onGetDocuments(pagina: number, cantElementos: number) {
    this.ready = false;
    this.documents.getDocumentBorradoLogico(pagina, cantElementos).subscribe(
      (response) => {
        this.ready = true;
        this.documentsList = response.data;
        this.totalItems = response.pagination.cantidadDeDocumentos; // Actualizar el total de elementos disponibles
        this.dataSource.data = this.documentsList; // Actualizar la fuente de datos de la tabla
        this.paginator.length = this.totalItems; // Asegurarse de que el paginator se actualice correctamente
        this.paginator.pageIndex = response.pagination.paginaActual - 1; // Asegurarse de que el paginator muestre la página correcta

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

  onPageChange(event: any) {
    this.currentPage = event.pageIndex + 1; // Actualizar la página actual
    this.pageSize = event.pageSize; // Actualizar el tamaño de página
    this.onGetDocuments(this.currentPage, this.pageSize); // Llamar a onGetDocuments con los parámetros correctos
  }

  onCheckboxChangeInChild(event: { id: number; checked: boolean }) {
    const item = this.documentSelection.find(doc => doc.id === event.id);
    if (item) {
      item.checked = event.checked;
      if (event.checked === true) this.countDelete++;
      else this.countDelete--;
    }
    this.enableDelete = this.countDelete > 0;
  }

  onDeleteFisicoClick() {
    const selectedIds = this.documentSelection
      .filter(doc => doc.checked === true)
      .map(doc => doc.id);

    this.dialogService.open(FormDeleteFisicoComponent, {
          width: '40%',
          height: '40%',
          data: { selectedIds },
        }).afterClosed().subscribe(() => { this.onGetDocuments(this.currentPage, this.pageSize); }); // Usar las variables de clase para mantener el estado de la paginación
        this.enableDelete = false;
        this.countDelete = 0;
  }

  restaurarDocumento(){
    const selectedIds = this.documentSelection
      .filter(doc => doc.checked === true)
      .map(doc => doc.id);

      const restoreRequests = selectedIds.map(id => this.documents.delete(id));

      forkJoin(restoreRequests).subscribe((responses) => {
        const allSuccessful = responses.every(response => response.status === 200);
        if (allSuccessful) {
          this.onGetDocuments(this.currentPage, this.pageSize);
          this.snackBar.open('Todos los documentos han sido restaurados exitosamente.', 'Cerrar', {
            duration: 3000,
          });
        } else {
          this.snackBar.open('Algunos documentos no pudieron ser restaurados.', 'Cerrar', {
            duration: 3000,
          });
        }
      });
      this.documentSelection = [];
      this.enableDelete = false;
  }
}
