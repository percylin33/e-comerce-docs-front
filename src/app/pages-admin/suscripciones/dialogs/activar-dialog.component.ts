import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface ActivarDialogData {
  suscripcionId: number;
  endDate: string;
  status: string;
}

@Component({
  selector: 'ngx-activar-dialog',
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="activate-icon">play_circle</mat-icon>
        <h2 mat-dialog-title>{{ isFechaVencida() ? 'Renovar Suscripción' : 'Activar Suscripción' }}</h2>
        <button mat-icon-button (click)="onCancel()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <form [formGroup]="activarForm" (ngSubmit)="onSubmit()">
        <div mat-dialog-content class="activar-content">
          <div class="info-section">
            <mat-icon>{{ isFechaVencida() ? 'update' : 'info' }}</mat-icon>
            <p>{{ getInfoMessage() }}</p>
          </div>
          
          <!-- Sección de estado actual -->
          <div class="status-section">
            <div class="status-card" [class]="getStatusClass()">
              <mat-icon>{{ getStatusIcon() }}</mat-icon>
              <div class="status-info">
                <strong>Estado actual:</strong>
                <p>{{ data.status || 'Sin estado' }} - Vence el {{ data.endDate | date:'dd/MM/yyyy' }}</p>
              </div>
            </div>
          </div>
          
          <!-- Mostrar input solo si la fecha ya venció -->
          <div class="input-section" *ngIf="isFechaVencida()">
            <mat-form-field appearance="outline" class="dias-field">
              <mat-label>Días de renovación</mat-label>
              <input matInput type="number" formControlName="dias" min="1" max="365" placeholder="Ej: 30">
              <mat-icon matSuffix>schedule</mat-icon>
              <mat-hint>Entre 1 y 365 días</mat-hint>
              <mat-error *ngIf="activarForm.get('dias')?.hasError('required')">
                Los días son requeridos
              </mat-error>
              <mat-error *ngIf="activarForm.get('dias')?.hasError('min')">
                Mínimo 1 día
              </mat-error>
              <mat-error *ngIf="activarForm.get('dias')?.hasError('max')">
                Máximo 365 días
              </mat-error>
            </mat-form-field>
          </div>

          <div class="opciones-rapidas" *ngIf="isFechaVencida()">
            <h4><mat-icon>flash_on</mat-icon> Opciones populares:</h4>
            <div class="botones-grid">
              <button type="button" mat-stroked-button (click)="setDias(1)" class="option-btn" 
                      [class.selected]="activarForm.value.dias === 1">
                <mat-icon>today</mat-icon>
                <span class="btn-text">
                  <strong>1 día</strong>
                  <small>Prueba</small>
                </span>
              </button>
              
              <button type="button" mat-stroked-button (click)="setDias(7)" class="option-btn"
                      [class.selected]="activarForm.value.dias === 7">
                <mat-icon>date_range</mat-icon>
                <span class="btn-text">
                  <strong>7 días</strong>
                  <small>Semanal</small>
                </span>
              </button>
              
              <button type="button" mat-stroked-button (click)="setDias(30)" class="option-btn"
                      [class.selected]="activarForm.value.dias === 30">
                <mat-icon>calendar_month</mat-icon>
                <span class="btn-text">
                  <strong>30 días</strong>
                  <small>Mensual</small>
                </span>
              </button>
              
              <button type="button" mat-stroked-button (click)="setDias(365)" class="option-btn"
                      [class.selected]="activarForm.value.dias === 365">
                <mat-icon>event</mat-icon>
                <span class="btn-text">
                  <strong>1 año</strong>
                  <small>Anual</small>
                </span>
              </button>
            </div>
          </div>

          <div class="preview-section" *ngIf="isFechaVencida() && activarForm.value.dias && activarForm.valid">
            <mat-icon>preview</mat-icon>
            <div class="preview-content">
              <strong>Resumen:</strong>
              <p>La suscripción se renovará por <strong>{{ activarForm.value.dias }}</strong> día(s)</p>
              <p class="expiry-date">Nueva fecha de vencimiento: <strong>{{ getExpiryDate() | date:'dd/MM/yyyy' }}</strong></p>
            </div>
          </div>
        </div>
        
        <div mat-dialog-actions class="dialog-actions">
          <button type="button" mat-stroked-button (click)="onCancel()" class="cancel-btn">
            <mat-icon>close</mat-icon>
            Cancelar
          </button>
          <button type="submit" mat-raised-button color="accent" [disabled]="!isFormValid()" class="submit-btn">
            <mat-icon>{{ isFechaVencida() ? 'refresh' : 'check_circle' }}</mat-icon>
            {{ getSubmitButtonText() }}
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./activar-dialog.component.scss']
})
export class ActivarDialogComponent {
  activarForm: FormGroup;
  fechaVencida: boolean = false; // Propiedad calculada una sola vez
  infoMessage: string = '';
  statusClass: string = '';
  statusIcon: string = '';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ActivarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ActivarDialogData
  ) {
    // Calcular todas las propiedades una sola vez
    this.fechaVencida = this.calcularFechaVencida();
    this.infoMessage = this.calcularInfoMessage();
    this.statusClass = this.calcularStatusClass();
    this.statusIcon = this.calcularStatusIcon();
 

    // Configurar validadores según si la fecha ya venció
    if (this.fechaVencida) {
      // Si la fecha ya pasó, requiere días para renovar
      this.activarForm = this.fb.group({
        dias: [1, [Validators.required, Validators.min(1), Validators.max(365)]]
      });
    } else {
      // Si está inactiva pero la fecha aún no pasa, solo activar sin días
      this.activarForm = this.fb.group({
        dias: [0] // Sin validadores requeridos
      });
    }
  }

  // Método utilitario para obtener la fecha actual en la zona horaria de Lima, Perú
  private getTodayInLima(): Date {
    // Usar la API nativa para obtener la fecha en la zona horaria de Lima
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(part => part.type === 'year')!.value);
    const month = parseInt(parts.find(part => part.type === 'month')!.value) - 1; // Los meses en JS son 0-indexados
    const day = parseInt(parts.find(part => part.type === 'day')!.value);
    const hour = parseInt(parts.find(part => part.type === 'hour')!.value);
    const minute = parseInt(parts.find(part => part.type === 'minute')!.value);
    const second = parseInt(parts.find(part => part.type === 'second')!.value);
    
    return new Date(year, month, day, hour, minute, second);
  }

  // Método para obtener fecha actual de Lima sin horas (solo fecha)
  private getTodayInLimaAtMidnight(): Date {
    const lima = this.getTodayInLima();
    lima.setHours(0, 0, 0, 0);
    return lima;
  }

  // Método público para obtener la hora actual de Lima como string (para debugging)
  getCurrentLimaTime(): string {
    const limaTime = this.getTodayInLima();
    return limaTime.toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  private calcularFechaVencida(): boolean {
    if (!this.data.endDate) return false;
    
    const endDate = new Date(this.data.endDate);
    const today = this.getTodayInLimaAtMidnight(); // Usar hora de Lima
    
    // Verificar si la fecha es válida
    if (isNaN(endDate.getTime())) return false;
    
    // Normalizar la fecha de fin para comparar solo fechas (sin horas)
    endDate.setHours(0, 0, 0, 0);
    
    return endDate < today;
  }

  private calcularInfoMessage(): string {
    if (this.fechaVencida) {
      return 'La fecha de suscripción ya venció. Selecciona cuántos días deseas renovarla.';
    } else if (this.data.status && this.data.status.toLowerCase() === 'inactiva') {
      return 'La suscripción está inactiva pero aún no ha vencido. ¿Deseas activarla?';
    } else {
      return 'La suscripción está activa. ¿Deseas activarla nuevamente?';
    }
  }

  private calcularStatusClass(): string {
    if (this.fechaVencida) {
      return 'status-expired'; // Fecha ya pasó - naranja
    } else if (this.data.status && this.data.status.toLowerCase() === 'inactiva') {
      return 'status-inactive'; // Inactiva pero no vencida - rojo
    } else {
      return 'status-active'; // Activa - verde
    }
  }

  private calcularStatusIcon(): string {
    if (this.fechaVencida) {
      return 'warning'; // Fecha ya pasó
    } else if (this.data.status && this.data.status.toLowerCase() === 'inactiva') {
      return 'pause_circle'; // Inactiva pero no vencida
    } else {
      return 'check_circle'; // Activa
    }
  }

  // Método getter simple que devuelve la propiedad calculada
  isFechaVencida(): boolean {
    return this.fechaVencida;
  }

  getInfoMessage(): string {
    return this.infoMessage;
  }

  getStatusClass(): string {
    return this.statusClass;
  }

  getStatusIcon(): string {
    return this.statusIcon;
  }

  getSubmitButtonText(): string {
    if (this.fechaVencida) {
      const dias = this.activarForm.value.dias || 0;
      return `Renovar por ${dias} día(s)`;
    } else {
      return 'Activar Suscripción';
    }
  }

  isFormValid(): boolean {
    if (this.fechaVencida) {
      return this.activarForm.valid && this.activarForm.value.dias > 0;
    } else {
      return true; // Siempre válido para suscripciones no vencidas
    }
  }

  setDias(dias: number): void {
    this.activarForm.patchValue({ dias });
  }

  getExpiryDate(): Date {
    const dias = this.activarForm.value.dias;
    if (!dias) return this.getTodayInLima(); // Usar hora de Lima
    
    const today = this.getTodayInLima(); // Usar hora de Lima
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + dias);
    return expiryDate;
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      const dias = this.fechaVencida ? this.activarForm.value.dias : 0;
      this.dialogRef.close(dias);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
