import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { CurrencyPipe, DatePipe, DecimalPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CreatorApiService, CreatorSummaryDto, UserSearchDto } from "../../dashboard-creadores/services/creator-api.service";

@Component({
    selector: "ngx-admin-creadores-creadores",
    templateUrl: "./creadores.component.html",
    styleUrls: ["./creadores.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CurrencyPipe, DatePipe, DecimalPipe, FormsModule],
})
export class AdminCreadoresCreadoresComponent implements OnInit {
  private api = inject(CreatorApiService);
  private router = inject(Router);

  // Lista de creadores existentes
  creators: CreatorSummaryDto[] = [];
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  processingId: number | null = null;

  // Paginacion lista creadores
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  // Buscar usuarios para asignar rol
  showAssignModal = false;
  searchTerm = "";
  searchResults: UserSearchDto[] = [];
  searching = false;
  selectedUser: UserSearchDto | null = null;
  assignPercent: number | null = null;
  assignError: string | null = null;
  searchDebounce: any;

  // Modal editar % comision
  showPercentModal = false;
  percentCreator: CreatorSummaryDto | null = null;
  newPercent: number = 0;
  percentError: string | null = null;

  // Modal habilitar/deshabilitar (Mejora M1)
  showStatusModal = false;
  statusCreator: CreatorSummaryDto | null = null;
  statusEnabled: boolean = true;
  statusReason = "";
  statusError: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api.listCreators(this.page, this.size).subscribe({
      next: (p) => {
        this.creators = p.content;
        this.totalElements = p.totalElements;
        this.totalPages = p.totalPages;
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.parseError(e, "No se pudieron cargar los creadores.");
        this.loading = false;
      },
    });
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.load();
  }

  // ============ Asignar rol ============
  openAssign(): void {
    this.searchTerm = "";
    this.searchResults = [];
    this.selectedUser = null;
    this.assignPercent = null;
    this.assignError = null;
    this.showAssignModal = true;
  }

  closeAssign(): void {
    this.showAssignModal = false;
    this.assignError = null;
  }

  onSearchChange(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    if (!this.searchTerm || this.searchTerm.trim().length < 2) {
      this.searchResults = [];
      return;
    }
    this.searchDebounce = setTimeout(() => this.runSearch(), 350);
  }

  runSearch(): void {
    this.searching = true;
    this.api.searchUsers(this.searchTerm.trim(), 1, 20).subscribe({
      next: (r) => {
        // Filtrar usuarios que YA son creadores
        const all = r?.data || [];
        this.searchResults = all.filter(u => !this.isCreatorEmail(u.email));
        this.searching = false;
      },
      error: () => (this.searching = false),
    });
  }

  isCreatorEmail(email: string): boolean {
    return this.creators.some(c => c.email === email);
  }

  selectUser(u: UserSearchDto): void {
    this.selectedUser = u;
  }

  submitAssign(): void {
    if (!this.selectedUser) {
      this.assignError = "Selecciona un usuario.";
      return;
    }
    const userId = Number(this.selectedUser.id);
    if (this.assignPercent != null && (this.assignPercent < 0 || this.assignPercent > 100)) {
      this.assignError = "El porcentaje debe estar entre 0 y 100.";
      return;
    }
    this.processingId = userId;
    this.api.assignCreatorRole({ userId, commissionPercent: this.assignPercent ?? undefined }).subscribe({
      next: () => {
        this.processingId = null;
        this.showAssignModal = false;
        this.successMessage = `Asignado rol Creador a ${this.selectedUser!.email}.`;
        this.selectedUser = null;
        this.load();
        setTimeout(() => (this.successMessage = null), 4000);
      },
      error: (e) => {
        this.processingId = null;
        this.assignError = this.parseError(e, "No se pudo asignar el rol.");
      },
    });
  }

  // ============ Quitar rol ============
  remove(c: CreatorSummaryDto): void {
    if (!confirm(`Quitar el rol Creador a ${c.email}? Sus comisiones seguiran registradas pero no podra subir nuevos documentos.`)) return;
    this.processingId = c.id;
    this.api.removeCreatorRole(c.id).subscribe({
      next: () => {
        this.processingId = null;
        this.successMessage = `Rol Creador removido a ${c.email}.`;
        this.load();
        setTimeout(() => (this.successMessage = null), 4000);
      },
      error: (e) => {
        this.processingId = null;
        this.errorMessage = this.parseError(e, "No se pudo quitar el rol.");
      },
    });
  }

  // ============ Editar % ============
  openPercent(c: CreatorSummaryDto): void {
    this.percentCreator = c;
    this.newPercent = c.creatorCommissionPercent ?? 0;
    this.percentError = null;
    this.showPercentModal = true;
  }

  closePercent(): void {
    this.showPercentModal = false;
    this.percentError = null;
  }

  submitPercent(): void {
    if (!this.percentCreator) return;
    if (this.newPercent < 0 || this.newPercent > 100) {
      this.percentError = "El porcentaje debe estar entre 0 y 100.";
      return;
    }
    this.processingId = this.percentCreator.id;
    this.api.updateCreatorPercent(this.percentCreator.id, this.newPercent).subscribe({
      next: () => {
        this.processingId = null;
        this.showPercentModal = false;
        this.successMessage = `Porcentaje actualizado a ${this.newPercent}% para ${this.percentCreator!.email}.`;
        this.load();
        setTimeout(() => (this.successMessage = null), 4000);
      },
      error: (e) => {
        this.processingId = null;
        this.percentError = this.parseError(e, "No se pudo actualizar.");
      },
    });
  }

  clearPercent(): void {
    if (!this.percentCreator) return;
    if (!confirm(`Quitar el override de porcentaje a ${this.percentCreator.email}? Quedara con el % global.`)) return;
    this.processingId = this.percentCreator.id;
    this.api.updateCreatorPercent(this.percentCreator.id, 0).subscribe({
      next: () => {
        this.processingId = null;
        this.showPercentModal = false;
        this.successMessage = "Override eliminado, usara el porcentaje global.";
        this.load();
        setTimeout(() => (this.successMessage = null), 4000);
      },
      error: (e) => {
        this.processingId = null;
        this.errorMessage = this.parseError(e, "No se pudo limpiar.");
      },
    });
  }

  // ============ Habilitar / Deshabilitar (Mejora M1) ============
  openStatus(c: CreatorSummaryDto): void {
    this.statusCreator = c;
    // Si esta activo, la accion sera deshabilitar; si inactivo, habilitar.
    this.statusEnabled = !c.active;
    this.statusReason = "";
    this.statusError = null;
    this.showStatusModal = true;
  }

  closeStatus(): void {
    this.showStatusModal = false;
    this.statusCreator = null;
    this.statusError = null;
  }

  submitStatus(): void {
    if (!this.statusCreator) return;
    // reason obligatorio al deshabilitar
    if (!this.statusEnabled && (!this.statusReason || this.statusReason.trim().length < 5)) {
      this.statusError = "Ingresa un motivo de al menos 5 caracteres.";
      return;
    }
    this.processingId = this.statusCreator.id;
    this.api
      .updateCreatorStatus(this.statusCreator.id, this.statusEnabled, this.statusReason.trim() || undefined)
      .subscribe({
        next: () => {
          this.processingId = null;
          this.showStatusModal = false;
          this.successMessage = this.statusEnabled
            ? `Creador ${this.statusCreator!.email} habilitado.`
            : `Creador ${this.statusCreator!.email} deshabilitado.`;
          this.statusCreator = null;
          this.load();
          setTimeout(() => (this.successMessage = null), 4000);
        },
        error: (e) => {
          this.processingId = null;
          this.statusError = this.parseError(e, "No se pudo cambiar el estado.");
        },
      });
  }

  // ============ Ver documentos del creador ============
  openDocuments(c: CreatorSummaryDto): void {
    this.router.navigate(["/admin-creadores/documentos"], {
      queryParams: { creatorId: c.id },
    });
  }

  private parseError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 403) return "No tienes permisos para esta accion.";
    if (err?.status === 0) return "No se pudo conectar al servidor.";
    return fallback;
  }
}