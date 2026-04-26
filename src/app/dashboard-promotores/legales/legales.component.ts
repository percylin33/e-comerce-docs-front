import { Component, OnInit, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { LegalService } from '../../@core/backend/services/legal.service';
import { AdminHeaderActionsComponent } from '../../@theme/components/admin-header-actions/admin-header-actions.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'ngx-legales',
    templateUrl: './legales.component.html',
    styleUrls: ['./legales.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [AdminHeaderActionsComponent, FormsModule],
})
export class LegalesComponent implements OnInit, AfterViewInit {
  public initialized = false;
  public terminosContent = '';
  public privacidadContent = '';
  public terminosId: number | null = null;
  public privacidadId: number | null = null;

  constructor(private legalService: LegalService) {}

  ngOnInit(): void {
    // simple init to satisfy linter and place for future logic
    this.initialized = true;
  }

  ngAfterViewInit(): void {
    this.loadLegals();
  }

  private loadLegals(): void {
    this.legalService.getAll().subscribe({
      next: (res: any[]) => {
        const terms = (res || []).find((r: any) => r.type === 'TERMS');
        const privacy = (res || []).find((r: any) => r.type === 'PRIVACY');
        if (terms) { this.terminosContent = terms.content || ''; this.terminosId = terms.id || null; }
        if (privacy) { this.privacidadContent = privacy.content || ''; this.privacidadId = privacy.id || null; }
      },
      error: err => console.error('Error loading legal texts', err)
    });
  }

  saveTerminos(): void {
    const payload = { type: 'TERMS', content: this.terminosContent, versionLabel: 'v'+(new Date().toISOString()), isActive: false };
    if (this.terminosId) {
      this.legalService.update(this.terminosId, payload).subscribe({ next: () => this.loadLegals() });
    } else {
      this.legalService.create(payload).subscribe({ next: () => this.loadLegals() });
    }
  }

  savePrivacidad(): void {
    const payload = { type: 'PRIVACY', content: this.privacidadContent, versionLabel: 'v'+(new Date().toISOString()), isActive: false };
    if (this.privacidadId) {
      this.legalService.update(this.privacidadId, payload).subscribe({ next: () => this.loadLegals() });
    } else {
      this.legalService.create(payload).subscribe({ next: () => this.loadLegals() });
    }
  }

  publishTerminos(): void {
    if (!this.terminosId) return;
    this.legalService.publish(this.terminosId).subscribe({ next: () => this.loadLegals() });
  }

  publishPrivacidad(): void {
    if (!this.privacidadId) return;
    this.legalService.publish(this.privacidadId).subscribe({ next: () => this.loadLegals() });
  }

}
