import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { NbIconModule } from '@nebular/theme';

export type AppIconButtonVariant = 'ghost' | 'soft' | 'solid';
export type AppIconButtonSize = 'sm' | 'md' | 'lg';

/**
 * `<app-icon-button>` — Botón circular sólo de icono con `aria-label` obligatorio.
 *
 * Para acciones terciarias o controles compactos (zoom, like, share, expand).
 */
@Component({
    selector: 'ngx-icon-button',
    templateUrl: './icon-button.component.html',
    styleUrls: ['./icon-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NbIconModule],
})
export class AppIconButtonComponent {
  @Input() icon!: string;
  /** Texto accesible. Obligatorio para a11y. */
  @Input() label!: string;
  @Input() variant: AppIconButtonVariant = 'ghost';
  @Input() size: AppIconButtonSize = 'md';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' = 'button';

  @Output() pressed = new EventEmitter<MouseEvent>();

  @HostBinding('class') get hostClass(): string {
    return `app-icon-btn-host`;
  }

  get classes(): string {
    return [
      'app-icon-btn',
      `app-icon-btn--${this.variant}`,
      `app-icon-btn--${this.size}`,
    ].join(' ');
  }

  onClick(event: MouseEvent): void {
    if (this.disabled) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    this.pressed.emit(event);
  }
}
