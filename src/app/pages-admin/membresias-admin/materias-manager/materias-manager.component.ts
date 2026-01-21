import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, AfterViewInit, AfterViewChecked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Materia, MateriaData } from '../../../@core/data/materia';
import { MateriaFormDialogComponent } from '../materia-form-dialog/materia-form-dialog.component';

@Component({
  selector: 'ngx-materias-manager',
  templateUrl: './materias-manager.component.html',
  styleUrls: ['./materias-manager.component.scss']
})
export class MateriasManagerComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit, AfterViewChecked {
  @Input() subscriptionTypeId: number;
  @Input() subscriptionTypeName: string;
  @Input() canDeletePermanently: boolean = false;
  // Eliminado: materias ya no se pasan desde el padre, siempre se cargan por API

  allMaterias: Materia[] = [];
  materiasFiltradas: Materia[] = [];
  isLoading: boolean = false;
  mostrarInactivas: boolean = false;

  constructor(
    private materiaService: MateriaData,
    private dialog: MatDialog
  ) {
    
  }

  ngOnInit(): void {
    console.log('🔍 MateriasManager initialized, subscriptionTypeId=', this.subscriptionTypeId);
    // load will be triggered from ngOnChanges when Input is set by parent
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.subscriptionTypeId && this.subscriptionTypeId) {
      this.loadMaterias();
    }
  }

  ngOnDestroy(): void {
    console.log('🔍 MateriasManager destroyed for subscriptionTypeId=', this.subscriptionTypeId);
  }

  ngAfterViewInit(): void {
    console.log('🔍 MateriasManager ngAfterViewInit for', this.subscriptionTypeId);
  }

  ngAfterViewChecked(): void {
    console.log('🔍 MateriasManager ngAfterViewChecked for', this.subscriptionTypeId);
  }

  filterMaterias(): void {
    if (this.mostrarInactivas) {
      this.materiasFiltradas = [...this.allMaterias];
    } else {
      this.materiasFiltradas = this.allMaterias.filter(m => m.activo);
    }
  }

  onMostrarInactivasToggle(): void {
    // When toggling the "Mostrar inactivas" switch we must ask the backend
    // because the server may return only active materias unless requested.
    // Always reload to ensure we have the correct dataset.
    this.loadMaterias();
  }

  loadMaterias(): void {
    
    if (!this.subscriptionTypeId) {
      console.warn('⚠️ loadMaterias: subscriptionTypeId is falsy, skipping load');
      return;
    }

    this.isLoading = true;
    this.materiaService.getBySubscriptionType(this.subscriptionTypeId, this.mostrarInactivas)
      .subscribe({
        next: (materias) => {
          this.allMaterias = materias;
          this.filterMaterias();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Error cargando materias:', err);
          this.isLoading = false;
        }
      });
  }

  onCreateMateria(): void {
    const dialogRef = this.dialog.open(MateriaFormDialogComponent, {
      width: '600px',
      data: {
        subscriptionTypeId: this.subscriptionTypeId,
        isEdit: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMaterias();
      }
    });
  }

  onEditMateria(materia: Materia, event: Event): void {
    event.stopPropagation();

    const dialogRef = this.dialog.open(MateriaFormDialogComponent, {
      width: '600px',
      data: {
        materia,
        subscriptionTypeId: this.subscriptionTypeId,
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMaterias();
      }
    });
  }

  onToggleActivo(materia: Materia, event: Event): void {
    event.stopPropagation();

    const accion = materia.activo ? 'desactivar' : 'activar';
    const mensaje = materia.activo
      ? '¿Desactivar esta materia? Sus opciones también se desactivarán.'
      : '¿Activar esta materia?';

    if (!confirm(mensaje)) return;

    this.materiaService.toggleActivo(materia.id).subscribe({
      next: (updated) => {
        materia.activo = updated.activo;
        if (!updated.activo && materia.opciones) {
          materia.opciones.forEach(o => o.activo = false);
        }
        
      },
      error: (err) => {
        console.error(`❌ Error al ${accion}:`, err);
        alert(`Error al ${accion} la materia`);
      }
    });
  }

  onDeletePermanente(materia: Materia, event: Event): void {
    event.stopPropagation();

    if (!confirm(`¿ELIMINAR PERMANENTEMENTE "${materia.nombre}"? Esta acción NO SE PUEDE DESHACER.`)) {
      return;
    }

    this.materiaService.delete(materia.id).subscribe({
      next: () => {
        this.allMaterias = this.allMaterias.filter(m => m.id !== materia.id);
        this.filterMaterias();
        
      },
      error: (err) => {
        console.error('❌ Error al eliminar:', err);
        alert('Error al eliminar la materia');
      }
    });
  }

  getOpcionesActivasCount(materia: Materia): number {
    return materia.opciones?.filter(o => o.activo).length || 0;
  }

  trackByMateria(index: number, materia: Materia): number {
    return materia.id;
  }
}
