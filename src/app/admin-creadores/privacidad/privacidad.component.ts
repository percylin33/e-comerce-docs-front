import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  CreatorApiService,
  CreatorPrivacyPolicyDto,
  UpdateCreatorPrivacyPolicyRequest,
} from "../../dashboard-creadores/services/creator-api.service";
import { CreatorMarkdownPipe } from "../../dashboard-creadores/pipes/creator-markdown.pipe";

type Mode = "view" | "form";

@Component({
    selector: "ngx-admin-creadores-privacidad",
    templateUrl: "./privacidad.component.html",
    styleUrls: ["./privacidad.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [DatePipe, FormsModule, CreatorMarkdownPipe],
})
export class AdminCreadoresPrivacidadComponent implements OnInit {
  private api = inject(CreatorApiService);

  privacy: CreatorPrivacyPolicyDto | null = null;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  formError: string | null = null;

  mode: Mode = "view";
  form: UpdateCreatorPrivacyPolicyRequest = this.blankForm();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api.getAdminPrivacy().subscribe({
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

  openEdit(): void {
    if (!this.privacy) return;
    this.form = {
      title: this.privacy.title,
      body: this.privacy.body,
      version: this.privacy.version,
      effectiveFrom: this.privacy.effectiveFrom,
    };
    this.formError = null;
    this.mode = "form";
  }

  closeForm(): void {
    this.mode = "view";
    this.formError = null;
  }

  submitForm(): void {
    this.formError = null;
    const fd = this.form;
    if (!fd.title?.trim() || fd.title.length > 200) {
      this.formError = "El titulo es obligatorio (max 200 caracteres).";
      return;
    }
    if (!fd.body || fd.body.length < 200) {
      this.formError = "El cuerpo debe tener al menos 200 caracteres.";
      return;
    }
    if (fd.body.length > 200_000) {
      this.formError = "El cuerpo excede 200,000 caracteres.";
      return;
    }

    this.saving = true;
    this.api.saveAdminPrivacy(fd).subscribe({
      next: (saved) => {
        this.saving = false;
        this.privacy = saved;
        this.mode = "view";
        this.successMessage = "Politica de Privacidad actualizada.";
        setTimeout(() => (this.successMessage = null), 5000);
      },
      error: (e) => {
        this.saving = false;
        this.formError = this.parseError(e, "No se pudo guardar la Politica.");
      },
    });
  }

  private blankForm(): UpdateCreatorPrivacyPolicyRequest {
    return { title: "", body: "", version: "", effectiveFrom: undefined };
  }

  private parseError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 403) return "No tienes permisos para esta accion.";
    if (err?.status === 0) return "No se pudo conectar al servidor.";
    return fallback;
  }
}
