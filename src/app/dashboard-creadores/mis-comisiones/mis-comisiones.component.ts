import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, UpperCasePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  CreatorApiService,
  CommissionDto,
  PageResponse,
  CreatorPurchaseSummaryDto,
  WithdrawableCommissionDto,
} from "../services/creator-api.service";

interface BreakdownLine {
  label: string;
  /** Cuando es null, mostramos '-' en la fila. */
  amount: number | null | undefined;
  /** Si true, fila resaltada (comision final). */
  highlight?: boolean;
  /** Sufijo de moneda (PEN por defecto). */
  currency?: string;
  /** Hint secundario en gris. */
  hint?: string;
}

interface CalcLine {
  /** Tipo de linea: base, deduccion, subtotal o final. */
  kind: "base" | "deduction" | "subtotal" | "final";
  label: string;
  amount: number | null | undefined;
  currency?: string;
  hint?: string;
}

interface StatusMeta {
  label: string;
  icon: string;
  description: string;
  withdrawable: boolean;
  locked: boolean;
}

@Component({
    selector: "ngx-creador-mis-comisiones",
    templateUrl: "./mis-comisiones.component.html",
    styleUrls: ["./mis-comisiones.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, DecimalPipe, UpperCasePipe],
})
export class CreadorMisComisionesComponent implements OnInit {
  private api = inject(CreatorApiService);

  commissions: CommissionDto[] = [];
  loading = false;
  errorMessage: string | null = null;

  // Paginacion
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;

  // KPIs
  totalCommissions = 0;
  inWithdrawal = 0;
  confirmed = 0;

  // Modal de detalle
  detailOpen = false;
  detail: CommissionDto | null = null;

  // Resumen de la compra (cargado lazy al abrir el modal)
  purchaseSummary: CreatorPurchaseSummaryDto | null = null;
  purchaseSummaryLoading = false;
  purchaseSummaryError: string | null = null;

  // ===================== V37: Modal de seleccion de comisiones para retiro =====================
  withdrawModalOpen = false;
  withdrawable: WithdrawableCommissionDto[] = [];
  withdrawableLoading = false;
  withdrawableError: string | null = null;
  selectedCommissionIds: Set<number> = new Set();
  withdrawMinimum = 50;
  withdrawCanSubmit = false;
  withdrawSubmitting = false;
  withdrawSubmitError: string | null = null;

  // V37: PDF del "recibo por honorarios" (legalmente requerido en Peru)
  selectedReceipt: File | null = null;
  receiptError: string | null = null;
  /** Tamano maximo permitido (5 MB) consistente con backend. */
  readonly MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

  // V38: selector de metodo de pago + referencia dinamica
  paymentMethods: ('YAPE' | 'PLIN' | 'CARD' | 'TRANSFER')[] =
      ['YAPE', 'PLIN', 'CARD', 'TRANSFER'];
  selectedPaymentMethod: 'YAPE' | 'PLIN' | 'CARD' | 'TRANSFER' = 'YAPE';
  paymentReference = '';
  paymentReferenceError: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api.getMyCommissions(this.page, this.size).subscribe({
      next: (p) => {
        this.commissions = p.content;
        this.totalElements = p.totalElements;
        this.totalPages = p.totalPages;
        this.recalcKpis();
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.parseError(e, "No se pudieron cargar tus comisiones.");
        this.loading = false;
      },
    });
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.load();
  }

  statusClass(s: string): string {
    return `pill pill--${s.toLowerCase()}`;
  }

  statusLabel(s: string): string {
    switch (s) {
      case "confirmed": return "Confirmada";
      case "withdrawal_requested": return "En retiro";
      case "withdrawn": return "Retirada";
      default: return s;
    }
  }

  private STATUS_META: Record<string, StatusMeta> = {
    confirmed: {
      label: "Confirmada",
      icon: "fa-check-circle",
      description: "Lista para retirar. Seleccionala en 'Solicitar retiro'.",
      withdrawable: true,
      locked: false,
    },
    withdrawal_requested: {
      label: "En retiro",
      icon: "fa-hourglass-half",
      description: "Aprobada por el admin, pendiente de pago. Queda bloqueada hasta que se liquide.",
      withdrawable: false,
      locked: true,
    },
    withdrawn: {
      label: "Retirada",
      icon: "fa-money-bill-wave",
      description: "Pagada y liquidada por el admin. No requiere accion.",
      withdrawable: false,
      locked: true,
    },
  };

  statusMeta(s: string): StatusMeta {
    return this.STATUS_META[s] ?? {
      label: s || "Desconocido",
      icon: "fa-question-circle",
      description: "Estado no reconocido.",
      withdrawable: false,
      locked: false,
    };
  }

  statusIcon(s: string): string {
    return this.statusMeta(s).icon;
  }

  statusDescription(s: string): string {
    return this.statusMeta(s).description;
  }

  isWithdrawable(s: string): boolean {
    return this.statusMeta(s).withdrawable;
  }

  isLocked(s: string): boolean {
    return this.statusMeta(s).locked;
  }

  openDetail(c: CommissionDto): void {
    this.detail = c;
    this.detailOpen = true;
    this.purchaseSummary = null;
    this.purchaseSummaryError = null;
    this.loadPurchaseSummary(c);
  }

  closeDetail(): void {
    this.detailOpen = false;
    this.detail = null;
    this.purchaseSummary = null;
    this.purchaseSummaryError = null;
  }

  /**
   * Carga el resumen total de la comision del creador para la venta (paymentId)
   * del documento clickeado, mas el detalle por documento del creador.
   * Si el back devuelve 404 (la venta no contiene lineas del creador),
   * se trata como estado vacio silencioso (informacion privada preservada).
   */
  loadPurchaseSummary(c: CommissionDto): void {
    if (!c.paymentId) {
      this.purchaseSummaryError = "Sin identificador de venta.";
      return;
    }
    this.purchaseSummaryLoading = true;
    this.api.getPurchaseSummary(c.paymentId).subscribe({
      next: (s) => {
        this.purchaseSummary = s;
        this.purchaseSummaryLoading = false;
      },
      error: (e) => {
        // 404 esperado si el creador no tiene lineas en esa venta (caso raro).
        if (e?.status === 404) {
          this.purchaseSummaryError = null;
        } else {
          this.purchaseSummaryError = this.parseError(
            e,
            "No se pudo cargar el resumen de la compra."
          );
        }
        this.purchaseSummaryLoading = false;
      },
    });
  }

  /** Etiqueta humana del metodo de pago. */
  paymentMethodLabel(m?: string | null): string {
    if (!m) return "-";
    if (m.startsWith("MANUAL_")) return "Manual (" + m.substring("MANUAL_".length) + ")";
    return m;
  }

  /** V38: Etiqueta humana del metodo de pago. */
  paymentMethodOptionLabel(m: "YAPE" | "PLIN" | "CARD" | "TRANSFER"): string {
    switch (m) {
      case "YAPE": return "Yape";
      case "PLIN": return "Plin";
      case "CARD": return "Tarjeta";
      case "TRANSFER": return "Transferencia";
    }
  }

  /** V38: Hint corto del metodo. */
  paymentMethodHint(m: "YAPE" | "PLIN" | "CARD" | "TRANSFER"): string {
    switch (m) {
      case "YAPE": return "Celular peruano de 9 digitos";
      case "PLIN": return "Celular peruano de 9 digitos";
      case "CARD": return "Visa / MasterCard / Amex (Luhn)";
      case "TRANSFER": return "CCI 20 digitos o cuenta 10-14";
    }
  }

  /** V38: Etiqueta del campo de referencia segun el metodo. */
  paymentReferenceLabel(m: "YAPE" | "PLIN" | "CARD" | "TRANSFER"): string {
    switch (m) {
      case "YAPE": return "Numero de celular Yape";
      case "PLIN": return "Numero de celular Plin";
      case "CARD": return "Numero de tarjeta";
      case "TRANSFER": return "CCI o numero de cuenta";
    }
  }

  /** V38: Placeholder segun el metodo. */
  paymentReferencePlaceholder(m: "YAPE" | "PLIN" | "CARD" | "TRANSFER"): string {
    switch (m) {
      case "YAPE": return "987654321";
      case "PLIN": return "999888777";
      case "CARD": return "4111 1111 1111 1111";
      case "TRANSFER": return "12345678901234567890 (CCI)";
    }
  }

  /** Helper para mostrar descuentos solo si son > 0 (evita filas ruidosas). */
  hasDiscount(amount?: number | null): boolean {
    return typeof amount === "number" && amount > 0;
  }

  /**
   * Construye el calculo explicito de la comision del creador para este documento.
   * Usa los valores exactos de PaymentLineItem (V31) si estan disponibles:
   *   precio -> descuentos (cupon, plan lector, reforzamiento, situacion)
   *   -> fee pasarela -> base -> comision.
   */
  buildCommissionCalc(c: CommissionDto): CalcLine[] {
    const currency = c.paymentCurrency || "PEN";
    const lines: CalcLine[] = [];

    const price = c.priceOriginal ?? c.documentPrice;
    if (price != null) {
      lines.push({ kind: "base", label: "Precio del documento", amount: price, currency });
    }

    // Descuentos prorateados exactos desde PaymentLineItem (fuente de verdad).
    // Si no hay PaymentLineItem (legacy), fallback a la lista calculada.
    const deductions: Array<{ label: string; amount?: number }> = [];
    if (c.discountCupon != null && c.discountCupon > 0) {
      const codes = (c.discounts || []).filter(d => !!d.couponCode).map(d => d.couponCode).filter(Boolean);
      const codeLabel = codes.length > 0 ? ` (${codes.join(", ")})` : "";
      deductions.push({ label: `Cupon aplicado${codeLabel}`, amount: c.discountCupon });
    }
    if (c.discountPlanLector != null && c.discountPlanLector > 0) {
      deductions.push({ label: "Descuento por Plan Lector", amount: c.discountPlanLector });
    }
    if (c.discountReforzamiento != null && c.discountReforzamiento > 0) {
      deductions.push({ label: "Descuento por Reforzamiento", amount: c.discountReforzamiento });
    }
    if (c.discountSituacion != null && c.discountSituacion > 0) {
      deductions.push({ label: "Descuento por Situacion", amount: c.discountSituacion });
    }
    // Fallback legacy: si no hay campos PaymentLineItem, sumar discounts[].
    if (deductions.length === 0 && c.discounts && c.discounts.length > 0) {
      for (const d of c.discounts) {
        if (d.amount && d.amount > 0) {
          deductions.push({ label: d.label, amount: d.amount });
        }
      }
    }
    for (const d of deductions) {
      lines.push({ kind: "deduction", label: d.label, amount: -(d.amount ?? 0), currency });
    }

    if (c.commissionGatewayFeeShare != null && c.commissionGatewayFeeShare > 0) {
      // Usamos el fee share REAL descontado al calcular la comision
      // (prorrateado por subtotal post-descuentos), no el del PLI.
      lines.push({
        kind: "deduction",
        label: "Fee de pasarela prorrateado",
        amount: -c.commissionGatewayFeeShare,
        currency,
      });
    } else if (c.gatewayFeeShare != null && c.gatewayFeeShare > 0) {
      // Fallback al fee share del PLI si el de la comision no esta disponible
      // (caso legacy o comisiones sin recompute).
      lines.push({
        kind: "deduction",
        label: "Fee de pasarela prorrateado (aprox.)",
        amount: -c.gatewayFeeShare,
        currency,
      });
    }

    // Base REAL usada para la comision (commissionBaseAmount o recalculada).
    // Si basis=NET_AFTER_GATEWAY, esta es (subtotalAfterDiscounts - commissionGatewayFeeShare).
    // Si basis=POST_DISCOUNT, es subtotalAfterDiscounts.
    const base = c.commissionBaseAmount
        ?? c.gatewayProratedAmount
        ?? c.documentNetAmount
        ?? c.subtotalAfterDiscounts
        ?? price;
    if (base != null) {
      lines.push({
        kind: "subtotal",
        label: "Base para tu comision",
        amount: base,
        currency,
      });
    }

    lines.push({
      kind: "final",
      label: "Tu comision",
      amount: c.commissionAmount,
      currency,
      hint: this.impliedRateHint(c),
    });

    return lines;
  }

  /**
   * Tasa implicita de la comision: commissionAmount / base efectiva usada en el calculo.
   *
   * <p>Si el backend envia {@code commissionBaseAmount} (valor REAL calculado por
   * el backend con el fee share prorateado por subtotal post-descuento), se
   * usa ese directamente. Si no, se reconstruye segun la {@code basis}:</p>
   * <ul>
   *   <li>NET_AFTER_GATEWAY: base = postDiscountBase - commissionGatewayFeeShare
   *       (o gatewayFeeShare como fallback).</li>
   *   <li>POST_DISCOUNT: base = postDiscountBase.</li>
   *   <li>NET: base = gatewayProratedAmount.</li>
   *   <li>GROSS: base = priceOriginal.</li>
   * </ul>
   */
  impliedRateHint(c: CommissionDto): string | undefined {
    // Camino preferente: el backend ya envio la base REAL.
    if (c.commissionBaseAmount != null && c.commissionBaseAmount > 0) {
      if (!c.commissionAmount) return undefined;
      const rate = c.commissionAmount / c.commissionBaseAmount;
      if (!isFinite(rate) || isNaN(rate)) return undefined;
      return `Tasa implicita: ${(rate * 100).toFixed(2)}%`;
    }
    // Fallback: reconstruir segun basis.
    const basis = c.basis;
    let denom: number | undefined;
    if (basis === "NET_AFTER_GATEWAY") {
      const post = c.documentNetAmount ?? c.subtotalAfterDiscounts;
      const fee = c.commissionGatewayFeeShare ?? c.gatewayFeeShare ?? 0;
      denom = post != null ? post - fee : undefined;
    } else if (basis === "POST_DISCOUNT") {
      denom = c.documentNetAmount ?? c.subtotalAfterDiscounts;
    } else if (basis === "NET") {
      denom = c.gatewayProratedAmount;
    } else if (basis === "GROSS") {
      denom = c.priceOriginal ?? c.documentPrice;
    } else {
      denom = c.documentNetAmount ?? c.subtotalAfterDiscounts ?? c.gatewayProratedAmount;
    }
    if (!c.commissionAmount || !denom || denom <= 0) return undefined;
    const rate = c.commissionAmount / denom;
    if (!isFinite(rate) || isNaN(rate)) return undefined;
    const pct = (rate * 100).toFixed(2);
    return `Tasa implicita: ${pct}%`;
  }

  private recalcKpis(): void {
    this.totalCommissions = this.commissions.reduce((acc, c) => acc + c.commissionAmount, 0);
    this.confirmed = this.commissions
      .filter(c => c.status === "confirmed")
      .reduce((acc, c) => acc + c.commissionAmount, 0);
    this.inWithdrawal = this.commissions
      .filter(c => c.status === "withdrawal_requested")
      .reduce((acc, c) => acc + c.commissionAmount, 0);
  }

  private parseError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 0) return "No se pudo conectar al servidor.";
    return fallback;
  }

  // ===================== V37: Logica del modal de seleccion =====================

  openWithdrawModal(): void {
    this.withdrawModalOpen = true;
    this.selectedCommissionIds = new Set();
    this.withdrawSubmitError = null;
    this.selectedReceipt = null;
    this.receiptError = null;
    this.loadWithdrawable();
  }

  closeWithdrawModal(): void {
    this.withdrawModalOpen = false;
    this.selectedCommissionIds = new Set();
    this.withdrawSubmitError = null;
    this.selectedReceipt = null;
    this.receiptError = null;
  }

  /**
   * V37: gestiona la seleccion del archivo PDF de "recibo por honorarios".
   * Valida tamano maximo (5MB) y tipo MIME (application/pdf).
   */
  onReceiptSelected(event: Event): void {
    this.receiptError = null;
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
      this.selectedReceipt = null;
      return;
    }
    // Validar tipo MIME
    if (file.type !== "application/pdf") {
      this.receiptError = "El recibo debe ser un archivo PDF.";
      this.selectedReceipt = null;
      input.value = "";
      return;
    }
    // Validar tamano
    if (file.size > this.MAX_RECEIPT_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      this.receiptError = `El archivo pesa ${sizeMB} MB (maximo 5 MB).`;
      this.selectedReceipt = null;
      input.value = "";
      return;
    }
    this.selectedReceipt = file;
  }

  /** Quita el archivo seleccionado del input + estado. */
  clearReceipt(): void {
    this.selectedReceipt = null;
    this.receiptError = null;
    const input = document.getElementById("withdraw-receipt-input") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  loadWithdrawable(): void {
    this.withdrawableLoading = true;
    this.withdrawableError = null;
    this.api.getWithdrawableCommissions().subscribe({
      next: (resp) => {
        this.withdrawable = resp.items;
        this.withdrawMinimum = resp.minimumRequired;
        this.recalcWithdrawCanSubmit();
        this.withdrawableLoading = false;
      },
      error: (err) => {
        this.withdrawableError = this.parseError(err, "No se pudieron cargar las comisiones disponibles.");
        this.withdrawableLoading = false;
      },
    });
  }

  toggleCommission(id: number): void {
    if (this.selectedCommissionIds.has(id)) {
      this.selectedCommissionIds.delete(id);
    } else {
      this.selectedCommissionIds.add(id);
    }
    this.recalcWithdrawCanSubmit();
  }

  isSelected(id: number): boolean {
    return this.selectedCommissionIds.has(id);
  }

  selectAll(): void {
    this.selectedCommissionIds = new Set(this.withdrawable.map(c => c.id));
    this.recalcWithdrawCanSubmit();
  }

  clearSelection(): void {
    this.selectedCommissionIds = new Set();
    this.recalcWithdrawCanSubmit();
  }

  get selectedTotal(): number {
    return this.withdrawable
      .filter(c => this.selectedCommissionIds.has(c.id))
      .reduce((acc, c) => acc + c.commissionAmount, 0);
  }

  get selectedCount(): number {
    return this.selectedCommissionIds.size;
  }

  get amountToMinimum(): number {
    return Math.max(0, this.withdrawMinimum - this.selectedTotal);
  }

  private recalcWithdrawCanSubmit(): void {
    this.withdrawCanSubmit =
      this.selectedCommissionIds.size > 0 && this.selectedTotal >= this.withdrawMinimum;
  }

  // #region agent log
  private dbg(hypothesisId: string, message: string, data: Record<string, any>) {
    fetch('http://127.0.0.1:7685/ingest/5f4ae285-2299-4120-9caf-e9ba0a0c17b4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '886d62' },
      body: JSON.stringify({
        sessionId: '886d62',
        runId: 'front-pre-fix',
        hypothesisId,
        location: 'mis-comisiones.component.ts:dbg',
        message,
        data,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion

  submitWithdrawal(): void {
    // #region agent log
    this.dbg("H1", "submitWithdrawal:entry", {
      withdrawCanSubmit: this.withdrawCanSubmit,
      receiptError: this.receiptError,
      paymentReferenceError: this.paymentReferenceError,
      selectedPaymentMethod: this.selectedPaymentMethod,
      paymentReferenceRaw: this.paymentReference,
      paymentReferenceTrim: (this.paymentReference ?? "").trim(),
      paymentReferenceTrimLen: (this.paymentReference ?? "").trim().length,
      selectedCount: this.selectedCount,
      selectedTotal: this.selectedTotal,
      withdrawMinimum: this.withdrawMinimum,
    });
    // #endregion

    if (!this.withdrawCanSubmit) return;
    if (this.receiptError || this.paymentReferenceError) return;
    this.paymentReferenceError = null;
    if (!this.paymentReference || this.paymentReference.trim().length < 6) {
      // #region agent log
      this.dbg("H2", "submitWithdrawal:paymentReference too short", {
        selectedPaymentMethod: this.selectedPaymentMethod,
        paymentReferenceRaw: this.paymentReference,
        paymentReferenceTrim: (this.paymentReference ?? "").trim(),
        paymentReferenceTrimLen: (this.paymentReference ?? "").trim().length,
      });
      // #endregion
      this.paymentReferenceError = "Ingresa el numero de " +
        ({ YAPE: "celular Yape (9 digitos, ej. 987654321)",
           PLIN: "celular Plin (9 digitos, ej. 987654321)",
           CARD: "tarjeta (13-19 digitos)",
           TRANSFER: "transferencia (CCI 20 digitos o cuenta 10-14)" }[this.selectedPaymentMethod]);
      return;
    }
    this.withdrawSubmitting = true;
    this.withdrawSubmitError = null;
    const commissionIds = Array.from(this.selectedCommissionIds);
    const normalizedPaymentReference = this.paymentReference.trim().replace(/[\s\-().]/g, '');

    // #region agent log
    this.dbg("H3", "submitWithdrawal:before API call", {
      commissionIdsCount: commissionIds.length,
      selectedPaymentMethod: this.selectedPaymentMethod,
      paymentReferenceTrim: this.paymentReference.trim(),
      paymentReferenceNormalized: normalizedPaymentReference,
      paymentReferenceNormalizedLen: normalizedPaymentReference.length,
    });
    // #endregion

    this.api
      .createWithdrawalBySelection(
        {
          commissionIds,
          paymentMethod: this.selectedPaymentMethod,
          paymentReference: normalizedPaymentReference,
        },
        this.selectedReceipt ?? undefined
      )
      .subscribe({
        next: () => {
          this.withdrawSubmitting = false;
          this.closeWithdrawModal();
          this.load();
        },
        error: (err) => {
          // #region agent log
          this.dbg("H4", "submitWithdrawal:API error", {
            status: err?.status,
            message: err?.error?.message ?? err?.message,
          });
          // #endregion
          this.withdrawSubmitting = false;
          this.withdrawSubmitError = this.parseError(
            err,
            "No se pudo crear el retiro. Verifica que las comisiones seleccionadas sigan disponibles."
          );
        },
      });
  }

  /** Tamano formateado para mostrar en UI. */
  formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }
}
