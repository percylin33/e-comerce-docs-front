import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { CurrencyPipe, DatePipe, DecimalPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { CreatorApiService, DashboardSummaryDto, TopDocumentDto } from "../services/creator-api.service";

@Component({
    selector: "ngx-creador-dashboard",
    templateUrl: "./dashboard.component.html",
    styleUrls: ["./dashboard.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CurrencyPipe,
        DatePipe,
        DecimalPipe,
        RouterLink,
    ],
})
export class CreadorDashboardComponent implements OnInit {
  private api = inject(CreatorApiService);

  summary: DashboardSummaryDto | null = null;
  topDocuments: TopDocumentDto[] = [];
  loading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.errorMessage = null;

    // Cargar resumen y top docs en paralelo
    this.api.getDashboardSummary().subscribe({
      next: (s) => (this.summary = s),
      error: (e) => {
        this.errorMessage = this.parseError(e, "No se pudo cargar el resumen.");
        this.loading = false;
      },
    });

    this.api.getTopDocuments(5).subscribe({
      next: (t) => (this.topDocuments = t),
      error: () => {/* silencioso: el top es secundario */},
    });

    // pequeña espera artificial para que el spinner no parpadee
    setTimeout(() => (this.loading = false), 400);
  }

  get statusBreakdown(): Array<{ key: string; label: string; value: number; color: string }> {
    if (!this.summary) return [];
    return [
      { key: "approved", label: "Aprobados", value: this.summary.documentsApproved, color: "#00d68f" },
      { key: "pending", label: "En aprobacion", value: this.summary.documentsPendingApproval, color: "#ffaa00" },
      { key: "rejected", label: "Rechazados", value: this.summary.documentsRejected, color: "#ff3d71" },
    ];
  }

  private parseError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 403) return "No tienes permisos para ver el panel de Creador.";
    if (err?.status === 0) return "No se pudo conectar al servidor.";
    return fallback;
  }
}