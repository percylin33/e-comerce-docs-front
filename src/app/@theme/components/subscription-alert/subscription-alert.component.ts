import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-subscription-alert', // Usar prefijo app estándar o ngx según proyecto
  templateUrl: './subscription-alert.component.html',
  styleUrls: ['./subscription-alert.component.scss']
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
