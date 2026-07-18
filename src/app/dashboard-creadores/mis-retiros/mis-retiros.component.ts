import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { CurrencyPipe, DatePipe, DecimalPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { CreatorApiService, DashboardSummaryDto, WithdrawalRequestDto } from "../services/creator-api.service";

@Component({
    selector: "ngx-creador-mis-retiros",
    templateUrl: "./mis-retiros.component.html",
    styleUrls: ["./mis-retiros.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CurrencyPipe, DatePipe, DecimalPipe, FormsModule],
})
export class CreadorMisRetirosComponent implements OnInit {
  private api = inject(CreatorApiService);
  private router = inject(Router);

  withdrawals: WithdrawalRequestDto[] = [];
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Saldo disponible del dashboard (para mostrarlo destacado en el header).
  availableBalance: number | null = null;
  minimumWithdrawal: number | null = null;

  // Constante minima usada en la UI cuando el backend no devuelve minimumWithdrawal.
  readonly minWithdrawal = 50;

  ngOnInit(): void {
    this.load();
    this.loadSummary();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api.listMyWithdrawals(0, 50).subscribe({
      next: (page) => {
        this.withdrawals = page.content || [];
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.parseError(e, "No se pudieron cargar tus solicitudes.");
        this.loading = false;
      },
    });
  }

  /**
   * Carga el resumen del dashboard para mostrar el saldo disponible y el
   * minimo de retiro configurado por el backend.
   */
  loadSummary(): void {
    this.api.getDashboardSummary().subscribe({
      next: (s: DashboardSummaryDto) => {
        this.availableBalance = s.availableBalance ?? null;
        if (s.minimumWithdrawal != null) {
          this.minimumWithdrawal = s.minimumWithdrawal;
        }
      },
      error: () => {
        this.availableBalance = null;
      },
    });
  }

  /**
   * V37: redirige al nuevo flujo de seleccion explicita de comisiones
   * implementado en {@link ./mis-comisiones/mis-comisiones.component.ts}.
   *
   * <p>El legacy modal de monto arbitrario + recibo fue removido porque
   * (a) el backend ahora rechaza requests sin {@code commissionIds[]} y
   * (b) el modelo de seleccion explicita es trazable 1:1 con cada comision
   * cobrada.</p>
   */
  goToRequest(): void {
    this.router.navigate(["/dashboard-creador/mis-comisiones"]);
  }

  statusClass(s: string): string {
    return `pill pill--${s.toLowerCase()}`;
  }
  statusLabel(s: string): string {
    switch (s) {
      case "pending": return "Pendiente";
      case "processing": return "En proceso";
      case "paid": return "Pagado";
      case "rejected": return "Rechazado";
      default: return s;
    }
  }

  methodLabel(m: string): string {
    switch (m) {
      case "yape": return "Yape";
      case "plin": return "Plin";
      case "transfer": return "Transferencia";
      case "YAPE": return "Yape";
      case "PLIN": return "Plin";
      default: return m;
    }
  }

  /** V40: tooltip con el desglose bruto / IGV / neto para retiros con retencion. */
  withdrawalBreakdownTooltip(w: WithdrawalRequestDto): string {
    const gross = w.grossAmount ?? w.amount;
    const igv = w.igvRetainedAmount ?? 0;
    const net = w.amount;
    return `Bruto S/ ${gross.toFixed(2)} - IGV S/ ${igv.toFixed(2)} = Neto S/ ${net.toFixed(2)}`;
  }

  private parseError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 0) return "No se pudo conectar al servidor.";
    return fallback;
  }
}