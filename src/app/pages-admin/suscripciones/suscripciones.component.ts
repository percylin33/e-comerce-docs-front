import { Component, OnInit } from '@angular/core';
import { SuscripcionesData } from '../../@core/interfaces/suscripciones';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from './dialogs/confirm-dialog.component';
import { PagosDialogComponent } from './dialogs/pagos-dialog.component';
import { ActivarDialogComponent } from './dialogs/activar-dialog.component';

@Component({
  selector: 'ngx-suscripciones',
  templateUrl: './suscripciones.component.html',
  styleUrls: ['./suscripciones.component.scss']
})
export class SuscripcionesComponent implements OnInit {

  constructor(
    private suscripcionesService: SuscripcionesData,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.cargarSuscripciones();
  }

  displayedColumns: string[] = ['usuario', 'nombre', 'materias', 'fechaInicio', 'fechaFin', 'acciones'];

  suscripcionesActivas: any[] = [];
  suscripcionesInactivas: any[] = [];
  cargando: boolean = false;

  cargarSuscripciones(): void {
    this.cargando = true;
    this.suscripcionesService.getAllSuscripciones().subscribe({
      next: (data) => {
        
        if (data.data && Array.isArray(data.data)) {
          // Procesar y separar las suscripciones por estado
          this.procesarSuscripciones(data.data);
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar suscripciones:', error);
        this.mostrarMensaje('Error al cargar las suscripciones', 'error');
        this.cargando = false;
      }
    });
  }

  procesarSuscripciones(suscripciones: any[]): void {
    this.suscripcionesActivas = [];
    this.suscripcionesInactivas = [];

    suscripciones.forEach(suscripcion => {
      const suscripcionProcesada = {
        id: suscripcion.id,
        usuario: suscripcion.userName,
        nombre: suscripcion.subscriptionType,
        materias: this.procesarMaterias(suscripcion.materiasOpcionesJson),
        fechaInicio: suscripcion.startDate,
        fechaFin: suscripcion.endDate,
        // Mantener las propiedades originales para el modal
        endDate: suscripcion.endDate,
        status: suscripcion.status
      };

      if (suscripcion.status === 'ACTIVA') {
        this.suscripcionesActivas.push(suscripcionProcesada);
      } else {
        this.suscripcionesInactivas.push(suscripcionProcesada);
      }
    });
  }

  procesarMaterias(materiasJson: string): string[] {
    try {
      const materias = JSON.parse(materiasJson);
      const materiasArray: string[] = [];
      
      for (const nivel in materias) {
        if (materias.hasOwnProperty(nivel)) {
          materiasArray.push(nivel);
          if (Array.isArray(materias[nivel])) {
            materiasArray.push(...materias[nivel]);
          }
        }
      }
      
      return materiasArray;
    } catch (error) {
      console.error('Error al procesar materias:', error);
      return [];
    }
  }

  cancelarSuscripcion(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      data: {
        title: 'Confirmar Cancelación',
        message: '¿Estás seguro de que deseas cancelar esta suscripción?',
        confirmText: 'Cancelar Suscripción',
        cancelText: 'No, mantener'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ejecutarCancelacion(id);
      }
    });
  }

  ejecutarCancelacion(id: number): void {
    this.suscripcionesService.putCancelarSuscripcion(id).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.mostrarMensaje('Suscripción cancelada exitosamente', 'success');
          this.cargarSuscripciones(); // Recargar la lista
        } else {
          this.mostrarMensaje('No se pudo cancelar la suscripción', 'error');
        }
      },
      error: (error) => {
        console.error('Error al cancelar suscripción:', error);
        this.mostrarMensaje('Error al cancelar la suscripción', 'error');
      }
    });
  }

  verPagos(id: number) {
    this.suscripcionesService.getPaymentsBySuscripcionId(id).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.mostrarDialogoPagos(response.data);
        } else {
          this.mostrarMensaje('No se encontraron pagos para esta suscripción', 'info');
        }
      },
      error: (error) => {
        console.error('Error al obtener pagos:', error);
        this.mostrarMensaje('Error al cargar los pagos', 'error');
      }
    });
  }

  mostrarDialogoPagos(pagos: any[]): void {
    this.dialog.open(PagosDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { pagos: pagos }
    });
  }

  activarSuscripcion(id: number, dias: number = 30): void {
    this.suscripcionesService.putActivarSuscripcion(id, dias).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.mostrarMensaje('Suscripción activada exitosamente', 'success');
          this.cargarSuscripciones(); // Recargar la lista
        } else {
          this.mostrarMensaje('No se pudo activar la suscripción', 'error');
        }
      },
      error: (error) => {
        console.error('Error al activar suscripción:', error);
        this.mostrarMensaje('Error al activar la suscripción', 'error');
      }
    });
  }

  mostrarDialogoActivar(id: number): void {
    // Buscar la suscripción en ambas listas
    let suscripcion = this.suscripcionesActivas.find(s => s.id === id);
    if (!suscripcion) {
      suscripcion = this.suscripcionesInactivas.find(s => s.id === id);
    }
    
    if (!suscripcion) {
      this.mostrarMensaje('Suscripción no encontrada', 'error');
      return;
    }
    

    const dialogRef = this.dialog.open(ActivarDialogComponent, {
      width: '490px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      data: { 
        suscripcionId: id,
        endDate: suscripcion.endDate,
        status: suscripcion.status
      }
    });

    dialogRef.afterClosed().subscribe(dias => {
      if (dias !== undefined) { // Permitir valor 0 para activaciones sin días adicionales
        this.activarSuscripcion(id, dias);
      }
    });
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: [`snackbar-${tipo}`],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}
