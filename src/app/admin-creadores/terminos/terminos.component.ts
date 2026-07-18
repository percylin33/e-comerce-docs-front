import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  CreatorApiService,
  CreatorTermsAcceptanceDto,
  CreatorTermsDto,
  PageResponse,
  UpsertCreatorTermsRequest,
} from "../../dashboard-creadores/services/creator-api.service";
import { CreatorMarkdownPipe } from "../../dashboard-creadores/pipes/creator-markdown.pipe";

type Mode = "list" | "form" | "view" | "acceptances";

@Component({
    selector: "ngx-admin-creadores-terminos",
    templateUrl: "./terminos.component.html",
    styleUrls: ["./terminos.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [DatePipe, FormsModule, CreatorMarkdownPipe],
})
export class AdminCreadoresTerminosComponent implements OnInit {
  private api = inject(CreatorApiService);

  versions: CreatorTermsDto[] = [];
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  mode: Mode = "list";
  saving = false;
  activating = false;
  formError: string | null = null;

  /** Checkbox del form: activar inmediatamente al crear. */
  setActiveOnCreate = false;

  /** Form fields. */
  editingId: number | null = null;
  form = this.blankForm();

  /** Vista solo-lectura del body. */
  viewing: CreatorTermsDto | null = null;

  /** Aceptaciones de la version seleccionada. */
  selectedVersion: CreatorTermsDto | null = null;
  acceptances: CreatorTermsAcceptanceDto[] = [];
  acceptancesLoading = false;

  ngOnInit(): void {
    this.load();
  }

  // ============ Lista ============

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api.listTerms().subscribe({
      next: (v) => {
        this.versions = v || [];
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.parseError(e, "No se pudo cargar el listado de versiones.");
        this.loading = false;
      },
    });
  }

  // ============ Crear / Editar ============

  openCreate(): void {
    this.editingId = null;
    this.form = this.blankForm();
    this.formError = null;
    this.setActiveOnCreate = false;
    this.mode = "form";
  }

  openEdit(t: CreatorTermsDto): void {
    if (t.status !== "DRAFT") return; // solo DRAFT editable
    this.editingId = t.id!;
    this.form = {
      version: t.version,
      title: t.title,
      body: t.body,
      status: t.status,
      effectiveFrom: t.effectiveFrom,
    };
    this.formError = null;
    this.mode = "form";
  }

  closeForm(): void {
    this.mode = "list";
    this.editingId = null;
    this.formError = null;
  }

  submitForm(): void {
    this.formError = null;
    const fd = this.form;
    if (!fd.version?.trim() || fd.version.length > 32) {
      this.formError = "La version es obligatoria (max 32 caracteres).";
      return;
    }
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
    if (fd.status && !["DRAFT", "ACTIVE"].includes(fd.status)) {
      this.formError = "Status invalido al crear: " + fd.status;
      return;
    }

    this.saving = true;
    const obs = this.editingId != null
      ? this.api.updateTerms(this.editingId, fd)
      : this.api.createTerms(fd);
    obs.subscribe({
      next: (saved) => {
        this.saving = false;
        this.mode = "list";
        this.editingId = null;
        this.successMessage = saved.status === "ACTIVE"
          ? "Version creada y activada. La anterior quedo como SUPERSEDED."
          : (this.editingId ? "Version actualizada." : "Borrador creado.");
        this.load();
        setTimeout(() => (this.successMessage = null), 5000);
      },
      error: (e) => {
        this.saving = false;
        this.formError = this.parseError(e, "No se pudo guardar la version.");
      },
    });
  }

  // ============ Vista (solo lectura) ============

  view(t: CreatorTermsDto): void {
    this.api.getTermsById(t.id!).subscribe({
      next: (full) => {
        this.viewing = full;
        this.mode = "view";
      },
      error: (e) => {
        this.errorMessage = this.parseError(e, "No se pudo cargar la version.");
      },
    });
  }

  closeView(): void {
    this.mode = "list";
    this.viewing = null;
  }

  // ============ Activar ============

  activate(t: CreatorTermsDto): void {
    if (!confirm(
      `Activar la version ${t.version}?\nLa actual ACTIVE quedara como SUPERSEDED.\nLos creadores deberan aceptar la nueva version.`,
    )) return;
    this.activating = true;
    this.api.activateTerms(t.id!).subscribe({
      next: () => {
        this.activating = false;
        this.successMessage = "Version activada.";
        this.load();
        setTimeout(() => (this.successMessage = null), 5000);
      },
      error: (e) => {
        this.activating = false;
        this.errorMessage = this.parseError(e, "No se pudo activar la version.");
      },
    });
  }

  // ============ Aceptaciones ============

  openAcceptances(t: CreatorTermsDto): void {
    this.selectedVersion = t;
    this.acceptances = [];
    this.acceptancesLoading = true;
    this.mode = "acceptances";
    this.api.listTermsAcceptances(t.id!, 0, 100).subscribe({
      next: (page: PageResponse<CreatorTermsAcceptanceDto>) => {
        this.acceptances = page.content || [];
        this.acceptancesLoading = false;
      },
      error: (e) => {
        this.acceptancesLoading = false;
        this.errorMessage = this.parseError(e, "No se pudieron cargar las aceptaciones.");
        this.mode = "list";
      },
    });
  }

  closeAcceptances(): void {
    this.mode = "list";
    this.selectedVersion = null;
    this.acceptances = [];
  }

  // ============ Helpers ============

  private blankForm(): UpsertCreatorTermsRequest {
    return {
      version: "",
      title: "",
      body: "",
      status: "DRAFT",
    };
  }

  private parseError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 403) return "No tienes permisos para esta accion.";
    if (err?.status === 0) return "No se pudo conectar al servidor.";
    return fallback;
  }

  trackById = (_: number, t: CreatorTermsDto) => t.id ?? t.version;
  trackByAcceptanceId = (_: number, a: CreatorTermsAcceptanceDto) => a.id;
}
