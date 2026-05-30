import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ngx-card-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-card" [class.skeleton-card--horizontal]="variant === 'horizontal'" aria-hidden="true">
      <div class="skeleton-card__media skeleton-shimmer"></div>
      <div class="skeleton-card__body">
        <div class="skeleton-line skeleton-shimmer" style="width: 35%; height: 10px;"></div>
        <div class="skeleton-line skeleton-shimmer" style="width: 90%;"></div>
        <div class="skeleton-line skeleton-shimmer" style="width: 70%;"></div>
        <div class="skeleton-card__footer">
          <div class="skeleton-line skeleton-shimmer" style="width: 60px; height: 16px;"></div>
          <div class="skeleton-circle skeleton-shimmer"></div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./card-skeleton.component.scss'],
})
export class CardSkeletonComponent {
  @Input() variant: 'default' | 'horizontal' = 'default';
}
