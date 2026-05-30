import {
  Component, EventEmitter, Input, Output,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

/** Item compacto mostrado en el panel de resumen (subset del SelectedDocument). */
export interface SummaryProductItem {
  id: number;
  title: string;
  price: number;
  isKit?: boolean;
}

/**
 * Panel sticky de resumen del Paso 2 (Pago). Es presentational: recibe
 * los totales y emite acciones (preview email, restaurar monto calculado).
 *
 * Renderiza:
 *  - Subtotal
 *  - Descuento cupon (si aplica)
 *  - Total calculado
 *  - Monto a cobrar (resaltado)
 *  - Diferencia override (si aplica)
 *  - Lista colapsable de productos
 *  - Boton "Vista previa email cliente"
 */
@Component({
  selector: 'ngx-payment-summary-panel',
  templateUrl: './payment-summary-panel.component.html',
  styleUrls: ['./payment-summary-panel.component.scss'],
  standalone: true,
  imports: [
    CommonModule, DecimalPipe,
    MatButton, MatIconButton, MatIcon, MatTooltip,
  ],
})
export class PaymentSummaryPanelComponent {
  @Input() items: SummaryProductItem[] = [];
  @Input() subtotal = 0;
  @Input() couponCode = '';
  @Input() couponPct = 0;
  @Input() couponDiscount = 0;
  @Input() computedTotal = 0;
  @Input() finalAmount = 0;
  @Input() overrideActive = false;
  @Input() overrideDelta = 0;

  @Output() previewEmail = new EventEmitter<void>();
  @Output() restoreComputed = new EventEmitter<void>();

  itemsExpanded = false;

  trackById = (_: number, it: SummaryProductItem) => it.id;

  toggleItems(): void {
    this.itemsExpanded = !this.itemsExpanded;
  }

  get kitsCount(): number {
    return this.items.filter(i => i.isKit).length;
  }

  get docsCount(): number {
    return this.items.length - this.kitsCount;
  }

  get hasOverrideDelta(): boolean {
    return this.overrideActive && this.overrideDelta !== 0;
  }

  get overrideDeltaPct(): number {
    if (!this.computedTotal) return 0;
    return +(this.overrideDelta / this.computedTotal * 100).toFixed(1);
  }
}
