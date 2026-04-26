import { Component, Input, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Opcion, OpcionData } from '../../../@core/data/materia';
import { OpcionFormDialogComponent } from '../opcion-form-dialog/opcion-form-dialog.component';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatChip } from '@angular/material/chips';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass, DecimalPipe } from '@angular/common';

@Component({
    selector: 'ngx-opciones-manager',
    templateUrl: './opciones-manager.component.html',
    styleUrls: ['./opciones-manager.component.scss'],
    standalone: true,
    imports: [MatSlideToggle, FormsModule, MatButton, MatIcon, MatCard, MatCardContent, MatProgressSpinner, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatChip, MatIconButton, MatTooltip, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, NgClass, DecimalPipe]
})
export class OpcionesManagerComponent implements OnInit {
  private opcionService = inject(OpcionData);
  private dialog = inject(MatDialog);

  @Input() materiaId: number;
  @Input() materiaName: string;
  @Input() materiaActiva: boolean;
  @Input() canDeletePermanently: boolean = false;

  // Eliminado: opciones ya no se pasan desde el padre, siempre se cargan por API

  allOpciones: Opcion[] = []; // Store all opciones for filtering
  opcionesFiltradas: Opcion[] = [];
  mostrarInactivas: boolean = false;
  isLoading: boolean = false;
  opcionesProvidedByParent: boolean = false; // Track if opciones came from parent

  displayedColumns = ['estado', 'posicion', 'nombre', 'antes', 'ahora', 'exclusivo', 'acciones'];

  ngOnInit(): void {
    // Check if opciones were provided by parent
    // Siempre cargar desde la API
    this.loadOpciones();
  }

  loadOpciones(): void {
    this.isLoading = true;
    this.opcionService.getByMateria(this.materiaId, this.mostrarInactivas)
      .subscribe({
        next: (opciones) => {
          this.allOpciones = opciones.sort((a, b) => a.posicion - b.posicion);
          this.filterOpciones();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Error cargando opciones:', err);
          this.isLoading = false;
        }
      });
  }

  filterOpciones(): void {
    // Siempre filtrar sobre allOpciones
    if (this.mostrarInactivas) {
      this.opcionesFiltradas = [...this.allOpciones];
    } else {
      this.opcionesFiltradas = this.allOpciones.filter(o => o.activo);
    }
  }

  onCreateOpcion(): void {
    const dialogRef = this.dialog.open(OpcionFormDialogComponent, {
      width: '500px',
      data: {
        materiaId: this.materiaId,
        isEdit: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOpciones();
      }
    });
  }

  onEdit(opcion: Opcion): void {
    const dialogRef = this.dialog.open(OpcionFormDialogComponent, {
      width: '500px',
      data: {
        opcion,
        materiaId: this.materiaId,
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOpciones();
      }
    });
  }

  onToggleActivo(opcion: Opcion): void {
    const accion = opcion.activo ? 'desactivar' : 'activar';

    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} esta opción?`)) {
      return;
    }

    this.opcionService.toggleActivo(opcion.id).subscribe({
      next: (updated) => {
        opcion.activo = updated.activo;
        this.filterOpciones();
      },
      error: (err) => {
        console.error(`❌ Error al ${accion}:`, err);
        alert(`Error al ${accion} la opción`);
      }
    });
  }

  onDeletePermanente(opcion: Opcion): void {
    if (!confirm(`¿ELIMINAR PERMANENTEMENTE "${opcion.nombre}"? Esta acción NO SE PUEDE DESHACER.`)) {
      return;
    }

    this.opcionService.delete(opcion.id).subscribe({
      next: () => {
        this.allOpciones = this.allOpciones.filter(o => o.id !== opcion.id);
        this.filterOpciones();
      },
      error: (err) => {
        console.error('❌ Error al eliminar:', err);
        alert('Error al eliminar la opción');
      }
    });
  }
}
