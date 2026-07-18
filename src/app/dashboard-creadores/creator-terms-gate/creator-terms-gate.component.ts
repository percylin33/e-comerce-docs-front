import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import {
  CreatorApiService,
  CreatorTermsDto,
} from "../services/creator-api.service";
import { CreatorTermsStateService } from "../services/creator-terms-state.service";
import { CreatorMarkdownPipe } from "../pipes/creator-markdown.pipe";

/**
 * Pantalla que aparece al Creador la primera vez que entra al panel.
 *
 * <p>Se renderiza DENTRO del layout {@code DashboardCreadoresComponent}
 * cuando {@link CreatorTermsStateService#mustBlock$} emite {@code true}.
 * Es un overlay full-screen: oculta el sidebar y el router-outlet para que
 * no se pueda navegar a otras rutas hasta aceptar el contrato.</p>
 *
 * <p>Tras aceptar, llama a {@link CreatorTermsStateService#markAccepted()}
 * para que el layout libere y vuelva al dashboard normal, y luego navega
 * al dashboard home para que las rutas hijas se re-evaluen.</p>
 *
 * <p>Dise&ntilde;ado para ser autonoma del back: si falla la llamada,
 * muestra el error pero no bloquea la navegacion (degradacion).</p>
 */
@Component({
    selector: "ngx-creator-terms-gate",
    templateUrl: "./creator-terms-gate.component.html",
    styleUrls: ["./creator-terms-gate.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [DatePipe, CreatorMarkdownPipe],
})
export class CreatorTermsGateComponent implements OnInit {
  private api = inject(CreatorApiService);
  private termsState = inject(CreatorTermsStateService);
  private router = inject(Router);

  terms: CreatorTermsDto | null = null;
  loading = false;
  errorMessage: string | null = null;
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
        if (!t) {
          this.errorMessage = "No se pudo cargar el contrato. Contacta al administrador.";
        } else if (t.acceptedByCurrentUser) {
          // Edge case: ya estaba aceptado. Liberamos y navegamos al dashboard.
          this.termsState.markAccepted();
          this.router.navigate(["/dashboard-creador/dashboard"]);
        }
      },
      error: (e) => {
        this.loading = false;
        this.terms = null;
        this.errorMessage = this.parseError(e, "No se pudo cargar el contrato vigente.");
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
    this.api.acceptActiveTerms().subscribe({
      next: () => {
        this.accepting = false;
        // Liberamos el gate y navegamos al home.
        this.termsState.markAccepted();
        this.router.navigate(["/dashboard-creador/dashboard"]);
      },
      error: (e) => {
        this.accepting = false;
        this.errorMessage = this.parseError(e, "No se pudo registrar la aceptacion.");
      },
    });
  }

  /**
   * Edge case: el admin quito/reemplazo la version activa despues de la
   * ultima aceptacion y la nueva requiere aceptacion. Refresca el estado.
   */
  refresh(): void {
    this.load();
  }

  private parseError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 0) return "No se pudo conectar al servidor. Verifica tu conexion.";
    if (err?.status === 404) return "Aun no hay una version activa de Terminos y Condiciones.";
    return fallback;
  }
}
