import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

export interface ConfirmOverrideData {
  computedTotal: number;
  finalAmount: number;
  delta: number;
}

@Component({
  selector: 'ngx-confirm-amount-override-dialog',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe,
    MatDialogTitle, MatDialogContent, MatDialogActions,
    MatButton, MatIcon,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon class="warn-icon">warning_amber</mat-icon>
      Confirmar monto manual
    </h2>
    <div mat-dialog-content class="dialog-body">
      <p>
        Esta a punto de registrar la venta con un monto distinto al calculado a
        partir de los productos y descuentos automaticos.
      </p>
      <dl class="amount-rows">
        <div class="amount-row">
          <dt>Monto calculado</dt>
          <dd>S/ {{ data.computedTotal | number:'1.2-2' }}</dd>
        </div>
        <div class="amount-row">
          <dt>Monto manual</dt>
          <dd>S/ {{ data.finalAmount | number:'1.2-2' }}</dd>
        </div>
        <div class="amount-row amount-row--delta"
             [class.amount-row--positive]="data.delta > 0"
             [class.amount-row--negative]="data.delta < 0">
          <dt>Diferencia</dt>
          <dd>
            {{ data.delta > 0 ? '+' : '' }}S/ {{ data.delta | number:'1.2-2' }}
          </dd>
        </div>
      </dl>
      <p class="hint">
        La diferencia quedara registrada en auditoria (PaymentAuditLog) con el
        evento <code>MANUAL_AMOUNT_OVERRIDE</code> a su nombre.
      </p>
    </div>
    <div mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button type="button" (click)="cancel()">Cancelar</button>
      <button mat-flat-button color="primary" type="button" (click)="confirm()">
        <mat-icon>check_circle</mat-icon>
        Confirmar monto
      </button>
    </div>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
    .warn-icon { color: #f57c00; }
    .dialog-body { padding-top: 8px; }
    .amount-rows {
      margin: 16px 0;
      padding: 12px 16px;
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 8px;
      background: rgba(0,0,0,0.02);
    }
    .amount-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 4px 0;
      dt, dd { margin: 0; font-size: 14px; }
      dd { font-weight: 600; }
    }
    .amount-row--delta {
      border-top: 1px dashed rgba(0,0,0,0.12);
      padding-top: 8px;
      margin-top: 8px;
    }
    .amount-row--positive dd { color: #2e7d32; }
    .amount-row--negative dd { color: #c62828; }
    .hint {
      font-size: 12.5px;
      color: rgba(0,0,0,0.6);
      margin: 4px 0 0;
    }
    .dialog-actions {
      padding: 8px 0 0;
      button[mat-flat-button] {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
    }
  `],
})
export class ConfirmAmountOverrideDialogComponent {
  private ref = inject<MatDialogRef<ConfirmAmountOverrideDialogComponent, boolean>>(MatDialogRef);
  data = inject<ConfirmOverrideData>(MAT_DIALOG_DATA);

  confirm(): void { this.ref.close(true); }
  cancel(): void { this.ref.close(false); }
}
