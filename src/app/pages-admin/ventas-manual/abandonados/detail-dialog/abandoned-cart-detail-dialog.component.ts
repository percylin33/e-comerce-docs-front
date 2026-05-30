import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogModule,
} from '@angular/material/dialog';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PaymentService } from '../../../../@core/backend/services/payment.service';
import { AbandonedCartDetail } from '../../../../@core/interfaces/payments';

export interface AbandonedCartDetailDialogData {
  orderId: string;
}

export interface AbandonedCartDetailDialogResult {
  /**
   * Accion seleccionada por el admin desde el modal:
   * - manual: convertir a venta manual (precarga el wizard)
   * - resend: reenviar enlace de pago
   * - discard: descartar el carrito
   */
  action?: 'manual' | 'resend' | 'discard';
  orderId?: string;
}

/**
 * Modal con la informacion completa de un carrito abandonado. Carga el
 * detalle del intent (cliente, productos hidratados desde DocumentsEntity,
 * monto esperado, cupon, historial de recordatorios, payload bruto) y
 * permite disparar las 3 acciones principales: procesar como venta manual,
 * reenviar enlace de pago, o descartar el carrito.
 */
@Component({
  selector: 'ngx-abandoned-cart-detail-dialog',
  standalone: true,
  imports: [
    CommonModule, DatePipe, DecimalPipe,
    MatDialogModule, MatButton, MatIconButton, MatIcon,
    MatProgressSpinner, MatTooltip, MatChipsModule, MatTabsModule,
  ],
  templateUrl: './abandoned-cart-detail-dialog.component.html',
  styleUrls: ['./abandoned-cart-detail-dialog.component.scss'],
})
export class AbandonedCartDetailDialogComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private snackBar = inject(MatSnackBar);

  loading = false;
  errorMsg = '';
  detail: AbandonedCartDetail | null = null;

  // Items para la lista (con flag de "missing" para los que ya no existen)
  get items() { return this.detail?.items || []; }

  constructor(
    private dialogRef: MatDialogRef<
      AbandonedCartDetailDialogComponent,
      AbandonedCartDetailDialogResult
    >,
    @Inject(MAT_DIALOG_DATA) public data: AbandonedCartDetailDialogData,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.paymentService.getAbandonedCartDetail(this.data.orderId).subscribe({
      next: env => {
        this.loading = false;
        if (env?.result && env.data) {
          this.detail = env.data;
        } else {
          this.errorMsg = 'No se pudo obtener el detalle del carrito.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message
          || 'Error consultando el detalle del carrito.';
      },
    });
  }

  // ===== Acciones (cierran el dialog devolviendo la accion al padre) =====
  processAsManual(): void {
    this.dialogRef.close({ action: 'manual', orderId: this.data.orderId });
  }

  resend(): void {
    this.dialogRef.close({ action: 'resend', orderId: this.data.orderId });
  }

  discard(): void {
    this.dialogRef.close({ action: 'discard', orderId: this.data.orderId });
  }

  close(): void {
    this.dialogRef.close();
  }

  // ===== Utilidades =====
  copyToClipboard(value: string, label: string): void {
    if (!value) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(value).then(() => {
        this.snackBar.open(`${label} copiado.`, 'Cerrar', { duration: 1800 });
      }).catch(() => {
        this.snackBar.open('No se pudo copiar.', 'Cerrar', { duration: 2000 });
      });
    }
  }

  customerName(): string {
    if (!this.detail) return '';
    const d = this.detail;
    const full = [d.firstName, d.lastName].filter(Boolean).join(' ').trim();
    return full || d.name || d.email || '-';
  }

  customerTypeLabel(): string {
    if (this.detail?.customerType === 'GUEST') return 'Invitado';
    if (this.detail?.customerType === 'REGISTERED') return 'Registrado';
    return this.detail?.customerType || '-';
  }

  statusLabel(): string {
    const s = (this.detail?.status || '').toUpperCase();
    if (s === 'PROCESSING') return 'En proceso';
    if (s === 'FAILED') return 'Fallido';
    if (s === '2') return 'Activo';
    if (s === 'DISCARDED') return 'Descartado';
    if (s === 'PROCESSED') return 'Procesado';
    return this.detail?.status || '-';
  }

  statusBadgeClass(): string {
    const s = (this.detail?.status || '').toUpperCase();
    if (s === 'PROCESSING') return 'badge badge--processing';
    if (s === 'FAILED') return 'badge badge--failed';
    if (s === '2') return 'badge badge--active';
    if (s === 'DISCARDED') return 'badge badge--discarded';
    if (s === 'PROCESSED') return 'badge badge--success';
    return 'badge';
  }

  itemsTotal(): number {
    return this.items.reduce((acc, it) => acc + Number(it.price || 0), 0);
  }

  hasReminderHistory(): boolean {
    return !!(this.detail?.reminderCount && this.detail.reminderCount > 0);
  }

  wasConverted(): boolean {
    return !!(this.detail?.convertedPaymentId);
  }
}
