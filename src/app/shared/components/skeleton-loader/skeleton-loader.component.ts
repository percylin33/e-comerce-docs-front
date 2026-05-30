import { Component, Input } from '@angular/core';

@Component({
    selector: 'ngx-skeleton-loader',
    templateUrl: './skeleton-loader.component.html',
    styleUrls: ['./skeleton-loader.component.scss'],
    standalone: true
})
export class SkeletonLoaderComponent {
  @Input() type: 'stats' | 'card' | 'table' | 'chart' = 'stats';
  @Input() count: number = 4;

  get items(): number[] {
    return Array(this.count).fill(0).map((_, i) => i);
  }
}
