import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ngx-section-header',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section-header.component.html',
  styleUrls: ['./section-header.component.scss'],
})
export class SectionHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() actionLabel?: string;
  @Input() actionRoute?: string | any[];
  @Input() align: 'left' | 'center' = 'left';
}
