import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NbButtonModule,
  NbCardModule,
  NbDialogRef,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
} from '@nebular/theme';
import { DiscrepancyRow } from '../../../@core/backend/services/audit.service';

/**
 * Modal para capturar la nota de resolución antes de marcar una discrepancia
 * como RESUELTA. La nota es obligatoria (min 10 chars) y se valida tanto en
 * el frontend como en el backend.
 */
@Component({
  selector: 'ngx-resolve-discrepancy-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NbCardModule,
    NbInputModule,
    NbButtonModule,
    NbIconModule,
    NbFormFieldModule,
    DatePipe,
  ],
  template: `
    <nb-card class="resolve-modal">
      <nb-card-header>
        <span class="modal-title">
          <nb-icon icon="checkmark-circle-2-outline"></nb-icon>
          Marcar discrepancia como resuelta
        </span>
      </nb-card-header>
      <nb-card-body>
        <p class="ctx-line"><b>Order:</b> {{ row.orderId }}</p>
        <p class="ctx-line"><b>Pasarela:</b> {{ row.gateway }}</p>
        <p class="ctx-line"><b>Monto:</b> {{ row.amount }} {{ row.currency }}</p>
        <p class="ctx-line"><b>Detectado:</b> {{ row.detectedAt | date: 'short' }}</p>

        <label class="note-label" for="resolutionNote">
          Nota de resolución (obligatoria, min 10 caracteres)
        </label>
        <textarea
          id="resolutionNote"
          nbInput
          fullWidth
          rows="5"
          maxlength="2000"
          placeholder="Ej: Procesé venta manual con voucher #X, paymentId=1234. Cliente notificado por email."
          [(ngModel)]="note"
        ></textarea>
        <div class="note-counter">
          {{ note.length }} / 2000
          <span *ngIf="note.length > 0 && note.length < 10" class="note-error">
            Faltan {{ 10 - note.length }} caracteres
          </span>
        </div>
      </nb-card-body>
      <nb-card-footer class="modal-footer">
        <button nbButton ghost size="small" type="button" (click)="cancel()">
          Cancelar
        </button>
        <button
          nbButton status="primary" size="small" type="button"
          [disabled]="note.trim().length < 10"
          (click)="confirm()"
        >
          <nb-icon icon="checkmark-outline"></nb-icon>
          Confirmar resolución
        </button>
      </nb-card-footer>
    </nb-card>
  `,
  styles: [`
    :host { display: block; }
    .resolve-modal { max-width: 520px; margin: 0; }
    .modal-title { display: inline-flex; align-items: center; gap: .5rem; font-weight: 600; }
    .ctx-line { margin: .25rem 0; font-size: .875rem; }
    .note-label { display: block; margin-top: 1rem; margin-bottom: .25rem; font-weight: 500; }
    .note-counter { font-size: .75rem; color: var(--text-hint-color); margin-top: .25rem; text-align: right; }
    .note-error { color: var(--color-danger-default); margin-left: .5rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: .5rem; }
  `],
})
export class ResolveDiscrepancyModalComponent {
  @Input() row!: DiscrepancyRow;

  note: string = '';

  private ref = inject(NbDialogRef<ResolveDiscrepancyModalComponent>);

  cancel(): void { this.ref.close(undefined); }

  confirm(): void {
    const trimmed = this.note.trim();
    if (trimmed.length < 10) return;
    this.ref.close(trimmed);
  }
}
