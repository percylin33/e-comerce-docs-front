import { Component, Input, OnInit, OnDestroy, HostListener } from '@angular/core';

@Component({
  selector: 'ngx-insight-card',
  templateUrl: './insight-card.component.html',
  styleUrls: ['./insight-card.component.scss']
})
export class InsightCardComponent implements OnInit, OnDestroy {
  @Input() title = '';
  @Input() content = '';
  @Input() iconClass = 'fas fa-lightbulb';
  /** variant: 'recommendation' | 'goal' | 'default' */
  @Input() variant: 'recommendation' | 'goal' | 'default' = 'recommendation';

  isMobile = false;

  ngOnInit(): void {
    this.checkScreenSize();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 575;
  }

  get variantClass(): string {
    if (this.variant === 'goal') return 'insight-card-goal';
    if (this.variant === 'recommendation') return 'insight-card';
    return 'insight-card-default';
  }
}
