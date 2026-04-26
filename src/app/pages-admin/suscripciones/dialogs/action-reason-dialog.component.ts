import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface ActionReasonDialogData {
  /** 'CANCELAR' | 'ACTIVAR' | 'EDITAR' */
  mode: 'CANCELAR' | 'ACTIVAR' | 'EDITAR';
  suscripcionId?: number;
  endDate?: string;
  status?: string;
}

export interface ActionReasonDialogResult {
  reason: string;
  /** Only present when mode === 'ACTIVAR' and the subscription has expired */
  dias?: number;
}

@Component({
  selector: 'ngx-action-reason-dialog',
  template: `
    <div class="dialog-container">
      <div class="dialog-header" [ngClass]="headerClass">
        <mat-icon class="header-icon">{{ headerIcon }}</mat-icon>
        <h2 mat-dialog-title>{{ title }}</h2>
        <button mat-icon-button (click)="onCancel()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div mat-dialog-content class="dialog-content">
    
          <!-- Subscription status info (shown for ACTIVAR) -->
          @if (data.mode === 'ACTIVAR' && data.endDate) {
            <div class="status-card">
              <mat-icon>{{ isFechaVencida() ? 'update' : 'play_circle' }}</mat-icon>
              <div class="status-info">
                <strong>Estado actual:</strong>
                <p>{{ data.status || 'INACTIVA' }} — Venció el {{ data.endDate | date:'dd/MM/yyyy' }}</p>
              </div>
            </div>
          }
    
          <!-- Warning banner for CANCELAR -->
          @if (data.mode === 'CANCELAR') {
            <div class="warning-banner">
              <mat-icon>warning</mat-icon>
              <p>Esta acción desactivará la suscripción y todos sus accesos asociados.</p>
            </div>
          }
    
          <!-- Días input — only for ACTIVAR when expired -->
          @if (data.mode === 'ACTIVAR' && isFechaVencida()) {
            <div class="input-section">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Días de renovación</mat-label>
                <input matInput type="number" formControlName="dias" min="1" max="365" placeholder="Ej: 30">
                <mat-icon matSuffix>schedule</mat-icon>
                <mat-hint>Entre 1 y 365 días</mat-hint>
                @if (form.get('dias')?.hasError('required')) {
                  <mat-error>Los días son requeridos</mat-error>
                }
                @if (form.get('dias')?.hasError('min')) {
                  <mat-error>Mínimo 1 día</mat-error>
                }
                @if (form.get('dias')?.hasError('max')) {
                  <mat-error>Máximo 365 días</mat-error>
                }
              </mat-form-field>
              <div class="quick-options">
                <span class="quick-label"><mat-icon>flash_on</mat-icon> Opciones rápidas:</span>
                <div class="quick-btns">
                  @for (opt of diasOptions; track opt) {
                    <button type="button" mat-stroked-button
                      (click)="setDias(opt.value)"
                      [class.selected]="form.value.dias === opt.value">
                      {{ opt.label }}
                    </button>
                  }
                </div>
              </div>
            </div>
          }
    
          <!-- Reason textarea — always visible -->
          <mat-form-field appearance="outline" class="full-width reason-field">
            <mat-label>Motivo de la acción *</mat-label>
            <textarea matInput formControlName="reason" rows="3"
            [placeholder]="reasonPlaceholder"></textarea>
            <mat-hint align="end">{{ form.get('reason')?.value?.length || 0 }}/500</mat-hint>
            @if (form.get('reason')?.hasError('required')) {
              <mat-error>El motivo es obligatorio</mat-error>
            }
            @if (form.get('reason')?.hasError('minlength')) {
              <mat-error>Mínimo 10 caracteres</mat-error>
            }
            @if (form.get('reason')?.hasError('maxlength')) {
              <mat-error>Máximo 500 caracteres</mat-error>
            }
          </mat-form-field>
    
        </div>
    
        <div mat-dialog-actions class="dialog-actions">
          <button mat-stroked-button type="button" (click)="onCancel()">Cancelar</button>
          <button mat-raised-button type="submit"
            [color]="confirmColor"
            [disabled]="form.invalid">
            <mat-icon>{{ confirmIcon }}</mat-icon>
            {{ confirmLabel }}
          </button>
        </div>
      </form>
    </div>
    `,
  styles: [`
    .dialog-container { padding: 0; min-width: 420px; }

    .dialog-header {
      display: flex; align-items: center; gap: 10px;
      padding: 16px 20px; border-radius: 4px 4px 0 0;
    }
    .dialog-header.cancelar { background: #fff3e0; color: #e65100; }
    .dialog-header.activar  { background: #e8f5e9; color: #2e7d32; }
    .dialog-header.editar   { background: #e3f2fd; color: #1565c0; }
    .dialog-header h2 { margin: 0; flex: 1; font-size: 18px; }
    .close-btn { margin-left: auto; }
    .header-icon { font-size: 28px; width: 28px; height: 28px; }

    .dialog-content { padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }

    .status-card {
      display: flex; align-items: flex-start; gap: 10px;
      background: #f5f5f5; border-radius: 6px; padding: 10px 14px;
    }
    .warning-banner {
      display: flex; align-items: center; gap: 10px;
      background: #fff8e1; border: 1px solid #ffe082; border-radius: 6px; padding: 10px 14px;
      color: #f57f17;
    }

    .input-section { display: flex; flex-direction: column; gap: 8px; }
    .quick-options { display: flex; flex-direction: column; gap: 6px; }
    .quick-label { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 500; }
    .quick-btns { display: flex; flex-wrap: wrap; gap: 6px; }
    .quick-btns button { font-size: 12px; }
    .quick-btns button.selected { background: #e3f2fd; border-color: #1565c0; }

    .full-width { width: 100%; }
    .reason-field textarea { resize: vertical; min-height: 72px; }

    .dialog-actions {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 12px 20px 16px;
    }
  `]
})
export class ActionReasonDialogComponent {

  form: FormGroup;

  diasOptions = [
    { value: 7,   label: '7 días'  },
    { value: 30,  label: '30 días' },
    { value: 90,  label: '90 días' },
    { value: 365, label: '1 año'   },
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ActionReasonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ActionReasonDialogData
  ) {
    const diasValidators = this.data.mode === 'ACTIVAR' && this.isFechaVencida()
      ? [Validators.required, Validators.min(1), Validators.max(365)]
      : [];

    this.form = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      dias:   [30, diasValidators]
    });
  }

  isFechaVencida(): boolean {
    if (!this.data.endDate) return false;
    return new Date(this.data.endDate) < new Date();
  }

  setDias(value: number): void {
    this.form.get('dias')?.setValue(value);
  }

  get title(): string {
    const map = { CANCELAR: 'Cancelar Suscripción', ACTIVAR: 'Activar Suscripción', EDITAR: 'Editar Suscripción' };
    return map[this.data.mode] ?? 'Acción sobre Suscripción';
  }

  get headerClass(): string {
    return this.data.mode.toLowerCase();
  }

  get headerIcon(): string {
    const map = { CANCELAR: 'cancel', ACTIVAR: 'play_circle', EDITAR: 'edit' };
    return map[this.data.mode] ?? 'info';
  }

  get confirmLabel(): string {
    const map = { CANCELAR: 'Confirmar Cancelación', ACTIVAR: 'Confirmar Activación', EDITAR: 'Confirmar Cambios' };
    return map[this.data.mode] ?? 'Confirmar';
  }

  get confirmIcon(): string {
    const map = { CANCELAR: 'cancel', ACTIVAR: 'play_circle', EDITAR: 'save' };
    return map[this.data.mode] ?? 'check';
  }

  get confirmColor(): string {
    return this.data.mode === 'CANCELAR' ? 'warn' : 'primary';
  }

  get reasonPlaceholder(): string {
    const map = {
      CANCELAR: 'Ej: El alumno solicitó la baja por motivos personales…',
      ACTIVAR:  'Ej: Se renovó el pago. Activación manual solicitada por…',
      EDITAR:   'Ej: Se corrige la unidad asignada según acuerdo con el alumno…'
    };
    return map[this.data.mode] ?? 'Describe el motivo de esta acción…';
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const result: ActionReasonDialogResult = {
      reason: this.form.value.reason.trim()
    };
    if (this.data.mode === 'ACTIVAR' && this.isFechaVencida()) {
      result.dias = this.form.value.dias;
    } else if (this.data.mode === 'ACTIVAR') {
      result.dias = 0;
    }
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close(undefined);
  }
}
