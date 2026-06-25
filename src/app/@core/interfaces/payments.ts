import { Observable } from "rxjs"

// ===== NUEVAS INTERFACES (compatibles con PaymentResponseDto y DownloadInfoDto del backend) =====

export interface DownloadInfo {
  documentId: number;
  url: string | null;
  title: string;
  isKit: boolean;
  numberOfPages: number;
  documents: DownloadInfo[] | null; // Estructura anidada para kits
}

export interface PaymentResponse {
  paymentId: number;
  paymentDate: string;
  amount: number;
  userEmail: string;
  phone: string;
  paymentMethod: string;
  downloads: DownloadInfo[];
}

// ===== INTERFACES ANTERIORES =====

export interface PostPaymentResponse {
    result: boolean;
    status: number;
    data: boolean;
    timestamp:string;
  }

export interface GetExchangeRateResponse {
  result: boolean;
  status: number;
  data: number; // PEN per USD
  timestamp: string;
}

  export interface GetPaymentPromotor {
    result: boolean;
    status: number;
    data: DataPaymentPromotor;
    timestamp:string;
  }

  export interface DataPaymentPromotor {
    idPayment: string;
    totalRecaudado: Number;
    paymentDate: string;
    totalDeuda: Number;
    ventas: Ventas[];
    status: string;

  }
  export interface Ventas{
    amount: number,
    paidPromotor: boolean,
    name: string,
    idPayment: string,
    paymentDate: string,
    status: string
  }

  export interface updatePagar {
    id: string;
    totalPagar: number;
  }

  export interface GetPaymentResponse {
    result: boolean;
    status: number;
    data: Payment[];
    timestamp:string;
    pagination: {
        paginaActual: number;
        cantidadDePaginas: number;
        cantidadDeDocumentos: number;
        cantidadElementosPorPagina: number;
      };
  }

  export interface PostPayment {
    token: string;
    orderId: string;
    userId: string,
    name: string,
    firstName: string,
    lastName: string,
    amount: number,
    description: string,
    phone: string,
    isSubscription: boolean,
    status: string,
    subscriptionType: string,
    documentIds: number[],
    /**
     * P3-1: el checkout exige usuario autenticado, por lo que este campo
     * sólo se conserva para no romper consumidores antiguos. El backend
     * lo ignora cuando el JWT trae usuario válido.
     */
    guestEmail?: string,
    email: string,
    codigo: string,
    transactionType: string,
    idPayment?: string,
    // Campos para validación de descuentos en el backend
    subtotalOriginal?: number,
    totalSituationDiscounts?: number,
    totalReforzamientoDiscounts?: number,
    totalPlanLectorDiscounts?: number,
    totalAutomaticDiscounts?: number,
    // ID único del UnitSchedule seleccionado (identifica unidad+año sin ambigüedad)
    unitScheduleId?: number,
}

export interface Payment {
    paymentId: string,
    userId: string
    email: string,
    firstName: string,
  amount: number | string,
    paymentDate: string,
    state: string
    phone: string,
  isSubscription?: boolean,
  documentsCount?: number,
  orderId?: string,
  /**
   * Metodo de pago. Para pasarela puede ser null o el nombre del gateway.
   * Para ventas manuales toma valores MANUAL_* (CASH, TRANSFER, YAPE, PLIN,
   * DEPOSIT, OTHER) y se usa para mostrar un chip "Manual" en el listado.
   */
  paymentMethod?: string | null,
}

export interface PaymentGroup {
  subscriptionId: string | null;
  head: Payment;
  children: Payment[];
  count: number;
  totalAmount?: number;
}

/** Item from GET /dashboard/payments/grouped */
export interface GroupedPaymentItem extends Partial<PaymentGroup> {
  type: 'subscription' | 'payment';
  paymentId?: string;
  userId?: string;
  email?: string;
  firstName?: string;
  amount?: number | string;
  paymentDate?: string;
  state?: string;
  phone?: string;
  isSubscription?: boolean;
  documentsCount?: number;
  orderId?: string;
  paymentMethod?: string | null;
}

export interface Orden {
    orderId: string;
    currency_code: string;
    confirm: boolean;
    order_number: string;
    userId: string;
    amount: number;
    status: string;
    subscriptionType: string;
    description: string;
    email: string;
    phone: string;
    name: string;
    documentIds: number[];
    guestEmail: string;
    isSubscription: boolean;
    metadata: PostPayment;
}

// ===== VENTAS MANUALES (registradas por administradores sin pasarela) =====

export type ManualPaymentMethod =
  | 'MANUAL_CASH'
  | 'MANUAL_TRANSFER'
  | 'MANUAL_YAPE'
  | 'MANUAL_PLIN'
  | 'MANUAL_DEPOSIT'
  | 'MANUAL_OTHER';

export interface ManualPaymentRequest {
  // Cliente
  userId?: number | null;
  guestEmail?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;

  // Productos
  documentIds: number[];
  codigo?: string;

  // Pago externo
  paymentMethod: ManualPaymentMethod;
  paymentReference?: string;
  amountOverride?: number | null;

  // Auditoria
  adminReason: string;

  /**
   * Si la venta manual se origina al convertir un carrito abandonado, se envia
   * aqui el orderId del PaymentIntent para que el backend lo enlace.
   */
  sourceIntentOrderId?: string;
}

// ===== CARRITOS ABANDONADOS (Fase 2 - admin) =====

export interface AbandonedCartItem {
  id: number;
  title: string;
  price: number;
  materia?: string;
  nivel?: string;
  category?: string;
  isKit?: boolean;
  thumbUrl?: string;
  missing?: boolean;
}

export interface AbandonedCartSummary {
  orderId: string;
  createdAt: string;
  ageHours: number;
  status: string;
  customerType: 'REGISTERED' | 'GUEST' | string;
  userId?: number | null;
  email?: string;
  name?: string;
  phone?: string;
  expectedAmount?: number | string;
  currency?: string;
  itemsCount: number;
  itemsSummary: string[];
  couponCode?: string;
  lastReminderSentAt?: string | null;
  reminderCount?: number;
}

export interface AbandonedCartDetail {
  orderId: string;
  createdAt: string;
  ageHours: number;
  status: string;
  customerType: 'REGISTERED' | 'GUEST' | string;
  userId?: number | null;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  items: AbandonedCartItem[];
  expectedAmount?: number | string;
  currency?: string;
  couponCode?: string;
  gateway?: string;
  lastReminderSentAt?: string | null;
  reminderCount?: number;
  convertedPaymentId?: number | null;
  rawPayload?: string;
}

export interface AbandonedCartListResponse {
  data: AbandonedCartSummary[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface AbandonedCartListEnvelope {
  result: boolean;
  status: number;
  data: AbandonedCartListResponse;
  timestamp?: string;
}

export interface AbandonedCartDetailEnvelope {
  result: boolean;
  status: number;
  data: AbandonedCartDetail;
  timestamp?: string;
}

export interface AbandonedCartCountEnvelope {
  result: boolean;
  status: number;
  data: { count: number };
  timestamp?: string;
}

export interface AbandonedCartPrefillEnvelope {
  result: boolean;
  status: number;
  data: ManualPaymentRequest;
  timestamp?: string;
}

export interface AbandonedCartResendResponse {
  orderId: string;
  sentTo: string;
  reminderCount: number;
  maxReminders: number;
  lastReminderSentAt: string;
  resumeUrl: string;
}

export interface AbandonedCartResendEnvelope {
  result: boolean;
  status: number;
  data: AbandonedCartResendResponse;
  timestamp?: string;
}

export interface AbandonedCartListParams {
  fromDate?: string;       // ISO yyyy-mm-dd
  toDate?: string;
  minHoursOld?: number;
  onlyGuests?: boolean;
  status?: string;
  page?: number;
  size?: number;
}

export interface AbandonedCartCountParams {
  fromDate?: string;       // ISO yyyy-mm-dd
  toDate?: string;
}

export interface ManualPaymentResponseEnvelope {
  result: boolean;
  status: number;
  data: PaymentResponse;
  timestamp?: string;
}

// ===== Detalle de Payment para la vista admin de audit log =====

export interface PaymentDetailDocument {
  id: number;
  title: string;
  format?: string;
  price?: number;
}

export interface PaymentDetailDiscount {
  id: number;
  discountType?: string;
  discountCategory?: string;
  originalAmount?: number | string;
  discountPercentage?: number | string;
  discountAmount?: number | string;
  finalAmount?: number | string;
  couponCode?: string;
}

export interface PaymentDetailIntent {
  orderId: string;
  status?: string;
  gateway?: string;
  expectedAmount?: number;
  currency?: string;
  captureId?: string;
  processedAt?: string;
  processedByEventId?: string;
  createdAt?: string;
  lastReminderSentAt?: string | null;
  reminderCount?: number;
  discardedAt?: string | null;
  convertedPaymentId?: number | null;
}

export interface PaymentGatewayMessage {
  message?: string;
  outcomeType?: string;
  sourceAction?: string;
  severity?: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | string;
  occurredAt?: string;
  auditLogId?: number;
}

export interface PaymentGatewayEvent {
  auditLogId: number;
  action: string;
  severity?: string;
  outcomeType?: string;
  merchantMessage?: string;
  occurredAt?: string;
}

export interface PaymentDetail {
  paymentId: number;
  orderId?: string;
  paymentStatus?: string;
  amount?: number;
  currency?: string;
  paymentDate?: string;
  fechaVencimiento?: string;
  isSubscription?: boolean | null;
  subscriptionId?: number | null;

  userId?: number | null;
  userEmail?: string;
  userFullName?: string;
  phone?: string;

  paymentMethod?: string;
  paymentReference?: string;
  manualReason?: string;
  manualCreatedByAdminId?: number | null;

  payPalAmount?: number | null;
  payPalCurrency?: string;
  exchangeRate?: number | null;

  idPromotor?: string;
  paidPromotor?: boolean | null;

  intent?: PaymentDetailIntent | null;
  documents: PaymentDetailDocument[];
  discounts: PaymentDetailDiscount[];
  couponCode?: string;
  couponDiscountAmount?: number | string | null;

  /**
   * Mensaje devuelto por la pasarela (campo merchant_message de Culqi o
   * equivalente). Construido en el backend a partir del audit_log mas
   * reciente con merchantMessage vinculado al orderId del payment.
   */
  gatewayMessage?: PaymentGatewayMessage | null;

  /** Historial de eventos de pasarela (mas reciente primero). */
  gatewayEvents?: PaymentGatewayEvent[];

  // === V29: Desglose de fees de la pasarela (Culqi / PayPal) ===
  /**
   * Snapshot del desglose gross/fee/IGV/net que devolvio la pasarela.
   * Null si aun no se obtuvo (ej. PayPal capture PENDING). El admin
   * puede forzar la consulta con el endpoint
   * POST /admin/payments/{id}/refetch-gateway-fee.
   */
  gatewayFeeBreakdown?: GatewayFeeBreakdown | null;

  /** Comisiones de creadores vinculadas a este Payment (una por documento). */
  creatorCommissions?: CreatorCommissionSummary[];
}

/**
 * Desglose de fees devuelto por la pasarela (Culqi/PayPal).
 * Los campos son numeros planos (no BigDecimal) porque Angular JSON los
 * recibe como number; el formateo a moneda se hace en la UI.
 */
export interface GatewayFeeBreakdown {
  /** Monto bruto que pago el cliente. */
  grossAmount?: number | null;
  /** Comision de la pasarela sin IGV. */
  feeAmount?: number | null;
  /** IGV aplicado a la comision (cuando aplique). */
  feeTaxesIgv?: number | null;
  /** Monto neto que llega a la cuenta del ecommerce (base de comision NET). */
  netAmount?: number | null;
  /** Moneda (PEN, USD). */
  currency?: string | null;
  /** Origen del dato: CHARGE_RESPONSE | CAPTURE_GET | WEBHOOK. */
  source?: string | null;
  /** Cuando se persistio este desglose por primera vez. */
  fetchedAt?: string | null;
  /** JSON crudo completo (fee_details de Culqi o seller_receivable_breakdown de PayPal). */
  detailsJson?: string | null;
}

/**
 * Comision de un creador para un documento especifico del pago.
 * V30: incluye trazabilidad de la base usada (NET o GROSS) y del fee
 * prorateado que se desconto.
 */
export interface CreatorCommissionSummary {
  commissionId?: number;
  creatorId?: number | null;
  creatorEmail?: string | null;
  documentId?: number | null;
  documentTitle?: string | null;
  /** Base usada para calcular la comision (prorrateada por documento). */
  proratedAmount?: number | string | null;
  /** Base de calculo: GROSS (legacy) o NET (post-fees pasarela). */
  basis?: 'GROSS' | 'NET' | string | null;
  /** Monto neto de pasarela usado como base (null si basis=GROSS). */
  gatewayNetUsed?: number | string | null;
  /** Parte proporcional del fee asignado a este documento. */
  gatewayFeeShare?: number | string | null;
  /** Comision final del creador. */
  commissionAmount?: number | string | null;
  /** True si fue recalculada al llegar el neto async de PayPal. */
  feeRecomputed?: boolean | null;
  feeRecomputedAt?: string | null;
}

export interface PaymentDetailEnvelope {
  result: boolean;
  status: number;
  data: PaymentDetail;
  timestamp?: string;
}

export abstract class PaymentData {
    abstract getPayments(pagina: number, cantElementos: number): Observable<GetPaymentResponse>;
    abstract postPayment(payment: PostPayment): Observable<PostPaymentResponse>;
    abstract postOrder(order: any, idempotencyKey?: string): Observable<any>;
    abstract postCharge(charge: PostPayment, idempotencyKey?: string): Observable<any>;
    abstract getPaymentsPromotor(promotorId: string): Observable<GetPaymentPromotor>;
    abstract updatePagar(pagar: updatePagar): Observable<PostPaymentResponse>;
  // PayPal server-side create/capture
  abstract postPaypalCreateOrder(dto: any, idempotencyKey?: string): Observable<any>;
  abstract postPaypalCapture(orderId: string, idempotencyKey?: string): Observable<any>;
  // Get current PEN per USD exchange rate from backend
  abstract getExchangeRate(): Observable<GetExchangeRateResponse>;
  abstract getMyPurchases(userId: number): Observable<any>;
  // Venta manual (admin)
  abstract createManualPayment(request: ManualPaymentRequest): Observable<ManualPaymentResponseEnvelope>;

  // Carritos abandonados (admin) - Fase 2
  abstract getAbandonedCarts(params?: AbandonedCartListParams): Observable<AbandonedCartListEnvelope>;
  abstract getAbandonedCartsCount(params?: AbandonedCartCountParams): Observable<AbandonedCartCountEnvelope>;
  abstract getAbandonedCartDetail(orderId: string): Observable<AbandonedCartDetailEnvelope>;
  abstract getAbandonedCartPrefill(orderId: string): Observable<AbandonedCartPrefillEnvelope>;
  abstract discardAbandonedCart(orderId: string, reason?: string): Observable<any>;
  abstract resendPaymentLink(orderId: string): Observable<AbandonedCartResendEnvelope>;
}
