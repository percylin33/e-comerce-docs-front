import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { NbIconModule } from '@nebular/theme';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type AppButtonSize = 'sm' | 'md' | 'lg';

/**
 * `<app-button>` — Botón base del Design System.
 *
 * Reemplaza `<button>` nativos y `nbButton` en flujos de producto.
 * Garantiza estados consistentes: default / hover / active / focus-visible /
 * disabled / loading.
 */
@Component({
    selector: 'ngx-button',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NbIconModule],
})
export class AppButtonComponent {
  /** Variante visual. */
  @Input() variant: AppButtonVariant = 'primary';

  /** Tamaño del control. */
  @Input() size: AppButtonSize = 'md';

  /** Icono Eva (usa `nb-icon`). Aparece a la izquierda del texto. */
  @Input() icon?: string;

  /** Si es `true`, sólo se renderiza el icono (sin texto). Requiere `aria-label`. */
  @Input() iconOnly = false;

  /** Ancho 100%. */
  @Input() block = false;

  /** Estado de carga. Deshabilita y muestra spinner. */
  @Input() loading = false;

  /** Deshabilitado. */
  @Input() disabled = false;

  /** Tipo de botón nativo. */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  /** Texto accesible para botones icon-only. */
  @Input() ariaLabel?: string;

  /** Click emitido cuando no está disabled/loading. */
  @Output() pressed = new EventEmitter<MouseEvent>();

  @HostBinding('class.app-button-host') readonly hostClass = true;
  @HostBinding('class.is-block') get blockClass() { return this.block; }

  get classes(): string {
    return [
      'app-btn',
      `app-btn--${this.variant}`,
      `app-btn--${this.size}`,
      this.block ? 'app-btn--block' : '',
      this.iconOnly ? 'app-btn--icon-only' : '',
      this.loading ? 'is-loading' : '',
    ].filter(Boolean).join(' ');
  }

  onClick(event: MouseEvent): void {
    if (this.disabled || this.loading) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    this.pressed.emit(event);
  }
}
