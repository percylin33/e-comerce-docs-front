import { Component, OnInit } from '@angular/core';
import { LegalTextService } from '../../@core/services/legal-text.service';
import { LegalText } from '../../@core/backend/api/legal-text.api';
import { PromotorHeaderActionsComponent } from '../../@theme/components/promotor-header-actions/promotor-header-actions.component';
import { SimpleFooterComponent } from '../../@theme/components/simple-footer/simple-footer.component';

@Component({
    selector: 'ngx-terminos',
    templateUrl: './terminos.component.html',
    styleUrls: ['./terminos.component.scss'],
    standalone: true,
    imports: [PromotorHeaderActionsComponent, SimpleFooterComponent]
})
export class TerminosComponent implements OnInit {
  legalText: LegalText | null = null;
  loading = true;
  error = false;

  constructor(private legalTextService: LegalTextService) {}

  ngOnInit(): void {
    this.loadTerms();
  }

  loadTerms(): void {
    this.loading = true;
    this.error = false;
    this.legalTextService.getTermsAndConditions().subscribe({
      next: (data) => {
        this.legalText = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading terms and conditions:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
}
