import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { CurrencyPipe, DecimalPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CreatorApiService, CreatorConfigDto } from "../../dashboard-creadores/services/creator-api.service";

@Component({
    selector: "ngx-admin-creadores-config",
    templateUrl: "./config.component.html",
    styleUrls: ["./config.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CurrencyPipe, DecimalPipe, FormsModule],
})
export class AdminCreadoresConfigComponent implements OnInit {
  private api = inject(CreatorApiService);

  config: CreatorConfigDto | null = null;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Backfill
  backfillBatchSize = 200;
  backfillRunning = false;
  backfillResult: { created: number; batchSize: number } | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api.getConfig().subscribe({
      next: (c) => {
        this.config = c;
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.parseError(e, "No se pudo cargar la configuracion.");
        this.loading = false;
      },
    });
  }

  runBackfill(): void {
    if (this.backfillBatchSize < 1 || this.backfillBatchSize > 5000) {
      this.errorMessage = "El batch size debe estar entre 1 y 5000.";
      return;
    }
    if (!confirm(`Ejecutar backfill de comisiones con batch=${this.backfillBatchSize}? Puede tomar unos segundos.`)) return;
    this.backfillRunning = true;
    this.errorMessage = null;
    this.backfillResult = null;
    this.api.backfillCommissions(this.backfillBatchSize).subscribe({
      next: (r) => {
        this.backfillRunning = false;
        this.backfillResult = { created: r.created, batchSize: r.batchSize };
        this.successMessage = `Backfill completo. ${r.created} comisiones creadas.`;
        setTimeout(() => (this.successMessage = null), 5000);
      },
      error: (e) => {
        this.backfillRunning = false;
        this.errorMessage = this.parseError(e, "No se pudo ejecutar el backfill.");
      },
    });
  }

  private parseError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 403) return "No tienes permisos para esta accion.";
    if (err?.status === 0) return "No se pudo conectar al servidor.";
    return fallback;
  }
}