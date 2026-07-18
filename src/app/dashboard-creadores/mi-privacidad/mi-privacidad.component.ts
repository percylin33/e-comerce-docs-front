import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { DatePipe } from "@angular/common";
import { CreatorApiService, CreatorPrivacyPolicyDto } from "../services/creator-api.service";
import { CreatorMarkdownPipe } from "../pipes/creator-markdown.pipe";

@Component({
    selector: "ngx-creador-mi-privacidad",
    templateUrl: "./mi-privacidad.component.html",
    styleUrls: ["./mi-privacidad.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [DatePipe, CreatorMarkdownPipe],
})
export class CreadorMiPrivacidadComponent implements OnInit {
  private api = inject(CreatorApiService);

  privacy: CreatorPrivacyPolicyDto | null = null;
  loading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api.getMyPrivacy().subscribe({
      next: (p) => {
        this.privacy = p;
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.parseError(e, "No se pudo cargar la Politica de Privacidad.");
        this.loading = false;
      },
    });
  }

  private parseError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 0) return "No se pudo conectar al servidor.";
    if (err?.status === 404) return "Aun no hay una Politica de Privacidad configurada. Contacta al administrador.";
    return fallback;
  }
}
