import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Tipos espejo de los DTOs del backend.
 * Mantener sincronizados con com.carpetadigital.ecommerce.creators.dto.CreatorDtos.
 */

export type DocumentApprovalStatus =
  | 'BORRADOR'
  | 'PENDIENTE_APROBACION'
  | 'APROBADO'
  | 'RECHAZADO';

export interface CreatorDocumentDto {
  id?: number;
  title: string;
  description?: string;
  format: string;
  price: number;
  fileUrlPublic: string;
  fileUrlPrivate?: string;
  coverImageUrl?: string;
  /** Miniatura (thumb) en Firebase. */
  imagenThumbUrlPublic?: string;
  /** PDF preview (puede ser null si el doc no tiene preview). */
  pdfPreviewUrl?: string;
  /** Nombre sugerido del archivo principal. */
  fileNameId?: string;
  numeroDePaginas?: number;
  // Identidad del creador (admin endpoints).
  creatorId?: number;
  creatorEmail?: string;
  creatorName?: string;
  creatorApprovalStatus?: DocumentApprovalStatus;
  creatorRejectionReason?: string;
  creatorApprovedAt?: string;
  creatorApprovedBy?: number;
  priceLocked?: boolean;
  createdAt?: string;
  borradoLogico?: boolean;
  // Jerarquia academica (nombres resueltos por backend).
  gradeId?: number;
  gradeName?: string;
  gradeCode?: string;
  subjectId?: number;
  subjectName?: string;
  subjectCode?: string;
  levelId?: number;
  levelName?: string;
  levelCode?: string;
  categoryId?: number;
  categoryName?: string;
  categoryCode?: string;
  /** Paginas del PDF seleccionadas para el preview (1-based). */
  paginasPreView?: number[];
}

export interface UpsertDocumentRequest {
  title: string;
  description?: string;
  format: string;
  price: number;
  fileUrlPublic: string;
  fileUrlPrivate?: string;
  coverImageUrl?: string;
  numeroDePaginas?: number;
  gradeId?: number;
  subjectId?: number;
}

/**
 * Metadatos para crear/editar un documento del Creador con archivos adjuntos.
 * El archivo principal (PDF/DOCX/XLSX/PPTX/ZIP) y la cover se envian en partes
 * separadas del FormData. Espejo de CreatorDtos.CreatorDocumentForm en el backend.
 */
export interface CreatorDocumentForm {
  title: string;
  description?: string;
  /** pdf, docx, xlsx, pptx, zip */
  format: string;
  price: number;
  numeroDePaginas?: number;
  gradeId?: number;
  subjectId?: number;
  /** Paginas a recortar para el PDF preview (1-based). Opcional. */
  paginasPreView?: number[];
}

export interface DashboardSummaryDto {
  creatorId: number;
  creatorEmail: string;
  documentsTotal: number;
  documentsApproved: number;
  documentsPendingApproval: number;
  documentsRejected: number;
  totalCommissions: number;
  availableBalance: number;
  /** Saldo pendiente de confirmar (commission en estado pending). */
  pendingBalance?: number;
  /** Minimo configurable del backend (default S/ 50). */
  minimumWithdrawal?: number;
  currency?: string;
}

export interface TopDocumentDto {
  documentId: number;
  title: string;
  totalSales: number;
  totalCommission: number;
  coverImageUrl?: string;
}

export interface CommissionDto {
  id: number;
  paymentId?: number;
  documentId?: number;
  documentTitle?: string;
  documentFormat?: string;
  documentPrice?: number;
  /** Alias de netPaidAmount (compatibilidad con UIs existentes). */
  amount?: number;
  /** Monto usado como base. Si basis=NET, equivale a gatewayNetUsed. */
  netPaidAmount?: number;
  commissionAmount: number;
  /** V40: tasa de retencion IGV aplicada al crear la comision (snapshot, % 0-100). */
  igvRetentionRate?: number;
  /** V40: monto de IGV retenido por la plataforma (= commissionAmount * rate / 100). */
  igvRetained?: number;
  /** V40: monto neto que cobra el creador (= commissionAmount - igvRetained). */
  netCommission?: number;
  status: string;
  /** Etiqueta legible (es). */
  statusLabel?: string;
  createdAt: string;

  /** Venta */
  paymentDate?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentCurrency?: string;

  /** Desglose del pago */
  totalDiscount?: number;
  gatewayFeeAmount?: number;
  gatewayNetAmount?: number;

  /** Base del calculo */
  basis?: string;
  gatewayProratedAmount?: number;
  /**
   * Fee de pasarela prorateado por precio original (de payment_line_items).
   * Se muestra en la card "Calculo de tu comision" como dato informativo.
   */
  gatewayFeeShare?: number;
  /**
   * Fee de pasarela REAL descontado de la base al calcular la comision
   * (prorrateado por subtotal post-descuentos, desde commissions).
   * Este es el que se usa para el calculo de la tasa implicita.
   */
  commissionGatewayFeeShare?: number;
  /**
   * Base REAL usada para calcular la comision (= subtotalAfterDiscounts
   * - commissionGatewayFeeShare). Coincide con gatewayProratedAmount
   * cuando basis=NET_AFTER_GATEWAY.
   */
  commissionBaseAmount?: number;

  /** Detalle de descuentos prorrateados a este documento. */
  discounts?: CommissionDiscountLine[];
  /** Base del documento despues de aplicar descuentos prorrateados. */
  documentNetAmount?: number;

  /** Trazabilidad exacta desde payment_line_items (V31). */
  /** Precio original del documento. */
  priceOriginal?: number;
  /** Descuento por cupon prorateado. */
  discountCupon?: number;
  /** Descuento por Plan Lector prorateado. */
  discountPlanLector?: number;
  /** Descuento por Reforzamiento prorateado. */
  discountReforzamiento?: number;
  /** Descuento por Situacion prorateado. */
  discountSituacion?: number;
  /** Precio menos todos los descuentos prorateados. */
  subtotalAfterDiscounts?: number;
}

export interface CommissionDiscountLine {
  type: string;
  label: string;
  amount: number;
  percentage?: number | null;
  couponCode?: string | null;
}

/**
 * Resumen total de la comision del creador sobre UNA compra (Payment).
 * Devuelve el detalle por documento donde el creador es dueno.
 * Los documentos de OTROS creadores del mismo carrito NO aparecen.
 */
export interface CreatorPurchaseSummaryDto {
  paymentId: number;
  /** Suma de comision del creador en todas las lineas de la venta. */
  totalCommissionForCreator: number;
  /** Monto bruto del pago (Payment.amount). */
  totalPaymentAmount: number;
  currency?: string;
  documents: PurchaseDocumentLine[];
}

export interface PurchaseDocumentLine {
  documentId: number;
  documentTitle?: string;
  format?: string;
  /** Precio original del documento en esta venta. */
  priceOriginal?: number;
  /** Descuento prorateado por cupon. */
  discountCupon?: number;
  /** Descuento prorateado por Plan Lector. */
  discountPlanLector?: number;
  /** Descuento prorateado por Reforzamiento. */
  discountReforzamiento?: number;
  /** Descuento prorateado por Situacion Significativa. */
  discountSituacion?: number;
  /** Subtotal despues de aplicar todos los descuentos prorateados. */
  subtotalAfterDiscounts?: number;
  /** Base sobre la que se calculo la comision del creador. */
  postDiscountBase?: number;
  /** Fee de pasarela prorateado a este documento. */
  gatewayFeeShare?: number;
  /**
   * Fee de pasarela REAL descontado de la base al calcular la comision
   * (prorrateado por subtotal post-descuentos, desde commissions).
   */
  commissionGatewayFeeShare?: number;
  /**
   * Base REAL usada para calcular la comision (= subtotalAfterDiscounts
   * - commissionGatewayFeeShare). Coincide con gatewayProratedAmount
   * cuando basis=NET_AFTER_GATEWAY.
   */
  commissionBaseAmount?: number;
  /** Comision del creador para este documento. */
  commissionAmount: number;
  currency?: string;
}

// =====================================================
// V37: Nuevo flujo de retiros por seleccion explicita
// =====================================================

/**
 * Comision disponible para que el creator la seleccione y cobre.
 * Lista devuelta por GET /api/v1/creators/commissions/withdrawable.
 */
export interface WithdrawableCommissionDto {
  id: number;
  paymentId: number;
  documentId: number;
  documentTitle?: string;
  documentFormat?: string;
  commissionAmount: number;
  /** V40: IGV retenido por la plataforma sobre esta comision. */
  igvRetained?: number;
  /** V40: monto neto que cobra el creador (= commissionAmount - igvRetained). */
  netCommission?: number;
  basis?: string;
  currency?: string;
  createdAt?: string;
  paymentDate?: string;
}

export interface WithdrawableListResponse {
  items: WithdrawableCommissionDto[];
  total: number;
  count: number;
  minimumRequired: number;
  canWithdraw: boolean;
}

/**
 * Request para crear un retiro por seleccion explicita (V37).
 * El monto del withdrawal se calcula automaticamente como la suma
 * de las comisiones seleccionadas; no se envia amount.
 */
export type WithdrawalPaymentMethod = "YAPE" | "PLIN" | "CARD" | "TRANSFER";

/**
 * V38: Request V2 del modal de retiro. El creator elige metodo + numero de
 * referencia (celular, tarjeta, CCI, etc) y sube su recibo por honorarios.
 * Se mantiene la compatibilidad con la version anterior via accountDetails.
 */
export interface CreateWithdrawalBySelectionRequest {
  commissionIds: number[];
  paymentMethod?: WithdrawalPaymentMethod;
  paymentReference?: string;
  /** @deprecated */
  method?: string;
  /** @deprecated */
  accountDetails?: string;
}

export interface WithdrawalRequestDto {
  id: number;
  /** V40: monto NETO pagado al creador (= grossAmount - igvRetainedAmount). */
  amount: number;
  /** V40: suma de commission_amount de las comisiones del retiro (auditoria). */
  grossAmount?: number;
  /** V40: suma de igv_retained de las comisiones del retiro (auditoria). */
  igvRetainedAmount?: number;
  method: string;
  accountDetails?: string;
  status: string;
  requestDate?: string;
  adminNotes?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  /** Google Drive file ID del PDF de "recibo por honorarios" subido por el creador. Null si no subio. */
  creatorReceiptFileId?: string;
  /** Nombre original del PDF de recibo por honorarios. */
  creatorReceiptFileName?: string;
  /** Timestamp ISO en que el creador subio el PDF. */
  creatorReceiptUploadedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ============ Admin types ============

export interface CreatorSummaryDto {
  id: number;
  email: string;
  firstname?: string;
  lastname?: string;
  creatorCommissionPercent?: number | null;
  documentsCount: number;
  totalCommissions: number;
  active: boolean;
}

export interface ApprovalSummaryDto {
  id: number;
  title: string;
  format?: string;
  price: number;
  creatorId: number;
  creatorEmail?: string;
  creatorName?: string;
  coverImageUrl?: string;
  /** Miniatura (thumb) en Firebase (puede ser null). */
  imagenThumbUrlPublic?: string;
  /** PDF preview (puede ser null). */
  pdfPreviewUrl?: string;
  /** URL publica del archivo principal (puede ser null). */
  fileUrlPublic?: string;
  /** Nombre sugerido del archivo principal. */
  fileNameId?: string;
  creatorApprovalStatus: DocumentApprovalStatus;
  creatorRejectionReason?: string;
  createdAt?: string;
  priceLocked?: boolean;
}

export interface AdminWithdrawalDto {
  id: number;
  userId?: number;
  userEmail?: string;
  userName?: string;
  amount: number;
  /** V40: suma de commission_amount de las comisiones del retiro (auditoria). */
  grossAmount?: number;
  /** V40: suma de igv_retained de las comisiones del retiro (auditoria). */
  igvRetainedAmount?: number;
  method: string;
  accountDetails?: string;
  status: string;
  requestDate?: string;
  adminNotes?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  /** Google Drive file ID del PDF de "recibo por honorarios" subido por el creador. */
  creatorReceiptFileId?: string;
  /** Nombre original del PDF de recibo por honorarios. */
  creatorReceiptFileName?: string;
  /** Timestamp ISO en que el creador subio el PDF. */
  creatorReceiptUploadedAt?: string;
  /** URL publica de la imagen del comprobante de pago subida por el admin (V39). */
  paymentProofImageUrl?: string;
  /** Nombre original del archivo del comprobante de pago (V39). */
  paymentProofImageFileName?: string;
}

export interface CreatorConfigDto {
  commissionPercent: number;
  withdrawalMinimumPen: number;
  moduleEnabled: boolean;
  auditEnabled: boolean;
}

// ============ Terminos y Condiciones (V39) ============

export interface CreatorTermsDto {
  id: number;
  version: string;
  title: string;
  body: string;
  /** DRAFT | ACTIVE | SUPERSEDED */
  status: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  createdAt?: string;
  createdBy?: number;
  updatedAt?: string;
  updatedBy?: number;
  acceptancesCount?: number;
  acceptedByCurrentUser?: boolean;
  currentUserAcceptedAt?: string;
}

export interface UpsertCreatorTermsRequest {
  version: string;
  title: string;
  body: string;
  status?: string;
  effectiveFrom?: string;
}

export interface CreatorTermsAcceptanceDto {
  id: number;
  userId: number;
  userEmail?: string;
  termsId: number;
  termsVersion: string;
  acceptedAt: string;
  ipAddress?: string;
}

// ============ Politica de Privacidad (V40) ============

export interface CreatorPrivacyPolicyDto {
  id: number;
  title: string;
  body: string;
  version: string;
  effectiveFrom?: string;
  publishedAt?: string;
  updatedAt?: string;
  updatedBy?: number;
}

export interface UpdateCreatorPrivacyPolicyRequest {
  title: string;
  body: string;
  version?: string;
  effectiveFrom?: string;
}

export interface AssignCreatorRequest {
  userId: number;
  commissionPercent?: number;
}

export interface UserSearchDto {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  image?: string;
  country?: string;
  roles?: any[];
}

// ============ Tutoriales del wizard (sidebar) ============

export interface TutorialVideoDto {
  id?: number;
  stepNumber: number;
  displayOrder?: number;
  title: string;
  duration?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  description?: string;
  active?: boolean;
}

export interface UpsertTutorialVideoRequest {
  stepNumber: number;
  displayOrder?: number;
  title: string;
  duration?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  description?: string;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CreatorApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/creators`;

  // ============ Dashboard ============
  getDashboardSummary(): Observable<DashboardSummaryDto> {
    return this.http.get<DashboardSummaryDto>(`${this.base}/dashboard`);
  }

  getMyCommissions(page = 0, size = 20): Observable<PageResponse<CommissionDto>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<PageResponse<CommissionDto>>(`${this.base}/commissions`, { params });
  }

  /**
   * Resumen de la comision total del creador sobre una compra + detalle
   * por documento del creador en esa venta. Usado por el modal de detalle.
   */
  getPurchaseSummary(paymentId: number): Observable<CreatorPurchaseSummaryDto> {
    const params = new HttpParams().set('paymentId', String(paymentId));
    return this.http.get<CreatorPurchaseSummaryDto>(`${this.base}/commissions/summary`, { params });
  }

  getTopDocuments(limit = 5): Observable<TopDocumentDto[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<TopDocumentDto[]>(`${this.base}/top-documents`, { params });
  }

  // ============ Documents ============
  listMyDocuments(status?: DocumentApprovalStatus, page = 0, size = 20): Observable<PageResponse<CreatorDocumentDto>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (status) params = params.set('status', status);
    return this.http.get<PageResponse<CreatorDocumentDto>>(`${this.base}/documents`, { params });
  }

  createDocument(req: UpsertDocumentRequest): Observable<CreatorDocumentDto> {
    return this.http.post<CreatorDocumentDto>(`${this.base}/documents`, req);
  }

  updateDocument(id: number, req: UpsertDocumentRequest): Observable<CreatorDocumentDto> {
    return this.http.put<CreatorDocumentDto>(`${this.base}/documents/${id}`, req);
  }

  /**
   * Obtiene un documento del Creador por id.
   * GET /api/v1/creators/documents/{id}
   * El backend devuelve el DTO completo (incluida la materia cuando
   * corresponde) o 404 si no existe / no pertenece al creador autenticado.
   */
  getDocumentById(id: number): Observable<CreatorDocumentDto> {
    return this.http.get<CreatorDocumentDto>(`${this.base}/documents/${id}`);
  }

  /**
   * Crea un documento del Creador con archivos adjuntos (multipart/form-data).
   * El archivo principal va a Google Drive; la cover opcional a Firebase.
   * Si llega pdfAux (filePdfDelWord para DOCX o preViewFilePdf para ZIP/OTROS),
   * el backend lo usa para generar portada y PDF preview.
   */
  createDocumentWithFiles(
    form: CreatorDocumentForm,
    file: File,
    coverImage?: File,
    filePdfDelWord?: File,
    preViewFilePdf?: File,
  ): Observable<CreatorDocumentDto> {
    const fd = new FormData();
    fd.append('title', form.title);
    if (form.description != null) fd.append('description', form.description);
    fd.append('format', form.format);
    fd.append('price', String(form.price));
    if (form.numeroDePaginas != null) fd.append('numeroDePaginas', String(form.numeroDePaginas));
    if (form.gradeId != null) fd.append('gradeId', String(form.gradeId));
    if (form.subjectId != null) fd.append('subjectId', String(form.subjectId));
    fd.append('file', file, file.name);
    if (coverImage) fd.append('coverImage', coverImage, coverImage.name);
    if (filePdfDelWord) fd.append('filePdfDelWord', filePdfDelWord, filePdfDelWord.name);
    if (preViewFilePdf) fd.append('preViewFilePdf', preViewFilePdf, preViewFilePdf.name);
    if (form.paginasPreView?.length) {
      for (const p of form.paginasPreView) {
        fd.append('paginasPreView', String(p));
      }
    }
    return this.http.post<CreatorDocumentDto>(`${this.base}/documents/with-files`, fd);
  }

  /**
   * Edita un documento del Creador. Todos los archivos son opcionales:
   * - file: reemplaza el archivo principal en Drive.
   * - coverImage: reemplaza la cover (detail + thumb) en Firebase.
   * - filePdfDelWord / preViewFilePdf: regeneran portada y/o PDF preview.
   * - paginasPreView: paginas a recortar (1-based).
   */
  updateDocumentWithFiles(
    id: number,
    form: CreatorDocumentForm,
    file?: File,
    coverImage?: File,
    filePdfDelWord?: File,
    preViewFilePdf?: File,
  ): Observable<CreatorDocumentDto> {
    const fd = new FormData();
    fd.append('title', form.title);
    if (form.description != null) fd.append('description', form.description);
    fd.append('format', form.format);
    fd.append('price', String(form.price));
    if (form.numeroDePaginas != null) fd.append('numeroDePaginas', String(form.numeroDePaginas));
    if (form.gradeId != null) fd.append('gradeId', String(form.gradeId));
    if (form.subjectId != null) fd.append('subjectId', String(form.subjectId));
    if (file) fd.append('file', file, file.name);
    if (coverImage) fd.append('coverImage', coverImage, coverImage.name);
    if (filePdfDelWord) fd.append('filePdfDelWord', filePdfDelWord, filePdfDelWord.name);
    if (preViewFilePdf) fd.append('preViewFilePdf', preViewFilePdf, preViewFilePdf.name);
    if (form.paginasPreView?.length) {
      for (const p of form.paginasPreView) {
        fd.append('paginasPreView', String(p));
      }
    }
    return this.http.put<CreatorDocumentDto>(`${this.base}/documents/${id}/with-files`, fd);
  }

  submitDocumentForApproval(id: number): Observable<CreatorDocumentDto> {
    return this.http.post<CreatorDocumentDto>(`${this.base}/documents/${id}/submit`, {});
  }

  deleteDraft(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/documents/${id}`);
  }

  // ============ Selector visual de paginas (PDF) ============

  /**
   * Devuelve la cantidad total de paginas del PDF fuente del documento.
   * Usado para saber cuantos thumbnails pedir al backend.
   */
  getDocumentPageCount(id: number): Observable<{ documentId: number; pages: number }> {
    return this.http.get<{ documentId: number; pages: number }>(
      `${this.base}/documents/${id}/page-count`,
    );
  }

  /**
   * Construye la URL absoluta del thumbnail de una pagina especifica.
   * El backend soporta ETag/If-None-Match para cache del navegador.
   */
  getPageThumbUrl(id: number, page: number): string {
    return `${this.base}/documents/${id}/page/${page}/thumb`;
  }

  // ============ Withdrawals ============
  listMyWithdrawals(page = 0, size = 50): Observable<PageResponse<WithdrawalRequestDto>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<PageResponse<WithdrawalRequestDto>>(`${this.base}/withdrawals`, { params });
  }

  /**
   * V37: lista las comisiones disponibles (status='confirmed') que el creator
   * puede seleccionar para un retiro.
   */
  getWithdrawableCommissions(): Observable<WithdrawableListResponse> {
    return this.http.get<WithdrawableListResponse>(`${this.base}/commissions/withdrawable`);
  }

  /**
   * V37: crea un withdrawal enviando los ids de las comisiones seleccionadas.
   * El backend calcula el monto como la suma de commissionAmount.
   *
   * <p>El legacy requestWithdrawal(amount-based) fue REMOVIDO en esta version.
   * Todo caller debe usar este metodo con commissionIds[] seleccionados desde
   * GET /commissions/withdrawable.</p>
   *
   * <p><b>FIX 415:</b> usa EXACTAMENTE el mismo patron que
   * {@link #createDocumentWithFiles} (que funciona) — {@code this.http.post}
   * con {@code FormData}. NO seteamos Content-Type (Angular lo omite y el
   * browser pone el boundary). En el back, el
   * {@code MultipartContentTypeRewritingFilter} se encarga del caso raro
   * en que el browser manda {@code application/octet-stream} con body
   * multipart. Ademas el controller ahora usa {@code @RequestParam} (igual
   * que {@code documents/with-files}) en vez de {@code @RequestPart}.</p>
   *
   * @param req incluye commissionIds[] y metodo opcional
   * @param receiptFile PDF del recibo por honorarios (opcional pero recomendado)
   */
  createWithdrawalBySelection(
    req: CreateWithdrawalBySelectionRequest,
    receiptFile?: File
  ): Observable<WithdrawalRequestDto> {
    const fd = new FormData();
    req.commissionIds.forEach(id => fd.append('commissionIds', String(id)));
    // V38: nuevos campos paymentMethod + paymentReference
    if (req.paymentMethod) fd.append('paymentMethod', req.paymentMethod);
    if (req.paymentReference) fd.append('paymentReference', req.paymentReference);
    // Legacy
    if (req.method) fd.append('method', req.method);
    if (req.accountDetails) fd.append('accountDetails', req.accountDetails);
    if (receiptFile) fd.append('receiptFile', receiptFile, receiptFile.name);
    return this.http.post<WithdrawalRequestDto>(`${this.base}/withdrawals`, fd);
  }

  // ============================================================
  //                    A D M I N   M E T H O D S
  // ============================================================
  private adminBase = `${environment.apiUrl}/api/v1/admin/creators`;

  // ----- Aprobaciones (documents) -----
  listPendingDocuments(page = 0, size = 20): Observable<PageResponse<ApprovalSummaryDto>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<PageResponse<ApprovalSummaryDto>>(`${this.adminBase}/documents/pending`, { params });
  }

  /**
   * Lista documentos de creadores (admin). Permite filtrar por creador y/o
   * estado. Si no se envian filtros, devuelve TODOS los documentos de
   * creadores ordenados por createdAt DESC.
   */
  listCreatorDocuments(
    opts: { creatorId?: number; status?: DocumentApprovalStatus; page?: number; size?: number } = {},
  ): Observable<PageResponse<ApprovalSummaryDto>> {
    let params = new HttpParams()
      .set('page', String(opts.page ?? 0))
      .set('size', String(opts.size ?? 20));
    if (opts.creatorId != null) params = params.set('creatorId', String(opts.creatorId));
    if (opts.status) params = params.set('status', opts.status);
    return this.http.get<PageResponse<ApprovalSummaryDto>>(`${this.adminBase}/documents`, { params });
  }

  /** Detalle completo de un documento de creador (admin). */
  getCreatorDocumentById(id: number): Observable<CreatorDocumentDto> {
    return this.http.get<CreatorDocumentDto>(`${this.adminBase}/documents/${id}`);
  }

  /**
   * Descarga como Blob el preview PDF de un documento de creador (admin).
   * Usa el endpoint proxy {@code GET /admin/creators/documents/{id}/inline?kind=preview}
   * para evitar depender de la reescritura client-side de las URLs
   * {@code mediaLink} de Firebase/GCS (esa reescritura producia
   * {@code Invalid HTTP method/URL pair} 400 cuando el path tenia %2F).
   *
   * El front mete el Blob resultante en un {@code URL.createObjectURL()} y lo
   * pasa a un {@code <iframe>} para renderizar el PDF inline.
   */
  getCreatorDocumentPreview(id: number, kind: 'preview' | 'main' | 'thumb' | 'cover' = 'preview'): Observable<Blob> {
    const params = new HttpParams().set('kind', kind);
    return this.http.get(`${this.adminBase}/documents/${id}/inline`, {
      params,
      responseType: 'blob',
    });
  }

  approveDocument(id: number): Observable<CreatorDocumentDto> {
    return this.http.post<CreatorDocumentDto>(`${this.adminBase}/documents/${id}/approve`, {});
  }

  rejectDocument(id: number, reason: string): Observable<CreatorDocumentDto> {
    return this.http.post<CreatorDocumentDto>(`${this.adminBase}/documents/${id}/reject`, { approved: false, reason });
  }

  updateDocumentPrice(id: number, price: number): Observable<CreatorDocumentDto> {
    return this.http.put<CreatorDocumentDto>(`${this.adminBase}/documents/${id}/price`, { price });
  }

  /** Edita titulo/descripcion de un documento de creador (admin). */
  updateDocumentMetadata(id: number, title: string, description: string): Observable<CreatorDocumentDto> {
    return this.http.put<CreatorDocumentDto>(`${this.adminBase}/documents/${id}/metadata`, { title, description });
  }

  // ----- Creadores (users) -----
  listCreators(page = 0, size = 20): Observable<PageResponse<CreatorSummaryDto>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<PageResponse<CreatorSummaryDto>>(`${this.adminBase}/users`, { params });
  }

  getCreator(userId: number): Observable<CreatorSummaryDto> {
    return this.http.get<CreatorSummaryDto>(`${this.adminBase}/users/${userId}`);
  }

  assignCreatorRole(req: AssignCreatorRequest): Observable<CreatorSummaryDto> {
    return this.http.post<CreatorSummaryDto>(`${this.adminBase}/users/assign`, req);
  }

  removeCreatorRole(userId: number): Observable<CreatorSummaryDto> {
    return this.http.post<CreatorSummaryDto>(`${this.adminBase}/users/remove`, { userId });
  }

  updateCreatorPercent(userId: number, percent: number): Observable<CreatorSummaryDto> {
    return this.http.put<CreatorSummaryDto>(`${this.adminBase}/users/${userId}/commission`, { percent });
  }

  /**
   * Habilita o deshabilita a un creador sin quitarle el rol (Mejora M1).
   * PUT /api/v1/admin/creators/users/{userId}/status
   * Body: { enabled: boolean, reason?: string }
   * Solo SUPADMIN puede deshabilitar; ADMIN puede habilitar.
   * reason es obligatorio al deshabilitar.
   */
  updateCreatorStatus(userId: number, enabled: boolean, reason?: string): Observable<CreatorSummaryDto> {
    const body: { enabled: boolean; reason?: string } = { enabled };
    if (!enabled && reason) body.reason = reason;
    return this.http.put<CreatorSummaryDto>(`${this.adminBase}/users/${userId}/status`, body);
  }

  // Buscar usuarios (para asignar rol Creador)
  searchUsers(search: string, page = 1, size = 20): Observable<{ data: UserSearchDto[] }> {
    const params = new HttpParams()
      .set('search', search)
      .set('pagina', String(page))
      .set('cantElementos', String(size));
    return this.http.get<{ data: UserSearchDto[] }>(`${environment.apiUrl}/api/v1/dashboard/searchUser`, { params });
  }

  // ----- Retiros admin -----
  listAllWithdrawals(status?: string, page = 0, size = 20): Observable<PageResponse<AdminWithdrawalDto>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    if (status) params = params.set('status', status);
    return this.http.get<PageResponse<AdminWithdrawalDto>>(`${this.adminBase}/withdrawals`, { params });
  }

  approveWithdrawal(id: number, notes?: string): Observable<AdminWithdrawalDto> {
    return this.http.post<AdminWithdrawalDto>(`${this.adminBase}/withdrawals/${id}/approve`, { notes });
  }

  rejectWithdrawal(id: number, reason: string): Observable<AdminWithdrawalDto> {
    return this.http.post<AdminWithdrawalDto>(`${this.adminBase}/withdrawals/${id}/reject`, { reason });
  }

  markWithdrawalPaid(
    id: number,
    receiptNumber?: string,
    receiptUrl?: string,
    file?: File,
  ): Observable<AdminWithdrawalDto> {
    const form = new FormData();
    if (receiptNumber) form.append('receiptNumber', receiptNumber);
    if (receiptUrl) form.append('receiptUrl', receiptUrl);
    if (file) form.append('file', file, file.name);
    return this.http.post<AdminWithdrawalDto>(`${this.adminBase}/withdrawals/${id}/paid`, form);
  }

  /**
   * Descarga el PDF del "recibo por honorarios" subido por el CREADOR al
   * solicitar el retiro (proxy privado del backend a Google Drive).
   * Devuelve el Blob para que el caller dispare la descarga forzada.
   */
  downloadCreatorWithdrawalReceipt(id: number): Observable<Blob> {
    return this.http.get(`${this.adminBase}/withdrawals/${id}/recibo`, {
      responseType: 'blob',
    });
  }

  /**
   * Descarga el archivo principal de un documento de creador (admin).
   * El backend resuelve el storage (Drive/Firebase) con la service account
   * y devuelve el binario original con Content-Disposition: attachment,
   * por lo que el front NO debe usar URLs directas de Google Drive.
   * Devuelve el Blob para que el caller dispare la descarga forzada.
   */
  downloadCreatorDocumentFile(id: number): Observable<Blob> {
    return this.http.get(`${this.adminBase}/documents/${id}/file`, {
      responseType: 'blob',
    });
  }

  // ----- Config + backfill -----
  getConfig(): Observable<CreatorConfigDto> {
    return this.http.get<CreatorConfigDto>(`${this.adminBase}/config`);
  }

  backfillCommissions(batchSize = 200): Observable<{ created: number; batchSize: number; moduleEnabled: boolean }> {
    const params = new HttpParams().set('batchSize', String(batchSize));
    return this.http.post<{ created: number; batchSize: number; moduleEnabled: boolean }>(
      `${this.adminBase}/commissions/backfill`,
      {},
      { params },
    );
  }

  // ----- Tutoriales del wizard (sidebar) -----
  // Lado admin (CRUD).
  listAllTutorials(): Observable<Record<string, TutorialVideoDto[]>> {
    return this.http.get<Record<string, TutorialVideoDto[]>>(`${this.adminBase}/tutorials`);
  }
  listTutorialsByStep(step: number, includeInactive = true): Observable<TutorialVideoDto[]> {
    const params = new HttpParams().set('includeInactive', String(includeInactive));
    return this.http.get<TutorialVideoDto[]>(
      `${this.adminBase}/tutorials/by-step/${step}`,
      { params },
    );
  }
  createTutorial(req: UpsertTutorialVideoRequest): Observable<TutorialVideoDto> {
    return this.http.post<TutorialVideoDto>(`${this.adminBase}/tutorials`, req);
  }
  updateTutorial(id: number, req: UpsertTutorialVideoRequest): Observable<TutorialVideoDto> {
    return this.http.put<TutorialVideoDto>(`${this.adminBase}/tutorials/${id}`, req);
  }
  deleteTutorial(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminBase}/tutorials/${id}`);
  }
  reactivateTutorial(id: number): Observable<TutorialVideoDto> {
    return this.http.post<TutorialVideoDto>(`${this.adminBase}/tutorials/${id}/reactivate`, {});
  }
  replaceTutorialsForStep(step: number, videos: UpsertTutorialVideoRequest[]): Observable<TutorialVideoDto[]> {
    return this.http.put<TutorialVideoDto[]>(`${this.adminBase}/tutorials/by-step/${step}`, videos);
  }

  // Lado creador (solo lectura, agrupado por paso).
  getMyTutorials(): Observable<Record<string, TutorialVideoDto[]>> {
    return this.http.get<Record<string, TutorialVideoDto[]>>(`${this.base}/tutorials`);
  }
  getMyTutorialsByStep(step: number): Observable<TutorialVideoDto[]> {
    return this.http.get<TutorialVideoDto[]>(`${this.base}/tutorials/step/${step}`);
  }

  // ----- Terminos y Condiciones (V39) -----
  // Lado creador.
  getMyActiveTerms(): Observable<CreatorTermsDto> {
    return this.http.get<CreatorTermsDto>(`${this.base}/terms`);
  }
  acceptActiveTerms(): Observable<{ ok: boolean; acceptance: CreatorTermsAcceptanceDto; message: string }> {
    return this.http.post<{ ok: boolean; acceptance: CreatorTermsAcceptanceDto; message: string }>(
      `${this.base}/terms/accept`,
      {},
    );
  }
  getMyAcceptances(page = 0, size = 20): Observable<PageResponse<CreatorTermsAcceptanceDto>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<PageResponse<CreatorTermsAcceptanceDto>>(
      `${this.base}/terms/my-acceptances`,
      { params },
    );
  }

  // Lado admin (SUPADMIN).
  listTerms(): Observable<CreatorTermsDto[]> {
    return this.http.get<CreatorTermsDto[]>(`${this.adminBase}/terms`);
  }
  getActiveTerms(): Observable<CreatorTermsDto> {
    return this.http.get<CreatorTermsDto>(`${this.adminBase}/terms/active`);
  }
  getTermsById(id: number): Observable<CreatorTermsDto> {
    return this.http.get<CreatorTermsDto>(`${this.adminBase}/terms/${id}`);
  }
  createTerms(req: UpsertCreatorTermsRequest): Observable<CreatorTermsDto> {
    return this.http.post<CreatorTermsDto>(`${this.adminBase}/terms`, req);
  }
  updateTerms(id: number, req: UpsertCreatorTermsRequest): Observable<CreatorTermsDto> {
    return this.http.put<CreatorTermsDto>(`${this.adminBase}/terms/${id}`, req);
  }
  activateTerms(id: number): Observable<CreatorTermsDto> {
    return this.http.post<CreatorTermsDto>(`${this.adminBase}/terms/${id}/activate`, {});
  }
  listTermsAcceptances(termsId: number, page = 0, size = 50): Observable<PageResponse<CreatorTermsAcceptanceDto>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<PageResponse<CreatorTermsAcceptanceDto>>(
      `${this.adminBase}/terms/${termsId}/acceptances`,
      { params },
    );
  }

  // ----- Politica de Privacidad (V40) -----
  getMyPrivacy(): Observable<CreatorPrivacyPolicyDto> {
    return this.http.get<CreatorPrivacyPolicyDto>(`${this.base}/privacy`);
  }
  getAdminPrivacy(): Observable<CreatorPrivacyPolicyDto> {
    return this.http.get<CreatorPrivacyPolicyDto>(`${this.adminBase}/privacy`);
  }
  saveAdminPrivacy(req: UpdateCreatorPrivacyPolicyRequest): Observable<CreatorPrivacyPolicyDto> {
    return this.http.put<CreatorPrivacyPolicyDto>(`${this.adminBase}/privacy`, req);
  }
}