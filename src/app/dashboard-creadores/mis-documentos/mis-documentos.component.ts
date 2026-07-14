import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { CurrencyPipe, DatePipe, DecimalPipe } from "@angular/common";
import { Router } from "@angular/router";
import { CreatorApiService, CreatorDocumentDto, DocumentApprovalStatus } from "../services/creator-api.service";

type StatusFilter = "ALL" | DocumentApprovalStatus;

@Component({
    selector: "ngx-creador-mis-documentos",
    templateUrl: "./mis-documentos.component.html",
    styleUrls: ["./mis-documentos.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CurrencyPipe, DatePipe, DecimalPipe],
})
export class CreadorMisDocumentosComponent implements OnInit {
  private api = inject(CreatorApiService);
  private router = inject(Router);

  documents: CreatorDocumentDto[] = [];
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Filtros
  statusFilter: StatusFilter = "ALL";

  ngOnInit(): void {
    this.load();
  }

  // ============ Listado ============
  load(): void {
    this.loading = true;
    this.errorMessage = null;
    const status = this.statusFilter === "ALL" ? undefined : this.statusFilter;
    this.api.listMyDocuments(status, 0, 100).subscribe({
      next: (p) => {
        this.documents = p.content;
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.parseError(e, "No se pudieron cargar tus documentos.");
        this.loading = false;
      },
    });
  }

  setFilter(f: StatusFilter): void {
    this.statusFilter = f;
    this.load();
  }

  statusLabel(s?: DocumentApprovalStatus): string {
    switch (s) {
      case "BORRADOR": return "Borrador";
      case "PENDIENTE_APROBACION": return "En aprobacion";
      case "APROBADO": return "Aprobado";
      case "RECHAZADO": return "Rechazado";
      default: return "-";
    }
  }

  statusClass(s?: DocumentApprovalStatus): string {
    return `status-pill status-pill--${(s || "borrador").toLowerCase()}`;
  }

  // ============ Acciones: ahora navegan al wizard ============
  openCreate(): void {
    this.router.navigate(["/dashboard-creador/mis-documentos/nuevo"]);
  }

  openEdit(doc: CreatorDocumentDto): void {
    if (!doc.id) return;
    this.router.navigate(["/dashboard-creador/mis-documentos", doc.id, "editar"]);
  }

  openDetail(id: number | undefined): void {
    if (id == null) return;
    this.router.navigate(["/dashboard-creador/mis-documentos", id, "detalle"]);
  }

  submit(id: number | undefined): void {
    if (id == null) return;
    this.api.submitDocumentForApproval(id).subscribe({
      next: () => {
        this.successMessage = "Documento enviado a aprobacion.";
        this.load();
        setTimeout(() => (this.successMessage = null), 3500);
      },
      error: (e) => this.errorMessage = this.parseError(e, "No se pudo enviar a aprobacion."),
    });
  }

  delete(id: number | undefined): void {
    if (id == null) return;
    if (!confirm("Eliminar este borrador? Esta accion no se puede deshacer.")) return;
    this.api.deleteDraft(id).subscribe({
      next: () => {
        this.successMessage = "Borrador eliminado.";
        this.load();
        setTimeout(() => (this.successMessage = null), 3500);
      },
      error: (e) => this.errorMessage = this.parseError(e, "No se pudo eliminar el borrador."),
    });
  }

  canEdit(s?: DocumentApprovalStatus): boolean {
    return s === "BORRADOR" || s === "RECHAZADO";
  }
  canSubmit(s?: DocumentApprovalStatus): boolean {
    return s === "BORRADOR" || s === "RECHAZADO";
  }
  canDelete(s?: DocumentApprovalStatus): boolean {
    return s === "BORRADOR";
  }

  private parseError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 403) return "No tienes permisos para esta accion.";
    if (err?.status === 0) return "No se pudo conectar al servidor.";
    return fallback;
  }
}