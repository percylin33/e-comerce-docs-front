import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface CtaAction {
  label: string;
  route: string | any[];
}

@Component({
  selector: 'ngx-cta-banner',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cta-banner.component.html',
  styleUrls: ['./cta-banner.component.scss'],
})
export class CtaBannerComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input({ required: true }) primaryAction!: CtaAction;
  @Input() secondaryAction?: CtaAction;
}
