import { CommonModule, DatePipe, DecimalPipe, Location } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbSpinnerModule,
  NbTagModule,
  NbToastrService,
  NbTooltipModule,
} from '@nebular/theme';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  AuditApiService,
  AuditLogDto,
  ReconcileResult,
  ReconciliationApiService,
} from '../../../@core/backend/services/audit.service';
import { PaymentService } from '../../../@core/backend/services/payment.service';
import {
  AbandonedCartDetail,
  PaymentDetail,
} from '../../../@core/interfaces/payments';
import { AuditLabelPipe } from '../audit-label.pipe';

interface PayloadField {
  key: string;
  label: string;
  value: unknown;
}

/**
 * Vista dedicada (route-based) para mostrar el detalle de un audit log.
 * Reemplaza al modal {@code AuditLogDetailDialogComponent} y agrega un panel
 * adicional con datos procesados cuando el log corresponde a la categoria
 * PAYMENT, incluyendo botones para abrir el wizard de venta manual prefilleado.
 */
@Component({
  selector: 'ngx-audit-log-detail-view',
  standalone: true,
  templateUrl: './audit-log-detail-view.component.html',
  styleUrls: ['./audit-log-detail-view.component.scss'],
  imports: [
    CommonModule,
    RouterLink,
    NbCardModule,
    NbButtonModule,
    NbIconModule,
    NbSpinnerModule,
    NbTagModule,
    NbTooltipModule,
    DatePipe,
    DecimalPipe,
    AuditLabelPipe,
  ],
})
export class AuditLogDetailViewComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private api = inject(AuditApiService);
  private reconcileApi = inject(ReconciliationApiService);
  private paymentService = inject(PaymentService);
  private toastr = inject(NbToastrService);
  private destroy$ = new Subject<void>();

  loading = false;
  log: AuditLogDto | null = null;
  notFound = false;

  payloadFields: PayloadField[] = [];
  payloadRaw = '';

  /**
   * Mensaje destacado de la pasarela extraido del propio payload del log.
   * Util cuando el log es GATEWAY_CHARGE_FAILED sin Payment asociado
   * (caso de rechazo sincrono de Culqi: targetId=0).
   */
  logMerchantMessage: {
    message: string;
    outcomeType?: string;
    severity?: string;
  } | null = null;

  related: AuditLogDto[] = [];
  loadingRelated = false;

  // ---- Payment section state ----
  loadingPayment = false;
  paymentDetail: PaymentDetail | null = null;
  paymentNotFound = false;
  showIntent = false;

  // ---- PaymentIntent (categoria PAYMENT con targetTable=payment_intent) ----
  loadingIntent = false;
  intentDetail: AbandonedCartDetail | null = null;
  intentNotFound = false;

  /**
   * orderId extraido del payload del log cuando este es de categoria PAYMENT
   * pero NO tiene un Payment vivo (caso tipico: rechazo sincrono de Culqi con
   * targetId=0). Se usa para habilitar las acciones "Ver payment intent" y
   * "Hacer pago manual" en esos casos.
   */
  fallbackOrderId: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(pm => {
      const idStr = pm.get('id');
      const id = idStr ? Number(idStr) : NaN;
      if (!idStr || Number.isNaN(id)) {
        this.notFound = true;
        return;
      }
      this.loadLog(id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLog(id: number): void {
    this.loading = true;
    this.notFound = false;
    this.log = null;
    this.payloadFields = [];
    this.payloadRaw = '';
    this.related = [];
    this.paymentDetail = null;
    this.paymentNotFound = false;
    this.intentDetail = null;
    this.intentNotFound = false;
    this.fallbackOrderId = null;
    this.showIntent = false;

    this.api.getLog(id).subscribe({
      next: row => {
        this.log = row;
        this.processPayload(row);
        this.loadRelated(row);
        this.loadPaymentContextIfApplies(row);
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        if (err?.status === 404) {
          this.notFound = true;
        } else {
          this.toastr.danger(err?.error?.message || 'No se pudo cargar el log', 'Error');
        }
      },
    });
  }

  private loadRelated(row: AuditLogDto): void {
    if (!row.correlationId) return;
    this.loadingRelated = true;
    this.api.getByCorrelation(row.correlationId, 50).subscribe({
      next: rows => {
        this.related = rows.filter(r => r.id !== row.id);
        this.loadingRelated = false;
      },
      error: () => (this.loadingRelated = false),
    });
  }

  private processPayload(row: AuditLogDto): void {
    this.logMerchantMessage = null;
    if (!row.payload) {
      this.payloadFields = [];
      this.payloadRaw = '';
      return;
    }
    try {
      const parsed = JSON.parse(row.payload);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, unknown>;
        this.payloadFields = Object.keys(obj).map(k => ({
          key: k,
          label: this.prettifyPayloadKey(k),
          value: obj[k],
        }));
        this.payloadRaw = JSON.stringify(parsed, null, 2);
        this.logMerchantMessage = this.extractMerchantFromPayload(obj, row.severity);
      } else {
        this.payloadFields = [];
        this.payloadRaw = JSON.stringify(parsed, null, 2);
      }
    } catch {
      this.payloadFields = [];
      this.payloadRaw = row.payload;
    }
  }

  /**
   * Extrae un mensaje de causa precisa (merchant_message / user_message) del
   * payload del log. Sirve para destacar fallos sincronos de la pasarela
   * (ej. Culqi 4xx: "Fondos insuficientes...") aunque no exista un Payment
   * persistido aun.
   */
  private extractMerchantFromPayload(
    obj: Record<string, unknown>,
    severity: string | null | undefined,
  ): { message: string; outcomeType?: string; severity?: string } | null {
    const pick = (...keys: string[]): string | undefined => {
      for (const k of keys) {
        const v = obj[k];
        if (typeof v === 'string' && v.trim().length > 0) return v;
      }
      return undefined;
    };
    const msg = pick(
      'merchantMessage', 'merchant_message',
      'userMessage', 'user_message',
      'reason', 'errorMessage',
    );
    if (!msg) return null;
    const outcomeType = pick('outcomeType', 'type', 'gatewayCode', 'declineCode');
    return { message: msg, outcomeType, severity: severity || undefined };
  }

  private loadPaymentContextIfApplies(row: AuditLogDto): void {
    const cat = (row.category || '').toUpperCase();
    if (cat !== 'PAYMENT') return;

    const target = (row.targetTable || '').toLowerCase();
    const orderId = this.extractOrderId(row);
    this.fallbackOrderId = orderId;

    if (target === 'payments') {
      if (row.targetId && row.targetId > 0) {
        this.loadPaymentDetail(row.targetId);
      } else {
        // Rechazo sincrono o log legacy: marcado PAYMENT pero sin Payment
        // creado. Mostramos empty state + acciones basadas en el orderId
        // del payload (intent + venta manual desde intent).
        this.paymentNotFound = true;
        if (orderId) {
          this.loadIntentDetail(orderId);
        }
      }
      return;
    }
    if (target === 'payment_intent') {
      if (orderId) {
        this.loadIntentDetail(orderId);
      } else {
        this.intentNotFound = true;
      }
    }
  }

  private extractOrderId(row: AuditLogDto): string | null {
    if (!row.payload) return null;
    try {
      const p = JSON.parse(row.payload) as Record<string, unknown>;
      const oid = p['orderId'] ?? p['intentOrderId'] ?? p['order_id'];
      return typeof oid === 'string' && oid.length > 0 ? oid : null;
    } catch {
      return null;
    }
  }

  private loadPaymentDetail(paymentId: number): void {
    this.loadingPayment = true;
    this.paymentService.getPaymentDetail(paymentId).subscribe({
      next: env => {
        this.paymentDetail = env?.data || null;
        this.paymentNotFound = !this.paymentDetail;
        this.loadingPayment = false;
      },
      error: err => {
        this.loadingPayment = false;
        if (err?.status === 404) {
          this.paymentNotFound = true;
        } else {
          this.toastr.warning(
            err?.error?.message || 'No se pudo cargar el detalle del pago',
            'Aviso',
          );
        }
      },
    });
  }

  private loadIntentDetail(orderId: string): void {
    this.loadingIntent = true;
    this.paymentService.getAbandonedCartDetail(orderId).subscribe({
      next: env => {
        this.intentDetail = env?.data || null;
        this.intentNotFound = !this.intentDetail;
        this.loadingIntent = false;
      },
      error: err => {
        this.loadingIntent = false;
        if (err?.status === 404) {
          this.intentNotFound = true;
        }
      },
    });
  }

  /** Humaniza la key de un campo del payload (camelCase / snake_case → "Title Case"). */
  prettifyPayloadKey(key: string): string {
    if (!key) return key;
    const spaced = key
      .replace(/[_\-]/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
    return spaced
      .split(' ')
      .map(w => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(' ');
  }

  /** Formatea valores escalares para mostrar en la grilla del payload. */
  formatPayloadValue(v: unknown): string {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }

  /** True si el valor es escalar (string/number/boolean/null). */
  isScalar(v: unknown): boolean {
    return v === null || v === undefined
      || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
  }

  severityClass(s: string | null | undefined): string {
    switch ((s || '').toUpperCase()) {
      case 'CRITICAL': return 'sev-critical';
      case 'ERROR': return 'sev-error';
      case 'WARN': return 'sev-warn';
      default: return 'sev-info';
    }
  }

  paymentStatusClass(status: string | null | undefined): string {
    const s = (status || '').toUpperCase();
    if (s === 'PAGADO' || s === 'PAGADO_MANUAL' || s === 'COMPLETED_ADMIN_RECREATION') return 'status-ok';
    if (s === 'PENDIENTE' || s === 'PROCESANDO' || s === 'PROCESSING') return 'status-warn';
    if (!s) return 'status-muted';
    return 'status-danger';
  }

  /**
   * El pago se considera "ya completado" cuando esta en algun estado de exito;
   * el boton "Hacer pago manual" se oculta en esos casos para evitar duplicados.
   */
  canCreateManualFromPayment(): boolean {
    if (!this.paymentDetail) return false;
    const s = (this.paymentDetail.paymentStatus || '').toUpperCase();
    return s !== 'PAGADO' && s !== 'PAGADO_MANUAL' && s !== 'COMPLETED_ADMIN_RECREATION';
  }

  toggleIntent(): void {
    this.showIntent = !this.showIntent;
  }

  goToManualFromPayment(): void {
    if (!this.paymentDetail) return;
    this.router.navigate(['/pages-admin/ventas/registrar'], {
      queryParams: { fromPayment: this.paymentDetail.paymentId },
    });
  }

  goToManualFromIntent(): void {
    if (!this.intentDetail) return;
    this.router.navigate(['/pages-admin/ventas/registrar'], {
      queryParams: { fromIntent: this.intentDetail.orderId },
    });
  }

  /**
   * Acceso al wizard de venta manual cuando solo conocemos el orderId del
   * payload del log (caso de rechazo sincrono donde no hay Payment ni intent
   * cargado en memoria todavia). El wizard hace el prefill via fromIntent.
   */
  goToManualFromFallbackOrderId(): void {
    if (!this.fallbackOrderId) return;
    this.router.navigate(['/pages-admin/ventas/registrar'], {
      queryParams: { fromIntent: this.fallbackOrderId },
    });
  }

  /** True cuando podemos ofrecer acciones admin aun sin Payment vivo. */
  hasFallbackActions(): boolean {
    return !!this.fallbackOrderId
      && (this.paymentNotFound || !this.paymentDetail);
  }

  openRelatedLog(id: number): void {
    this.router.navigate(['/pages-admin/auditoria/log', id]);
  }

  goBack(): void {
    this.location.back();
  }

  copyToClipboard(text: string | null | undefined): void {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      this.toastr.success('Copiado al portapapeles', 'OK');
    } catch {
      this.toastr.warning('No se pudo copiar', 'Aviso');
    }
  }

  isLegacy(): boolean {
    return !!this.log && !this.log.severity && !this.log.timestampTs;
  }

  // ====================================================================
  //  MVP Conciliación: botón "Verificar ahora" + panel side-by-side
  // ====================================================================

  /** Resultado de la última verificación on-demand. */
  reconcileResult: ReconcileResult | null = null;
  reconcileLoading = false;

  /**
   * True si tenemos un payment cargado y podemos invocar
   * {@code POST /admin/payments/{id}/reconcile}. Solo se ofrece cuando hay
   * un Payment efectivamente persistido (paymentId > 0).
   */
  canReconcileNow(): boolean {
    return !!this.paymentDetail && !!this.paymentDetail.paymentId;
  }

  /**
   * Llama al endpoint on-demand de conciliación y guarda el resultado para
   * renderizar el panel comparativo BD vs pasarela.
   */
  reconcileNow(): void {
    if (!this.paymentDetail || !this.paymentDetail.paymentId) return;
    this.reconcileLoading = true;
    this.reconcileResult = null;
    this.reconcileApi.reconcileNow(this.paymentDetail.paymentId).subscribe({
      next: env => {
        this.reconcileResult = env?.data || null;
        this.reconcileLoading = false;
        if (!this.reconcileResult) {
          this.toastr.warning('Verificación sin respuesta', 'Conciliación');
          return;
        }
        const s = this.reconcileResult.status;
        if (s === 'MATCHED') {
          this.toastr.success('BD y pasarela coinciden', 'Conciliación');
        } else if (s === 'DISCREPANCY') {
          this.toastr.danger('Discrepancia detectada — revisar panel', 'Conciliación');
        } else if (s === 'NOT_FOUND') {
          this.toastr.info('La pasarela no tiene el cargo registrado', 'Conciliación');
        } else if (s === 'ERROR') {
          this.toastr.warning('Error al consultar la pasarela', 'Conciliación');
        } else {
          this.toastr.info('Verificación: ' + s, 'Conciliación');
        }
      },
      error: err => {
        this.reconcileLoading = false;
        this.toastr.danger(
          err?.error?.message || 'No se pudo verificar el pago',
          'Conciliación',
        );
      },
    });
  }

  /**
   * Lista de tuplas (campo, valor BD, valor pasarela, descalce?) ya merged
   * para que el template haga una sola fila por campo y resalte mismatches.
   *
   * <p>Normaliza los conceptos entre ambos snapshots: BD y pasarela usan
   * claves distintas para el mismo concepto (BD: {@code status} /
   * {@code expectedAmountCents}, Culqi: {@code outcomeType} /
   * {@code amountCents}, PayPal: {@code validated} / {@code amount}).
   * Las filas canónicas (Estado, Monto, Moneda, Capture ID, Order ID en
   * pasarela) salen primero; cualquier clave residual se anexa al final
   * para no perder información.</p>
   */
  reconcileRows(): Array<{ key: string; local: any; gateway: any; mismatch: boolean }> {
    if (!this.reconcileResult) return [];
    const r = this.reconcileResult;
    const local = r.localSnapshot || {};
    const gateway = r.gatewaySnapshot || {};
    const gw = (r.gateway || '').toUpperCase();

    const rows: Array<{ key: string; local: any; gateway: any; mismatch: boolean }> = [];

    const has = (v: any) => v !== undefined && v !== null && v !== '';
    const push = (
      key: string,
      lv: any,
      gv: any,
      opts?: {
        force?: boolean;
        mismatchFn?: (a: any, b: any) => boolean;
      },
    ): void => {
      if (!opts?.force && !has(lv) && !has(gv)) return;
      const mismatch = opts?.mismatchFn
        ? opts.mismatchFn(lv, gv)
        : has(lv) && has(gv) && String(lv) !== String(gv);
      rows.push({ key, local: lv, gateway: gv, mismatch });
    };

    // Estado: BD usa 'status'; Culqi devuelve 'outcomeType' (venta_exitosa = OK)
    // y PayPal devuelve 'validated' (true = OK). Mismatch si BD no está
    // PROCESSED o si la pasarela no confirma exitoso.
    const localStatus = local['status'];
    const gwStatus = gw === 'CULQI'
      ? gateway['outcomeType']
      : gateway['validated'];
    const statusMismatch = (lv: any, gv: any): boolean => {
      const lvOk = String(lv ?? '').toUpperCase() === 'PROCESSED';
      let gvOk = false;
      if (gw === 'CULQI') {
        gvOk = String(gv ?? '') === 'venta_exitosa';
      } else if (gw === 'PAYPAL') {
        gvOk = gv === true || String(gv ?? '') === 'true';
      } else {
        return String(lv ?? '') !== String(gv ?? '');
      }
      return !(lvOk && gvOk);
    };
    push('Estado', localStatus, gwStatus, { force: true, mismatchFn: statusMismatch });

    // Monto: Culqi usa cents, PayPal usa unidades.
    const localAmt = local['expectedAmountCents'] ?? local['expectedAmount'];
    const gwAmt = gateway['amountCents'] ?? gateway['amount'];
    push('Monto', localAmt, gwAmt, { force: true });

    push('Moneda', local['currency'], gateway['currency'], { force: true });

    // Capture / Charge ID: la pasarela no lo repite en snapshot porque ya lo
    // expone en el campo top-level del result; lo "trasladamos" para que el
    // admin vea ambos lados.
    push('Capture ID', local['captureId'], r.captureId);

    // Order ID en metadata Culqi: si Culqi reporta metadata.orderId distinto
    // al nuestro, es un descalce grave.
    if (gw === 'CULQI') {
      push('Order ID en pasarela', r.orderId, gateway['orderIdMeta']);
    }

    // Cualquier clave residual que no haya entrado en las canónicas se anexa
    // (defensiva: si en futuro agregamos campos al snapshot, no se pierden).
    const consumed = new Set<string>([
      'status', 'expectedAmountCents', 'expectedAmount', 'currency',
      'captureId', 'outcomeType', 'validated', 'amountCents', 'amount',
      'orderIdMeta',
    ]);
    const allKeys = new Set<string>([
      ...Object.keys(local),
      ...Object.keys(gateway),
    ]);
    allKeys.forEach(k => {
      if (consumed.has(k)) return;
      push(k, local[k], gateway[k]);
    });

    return rows;
  }

  reconcileStatusClass(): string {
    if (!this.reconcileResult) return '';
    switch (this.reconcileResult.status) {
      case 'MATCHED':     return 'recon-matched';
      case 'DISCREPANCY': return 'recon-discrepancy';
      case 'NOT_FOUND':   return 'recon-notfound';
      case 'ERROR':       return 'recon-error';
      default:            return 'recon-skipped';
    }
  }
}
