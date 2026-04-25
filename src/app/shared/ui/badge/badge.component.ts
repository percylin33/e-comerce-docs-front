import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

export type AppBadgeVariant =
  | 'brand'
  | 'neutral'
  | 'success'
  | 'danger'
  | 'warning'
  | 'outline';

export type AppBadgeSize = 'sm' | 'md';

/**
 * `<app-badge>` — Etiqueta categórica/estadística reutilizable.
 *
 * Reemplaza `.category-tag`, `.level-tag`, `.document-pages`, etc.
 */
@Component({
  selector: 'ngx-badge',
  template: `<ng-content></ng-content>`,
  styleUrls: ['./badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppBadgeComponent {
  @Input() variant: AppBadgeVariant = 'brand';
  @Input() size: AppBadgeSize = 'md';

  @HostBinding('class') get hostClass(): string {
    return `app-badge app-badge--${this.variant} app-badge--${this.size}`;
  }
}
