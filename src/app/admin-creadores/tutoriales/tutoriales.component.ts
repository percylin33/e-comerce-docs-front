import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CreatorApiService, TutorialVideoDto, UpsertTutorialVideoRequest } from "../../dashboard-creadores/services/creator-api.service";

interface StepGroup {
  step: number;
  title: string;
  description: string;
  videos: TutorialVideoDto[];
}

@Component({
    selector: "ngx-admin-creadores-tutoriales",
    templateUrl: "./tutoriales.component.html",
    styleUrls: ["./tutoriales.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [FormsModule],
})
export class AdminCreadoresTutorialesComponent implements OnInit {
  private api = inject(CreatorApiService);

  stepGroups: StepGroup[] = [];
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  /** Modal de edicion / creacion. */
  showForm = false;
  editingId: number | null = null;
  formData: UpsertTutorialVideoRequest = this.blankForm();
  formError: string | null = null;

  /** Paso actualmente visible (para scroll en mobile). */
  activeStep: number | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api.listAllTutorials().subscribe({
      next: (grouped) => {
        this.stepGroups = STEP_META.map(meta => ({
          step: meta.step,
          title: meta.title,
          description: meta.description,
          videos: ((grouped[String(meta.step)] || grouped[meta.step as any] || []) as TutorialVideoDto[])
            .slice()
            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
        }));
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.parseError(e, "No se pudieron cargar los tutoriales.");
        this.loading = false;
      },
    });
  }

  // ============ Crear ============
  openCreate(step: number): void {
    this.editingId = null;
    this.formData = this.blankForm(step);
    this.formError = null;
    this.showForm = true;
  }

  // ============ Editar ============
  openEdit(t: TutorialVideoDto): void {
    this.editingId = t.id ?? null;
    this.formData = {
      stepNumber: t.stepNumber,
      displayOrder: t.displayOrder ?? 0,
      title: t.title || "",
      duration: t.duration || "",
      thumbnailUrl: t.thumbnailUrl || "",
      videoUrl: t.videoUrl || "",
      description: t.description || "",
      active: t.active ?? true,
    };
    this.formError = null;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.formError = null;
  }

  submitForm(): void {
    this.formError = null;
    const fd = this.formData;
    if (!fd.title?.trim()) {
      this.formError = "El titulo es obligatorio.";
      return;
    }
    if (!fd.videoUrl?.trim()) {
      this.formError = "La URL del video es obligatoria.";
      return;
    }
    if (fd.stepNumber == null || fd.stepNumber < 1 || fd.stepNumber > 4) {
      this.formError = "Paso invalido (1 a 4).";
      return;
    }
    this.saving = true;
    const obs = this.editingId != null
      ? this.api.updateTutorial(this.editingId, fd)
      : this.api.createTutorial(fd);
    obs.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.editingId = null;
        this.successMessage = this.editingId != null
          ? "Tutorial actualizado."
          : "Tutorial creado.";
        this.load();
        setTimeout(() => (this.successMessage = null), 4000);
      },
      error: (e) => {
        this.saving = false;
        this.formError = this.parseError(e, "No se pudo guardar el tutorial.");
      },
    });
  }

  // ============ Eliminar (soft) ============
  remove(t: TutorialVideoDto): void {
    if (t.id == null) return;
    if (!confirm(`Quitar el tutorial "${t.title}" del paso ${t.stepNumber}? El Creador dejara de verlo en el sidebar.`)) return;
    this.saving = true;
    this.api.deleteTutorial(t.id).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = "Tutorial quitado del wizard.";
        this.load();
        setTimeout(() => (this.successMessage = null), 4000);
      },
      error: (e) => {
        this.saving = false;
        this.errorMessage = this.parseError(e, "No se pudo quitar el tutorial.");
      },
    });
  }

  // ============ Reactivar ============
  reactivate(t: TutorialVideoDto): void {
    if (t.id == null) return;
    this.saving = true;
    this.api.reactivateTutorial(t.id).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = "Tutorial reactivado.";
        this.load();
        setTimeout(() => (this.successMessage = null), 4000);
      },
      error: (e) => {
        this.saving = false;
        this.errorMessage = this.parseError(e, "No se pudo reactivar el tutorial.");
      },
    });
  }

  // ============ Reordenar (swap con el vecino) ============
  move(t: TutorialVideoDto, direction: -1 | 1): void {
    if (t.id == null) return;
    const group = this.stepGroups.find(g => g.step === t.stepNumber);
    if (!group) return;
    const sorted = group.videos.slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const idx = sorted.findIndex(x => x.id === t.id);
    const target = idx + direction;
    if (target < 0 || target >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[target];
    const orderA = a.displayOrder ?? idx;
    const orderB = b.displayOrder ?? target;
    // Swap displayOrder y persistir uno a uno.
    this.saving = true;
    this.api.updateTutorial(a.id!, { ...a, displayOrder: orderB }).subscribe({
      next: () => {
        this.api.updateTutorial(b.id!, { ...b, displayOrder: orderA }).subscribe({
          next: () => {
            this.saving = false;
            this.load();
          },
          error: (e) => {
            this.saving = false;
            this.errorMessage = this.parseError(e, "No se pudo reordenar.");
          },
        });
      },
      error: (e) => {
        this.saving = false;
        this.errorMessage = this.parseError(e, "No se pudo reordenar.");
      },
    });
  }

  canMoveUp(t: TutorialVideoDto): boolean {
    const group = this.stepGroups.find(g => g.step === t.stepNumber);
    if (!group) return false;
    const sorted = group.videos.slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    return sorted.findIndex(x => x.id === t.id) > 0;
  }
  canMoveDown(t: TutorialVideoDto): boolean {
    const group = this.stepGroups.find(g => g.step === t.stepNumber);
    if (!group) return false;
    const sorted = group.videos.slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    return sorted.findIndex(x => x.id === t.id) < sorted.length - 1;
  }

  trackById = (_: number, t: TutorialVideoDto) => t.id ?? t.title;
  trackByStep = (_: number, g: StepGroup) => g.step;

  scrollTo(step: number): void {
    this.activeStep = step;
    if (typeof document === 'undefined') return;
    const el = document.getElementById('step-' + step);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private blankForm(step = 1): UpsertTutorialVideoRequest {
    return {
      stepNumber: step,
      displayOrder: 0,
      title: "",
      duration: "",
      thumbnailUrl: "",
      videoUrl: "",
      description: "",
      active: true,
    };
  }

  private parseError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 403) return "No tienes permisos para esta accion.";
    if (err?.status === 0) return "No se pudo conectar al servidor.";
    return fallback;
  }
}

const STEP_META: { step: number; title: string; description: string }[] = [
  { step: 1, title: "Paso 1 - Datos basicos", description: "Titulo, descripcion, formato, precio y paginas." },
  { step: 2, title: "Paso 2 - Jerarquia academica", description: "Categoria, nivel, materia y grado." },
  { step: 3, title: "Paso 3 - Archivos y portada", description: "Subida del archivo principal, portada y PDF preview." },
  { step: 4, title: "Paso 4 - Aprobacion", description: "Envio a revision y feedback del admin." },
];
