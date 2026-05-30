import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
    selector: 'ngx-subscription-alert', // Usar prefijo app estándar o ngx según proyecto
    templateUrl: './subscription-alert.component.html',
    styleUrls: ['./subscription-alert.component.scss'],
    standalone: true,
    imports: [NgClass]
})
export class SubscriptionAlertComponent {
  @Input() type: 'error' | 'warning' | 'info' = 'info';
  @Input() icon: string = 'ℹ️';
  @Input() title!: string;
  @Input() message!: string;
  @Input() ctaText?: string;
  @Output() ctaClick = new EventEmitter<void>();

  onCtaClick() {
    this.ctaClick.emit();
  }
}
