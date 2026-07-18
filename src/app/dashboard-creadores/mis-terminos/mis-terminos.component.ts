import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { DatePipe } from "@angular/common";
import {
  CreatorApiService,
  CreatorTermsAcceptanceDto,
  CreatorTermsDto,
  PageResponse,
} from "../services/creator-api.service";
import { CreatorTermsStateService } from "../services/creator-terms-state.service";
import { CreatorMarkdownPipe } from "../pipes/creator-markdown.pipe";

@Component({
    selector: "ngx-creador-mis-terminos",
    templateUrl: "./mis-terminos.component.html",
    styleUrls: ["./mis-terminos.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [DatePipe, CreatorMarkdownPipe],
})
export class CreadorMisTerminosComponent implements OnInit {
  private api = inject(CreatorApiService);
  private termsState = inject(CreatorTermsStateService);

  terms: CreatorTermsDto | null = null;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  acceptances: CreatorTermsAcceptanceDto[] = [];
  acceptancesLoading = false;

  accepting = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api.getMyActiveTerms().subscribe({
      next: (t) => {
        this.terms = t;
        this.loading = false;
        if (!t.acceptedByCurrentUser) {
          this.loadAcceptances();
        }
      },
      error: (e) => {
        this.errorMessage = this.parseError(
          e,
          "No se pudieron cargar los Terminos y Condiciones vigentes.",
        );
        this.loading = false;
      },
    });
  }

  loadAcceptances(): void {
    this.acceptancesLoading = true;
    this.api.getMyAcceptances(0, 50).subscribe({
      next: (page: PageResponse<CreatorTermsAcceptanceDto>) => {
        this.acceptances = page.content || [];
        this.acceptancesLoading = false;
      },
      error: () => {
        this.acceptancesLoading = false;
      },
    });
  }

  accept(): void {
    if (!this.terms) return;
    if (!confirm("Confirmas que has leido y aceptas estos Terminos y Condiciones?")) {
      return;
    }
    this.accepting = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.api.acceptActiveTerms().subscribe({
      next: (res) => {
        this.accepting = false;
        this.successMessage = res.message || "Aceptaste los Terminos y Condiciones.";
        // Actualizamos el service singleton para liberar el gate globalmente.
        // Si el dashboard layout estaba mostrando el overlay, este solo
        // re-evaluara en el siguiente NavigationEnd / refresh().
        this.termsState.markAccepted();
        // Re-fetch para que acceptedByCurrentUser pase a true localmente.
        this.load();
        setTimeout(() => (this.successMessage = null), 5000);
      },
      error: (e) => {
        this.accepting = false;
        this.errorMessage = this.parseError(e, "No se pudo registrar la aceptacion.");
      },
    });
  }

  private parseError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 0) return "No se pudo conectar al servidor.";
    if (err?.status === 404) return "Aun no hay una version activa de Terminos y Condiciones.";
    return fallback;
  }
}
