import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

/** Item del carrito mostrado en el panel lateral. */
export interface CartPanelItem {
  id: number;
  title: string;
  price: number;
  category?: string;
  materia?: string;
  nivel?: string;
  thumbUrl?: string;
  isKit?: boolean;
}

/**
 * Panel lateral sticky del carrito en el Paso 1 del wizard de venta manual.
 * Es presentational only: recibe items y subtotal del padre y emite
 * intenciones (remove, clearAll, continueToPayment).
 */
@Component({
  selector: 'ngx-cart-side-panel',
  templateUrl: './cart-side-panel.component.html',
  styleUrls: ['./cart-side-panel.component.scss'],
  standalone: true,
  imports: [
    CommonModule, DecimalPipe,
    MatButton, MatIconButton, MatIcon, MatTooltip,
  ],
})
export class CartSidePanelComponent {
  @Input() items: CartPanelItem[] = [];
  @Input() subtotal = 0;
  /** Cuando es true, el boton "Continuar al pago" se renderiza deshabilitado. */
  @Input() canContinue = true;

  @Output() remove = new EventEmitter<number>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() continueToPayment = new EventEmitter<void>();

  trackById = (_: number, it: { id: number }) => it.id;

  onRemove(id: number): void {
    this.remove.emit(id);
  }

  onClear(): void {
    if (this.items.length === 0) return;
    this.clearAll.emit();
  }

  onContinue(): void {
    if (this.items.length === 0) return;
    this.continueToPayment.emit();
  }
}
