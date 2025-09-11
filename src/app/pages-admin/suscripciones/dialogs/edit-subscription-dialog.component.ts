import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SuscripcionesData, EditSubscriptionRequest, SubscriptionDetails } from '../../../@core/interfaces/suscripciones';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface EditSubscriptionData {
  suscripcionId: number;
  subscriptionType: string;
  subscriptionTypeId: number;
  currentUnidad?: number;
  isMobile?: boolean;
}

export interface UnitOption {
  id: number;
  unidadNumero: number;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  subscriptionTypeId: number;
}

@Component({
  selector: 'ngx-edit-subscription-dialog',
  templateUrl: './edit-subscription-dialog.component.html',
  styleUrls: ['./edit-subscription-dialog.component.scss']
})
export class EditSubscriptionDialogComponent {
  editForm: FormGroup;
  nextUnits: UnitOption[] = [];
  subscriptionDetails: SubscriptionDetails | null = null;
  materiasArray: string[] = [];
  dualUnitsInfo: any = null; // Para manejar las dos unidades del subscriptionType 1
  loading = false;
  selectedAction: 'EDIT' | 'CANCEL' | null = null;
  isMobile = false;

  constructor(
    public dialogRef: MatDialogRef<EditSubscriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditSubscriptionData,
    private fb: FormBuilder,
    private suscripcionesService: SuscripcionesData,
    private snackBar: MatSnackBar
  ) {
    this.isMobile = data.isMobile || false;
    this.editForm = this.fb.group({
      unidadNumero: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFinUnidad: ['', Validators.required]
    });
    
    this.loadSubscriptionDetails();
  }

  loadSubscriptionDetails(): void {
    this.loading = true;
    this.suscripcionesService.getSubscriptionDetails(this.data.suscripcionId).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.subscriptionDetails = response.data;
          this.procesarMaterias(response.data.materiasOpcionesJson);
          
          // Si es subscriptionType 1, manejar las dos unidades
          if (this.subscriptionDetails.subscriptionTypeId === 1) {
            this.handleDualUnits();
          }
          
          // Cargar las unidades disponibles
          this.loadNextUnits();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading subscription details:', error);
        this.showMessage('Error al cargar los detalles de la suscripción', 'error');
        this.loading = false;
      }
    });
  }

  private handleDualUnits(): void {
    try {
      // Verificar si unidadActualTitulo contiene información de dos unidades (JSON)
      if (this.subscriptionDetails?.unidadActualTitulo.startsWith('{')) {
        const unidadesInfo = JSON.parse(this.subscriptionDetails.unidadActualTitulo);
        this.dualUnitsInfo = unidadesInfo;
        
        // Crear un título descriptivo para mostrar
        this.subscriptionDetails.unidadActualTitulo = 
          `Unidad ${this.subscriptionDetails.unidadActual}: ${unidadesInfo.unidad1.titulo} & ${unidadesInfo.unidad2.titulo}`;
      }
    } catch (error) {
      console.warn('Error parsing dual units info:', error);
    }
  }

  procesarMaterias(materiasJson: string): void {
    try {
      const materias = JSON.parse(materiasJson);
      this.materiasArray = [];
      
      for (const nivel in materias) {
        if (materias.hasOwnProperty(nivel)) {
          this.materiasArray.push(nivel);
          if (Array.isArray(materias[nivel])) {
            this.materiasArray.push(...materias[nivel]);
          }
        }
      }
    } catch (error) {
      console.error('Error al procesar materias:', error);
      this.materiasArray = [];
    }
  }

  loadNextUnits(): void {
    this.suscripcionesService.getNextUnits(this.data.suscripcionId).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.nextUnits = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading next units:', error);
        this.showMessage('Error al cargar las unidades disponibles', 'error');
      }
    });
  }

  onUnitChange(): void {
    const selectedUnidad = this.editForm.get('unidadNumero')?.value;
    if (selectedUnidad) {
      this.suscripcionesService.getUnitDetails(this.data.subscriptionTypeId, selectedUnidad).subscribe({
        next: (response) => {
          if (response.result && response.data) {
            const unitData = response.data;
            this.editForm.patchValue({
              fechaInicio: unitData.fechaInicio,
              fechaFinUnidad: unitData.fechaFin
            });
          }
        },
        error: (error) => {
          console.error('Error loading unit details:', error);
          this.showMessage('Error al cargar los detalles de la unidad', 'error');
        }
      });
    }
  }

  selectAction(action: 'EDIT' | 'CANCEL'): void {
    this.selectedAction = action;
  }

  onConfirm(): void {
    if (this.selectedAction === 'CANCEL') {
      this.confirmCancel();
    } else if (this.selectedAction === 'EDIT' && this.editForm.valid) {
      this.confirmEdit();
    }
  }

  confirmEdit(): void {
    this.loading = true;
    const formData = this.editForm.value;
    
    const editData: EditSubscriptionRequest = {
      subscriptionId: this.data.suscripcionId,
      unidadNumero: formData.unidadNumero,
      fechaInicio: formData.fechaInicio,
      fechaFinUnidad: formData.fechaFinUnidad,
      action: 'EDIT'
    };

    this.suscripcionesService.editSubscription(editData).subscribe({
      next: (response) => {
        if (response.result) {
          this.showMessage('Suscripción editada exitosamente', 'success');
          this.dialogRef.close(true);
        } else {
          this.showMessage('No se pudo editar la suscripción', 'error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error editing subscription:', error);
        this.showMessage('Error al editar la suscripción', 'error');
        this.loading = false;
      }
    });
  }

  confirmCancel(): void {
    this.loading = true;
    
    const editData: EditSubscriptionRequest = {
      subscriptionId: this.data.suscripcionId,
      action: 'CANCEL'
    };

    this.suscripcionesService.editSubscription(editData).subscribe({
      next: (response) => {
        if (response.result) {
          this.showMessage('Suscripción cancelada exitosamente', 'success');
          this.dialogRef.close(true);
        } else {
          this.showMessage('No se pudo cancelar la suscripción', 'error');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error canceling subscription:', error);
        this.showMessage('Error al cancelar la suscripción', 'error');
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private showMessage(message: string, type: 'success' | 'error' = 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}
