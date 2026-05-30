import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export type AppPriceSize = 'sm' | 'md' | 'hero';

/**
 * `<app-price>` — Display monetario con jerarquía clara.
 *
 * Renderiza moneda + monto, o "Gratis" si `free` es `true` o `amount` es 0/null.
 * Tamaño `hero` = anchor de decisión en pantallas de detalle.
 */
@Component({
    selector: 'ngx-price',
    templateUrl: './price.component.html',
    styleUrls: ['./price.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [DecimalPipe],
})
export class AppPriceComponent {
  @Input() amount: number | null = 0;
  @Input() currency = 'S/';
  @Input() size: AppPriceSize = 'md';

  /** Forzar render como "Gratis". Si no se pasa, se infiere de `amount`. */
  @Input() free?: boolean;

  /** Etiqueta opcional encima del precio (ej. "Precio"). */
  @Input() label?: string;

  @HostBinding('class') get hostClass(): string {
    return `app-price app-price--${this.size}` + (this.isFree ? ' is-free' : '');
  }

  get isFree(): boolean {
    if (typeof this.free === 'boolean') return this.free;
    return this.amount === 0 || this.amount === null || this.amount === undefined;
  }
}
