import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { CurrencyPipe, DatePipe, DecimalPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AdminWithdrawalDto, CreatorApiService } from "../../dashboard-creadores/services/creator-api.service";

type StatusFilter = "ALL" | "pending" | "approved" | "paid" | "rejected";

@Component({
    selector: "ngx-admin-creadores-retiros",
    templateUrl: "./retiros.component.html",
    styleUrls: ["./retiros.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CurrencyPipe, DatePipe, DecimalPipe, FormsModule],
})
export class AdminCreadoresRetirosComponent implements OnInit {
  private api = inject(CreatorApiService);

  withdrawals: AdminWithdrawalDto[] = [];
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  processingId: number | null = null;

  statusFilter: StatusFilter = "ALL";
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  // Modal rechazar
  showRejectModal = false;
  rejectId: number | null = null;
  rejectReason = "";
  rejectError: string | null = null;

  // Modal aprobar
  showApproveModal = false;
  approveId: number | null = null;
  approveNotes = "";
  approveError: string | null = null;

  // Modal marcar pagado
  showPaidModal = false;
  paidId: number | null = null;
  receiptNumber = "";
  receiptUrl = "";
  paidError: string | null = null;
  proofImage: File | null = null;
  proofImagePreview: string | null = null;
  readonly MAX_PROOF_IMAGE_BYTES = 5 * 1024 * 1024;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    const status = this.statusFilter === "ALL" ? undefined : this.statusFilter;
    this.api.listAllWithdrawals(status, this.page, this.size).subscribe({
      next: (p) => {
        this.withdrawals = p.content;
        this.totalElements = p.totalElements;
        this.totalPages = p.totalPages;
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.parseError(e, "No se pudieron cargar los retiros.");
        this.loading = false;
      },
    });
  }

  setFilter(f: StatusFilter): void {
    this.statusFilter = f;
    this.page = 0;
    this.load();
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.load();
  }

  // ============ Aprobar ============
  openApprove(w: AdminWithdrawalDto): void {
    if (!w.id) return;
    if (!confirm(`Aprobar el retiro de ${w.userEmail || ('user #' + w.userId)} por S/ ${w.amount}? Pasara a estado 'procesando'.`)) return;
    this.processingId = w.id;
    this.api.approveWithdrawal(w.id).subscribe({
      next: () => {
        this.processingId = null;
        this.successMessage = `Retiro #${w.id} aprobado.`;
        this.load();
        setTimeout(() => (this.successMessage = null), 3500);
      },
      error: (e) => {
        this.processingId = null;
        this.errorMessage = this.parseError(e, "No se pudo aprobar.");
      },
    });
  }

  // ============ Rechazar ============
  openReject(w: AdminWithdrawalDto): void {
    if (!w.id) return;
    this.rejectId = w.id;
    this.rejectReason = "";
    this.rejectError = null;
    this.showRejectModal = true;
  }

  closeReject(): void {
    this.showRejectModal = false;
    this.rejectError = null;
  }

  submitReject(): void {
    if (!this.rejectId) return;
    if (!this.rejectReason || this.rejectReason.trim().length < 5) {
      this.rejectError = "Ingresa un motivo de al menos 5 caracteres.";
      return;
    }
    this.processingId = this.rejectId;
    this.api.rejectWithdrawal(this.rejectId, this.rejectReason.trim()).subscribe({
      next: () => {
        this.processingId = null;
        this.showRejectModal = false;
        this.successMessage = "Retiro rechazado.";
        this.load();
        setTimeout(() => (this.successMessage = null), 3500);
      },
      error: (e) => {
        this.processingId = null;
        this.rejectError = this.parseError(e, "No se pudo rechazar.");
      },
    });
  }

  // ============ Marcar pagado ============
  openPaid(w: AdminWithdrawalDto): void {
    if (!w.id) return;
    this.paidId = w.id;
    this.receiptNumber = "";
    this.receiptUrl = "";
    this.paidError = null;
    this.clearProofImage();
    this.showPaidModal = true;
  }

  closePaid(): void {
    this.showPaidModal = false;
    this.paidError = null;
    this.clearProofImage();
  }

  /**
   * Maneja la seleccion del archivo de imagen del comprobante de pago.
   * Valida que sea una imagen, no exceda 5 MB y genera una preview local.
   */
  onProofImageSelected(event: Event): void {
    this.paidError = null;
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
      this.clearProofImage();
      return;
    }
    if (!file.type.startsWith("image/")) {
      this.paidError = "El comprobante debe ser una imagen (PNG, JPG, WEBP, GIF).";
      input.value = "";
      return;
    }
    if (file.size > this.MAX_PROOF_IMAGE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      this.paidError = `La imagen pesa ${sizeMB} MB (maximo 5 MB).`;
      input.value = "";
      return;
    }
    this.proofImage = file;
    if (this.proofImagePreview) {
      URL.revokeObjectURL(this.proofImagePreview);
    }
    this.proofImagePreview = URL.createObjectURL(file);
  }

  clearProofImage(): void {
    this.proofImage = null;
    if (this.proofImagePreview) {
      URL.revokeObjectURL(this.proofImagePreview);
      this.proofImagePreview = null;
    }
    const input = document.getElementById("paid-proof-image-input") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  submitPaid(): void {
    if (!this.paidId) return;
    if (!this.receiptNumber || this.receiptNumber.trim().length < 2) {
      this.paidError = "Ingresa el numero de recibo / operacion.";
      return;
    }
    this.processingId = this.paidId;
    this.api.markWithdrawalPaid(
      this.paidId,
      this.receiptNumber.trim(),
      this.receiptUrl.trim() || undefined,
      this.proofImage ?? undefined,
    ).subscribe({
      next: () => {
        this.processingId = null;
        this.showPaidModal = false;
        this.clearProofImage();
        this.successMessage = `Retiro #${this.paidId} marcado como pagado.`;
        this.load();
        setTimeout(() => (this.successMessage = null), 3500);
      },
      error: (e) => {
        this.processingId = null;
        this.paidError = this.parseError(e, "No se pudo marcar como pagado.");
      },
    });
  }

  /**
   * Descarga el PDF del "recibo por honorarios" subido por el CREADOR al
   * solicitar este retiro (proxy privado del backend).
   */
  downloadCreatorReceipt(w: AdminWithdrawalDto): void {
    if (!w.id || !w.creatorReceiptFileId) return;
    this.processingId = w.id;
    this.api.downloadCreatorWithdrawalReceipt(w.id).subscribe({
      next: (blob) => {
        this.processingId = null;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = w.creatorReceiptFileName || `recibo_honorarios_${w.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      error: (e) => {
        this.processingId = null;
        this.errorMessage = this.parseError(e, "No se pudo descargar el recibo por honorarios.");
        setTimeout(() => (this.errorMessage = null), 4000);
      },
    });
  }

  statusClass(s: string): string {
    return `pill pill--${(s || "").toLowerCase()}`;
  }
  statusLabel(s: string): string {
    switch (s) {
      case "pending": return "Pendiente";
      case "approved": return "En proceso";
      case "paid": return "Pagado";
      case "rejected": return "Rechazado";
      default: return s;
    }
  }
  methodLabel(m: string): string {
    switch ((m || "").toUpperCase()) {
      case "YAPE": return "Yape";
      case "PLIN": return "Plin";
      case "CARD": return "Tarjeta";
      case "TRANSFER": return "Transferencia";
      case "YAPE 987654321": return "Yape";
      case "PLIN 999888777": return "Plin";
      case "TARJETA": return "Tarjeta";
      case "TRANSFERENCIA": return "Transferencia";
      default: return m;
    }
  }

  /** V38: Icono del metodo de pago para el admin. */
  paymentMethodIcon(m: string): string {
    const u = (m || "").toUpperCase();
    if (u.startsWith("YAPE") || u.startsWith("PLIN")) return "mobile-alt";
    if (u.startsWith("TARJETA") || u.startsWith("CARD")) return "credit-card";
    if (u.startsWith("TRANSFER")) return "university";
    return "money-bill-wave";
  }

  // Mantener compat con el metodo viejo yyyy
  // (legacy code was here; replaced by switch above)

  private parseError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 403) return "No tienes permisos para esta accion.";
    if (err?.status === 0) return "No se pudo conectar al servidor.";
    return fallback;
  }
}