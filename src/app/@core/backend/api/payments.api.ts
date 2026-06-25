import { Injectable, inject } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import {
  AbandonedCartCountEnvelope,
  AbandonedCartCountParams,
  AbandonedCartDetailEnvelope,
  AbandonedCartListEnvelope,
  AbandonedCartListParams,
  AbandonedCartPrefillEnvelope,
  AbandonedCartResendEnvelope,
  GetPaymentPromotor, GetPaymentResponse, ManualPaymentRequest,
  ManualPaymentResponseEnvelope, Orden, Payment,
  PaymentDetailEnvelope,
  PostPayment, PostPaymentResponse, updatePagar,
} from "../../interfaces/payments";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

/**
 * Genera un UUIDv4 RFC 4122-compatible. Usa crypto.randomUUID cuando está
 * disponible (Chrome 92+, Firefox 95+, Safari 15.4+) y cae a un PRNG basado
 * en Math.random como último recurso en navegadores muy antiguos.
 *
 * Este UUID viaja como X-Idempotency-Key en createOrder/createCharge para
 * que el backend (y Culqi) puedan deduplicar reintentos de red sin
 * cobrar dos veces.
 */
function generateIdempotencyKey(): string {
    try {
        const c: any = (typeof crypto !== 'undefined') ? crypto : null;
        if (c && typeof c.randomUUID === 'function') {
            return c.randomUUID();
        }
    } catch (_) {
        // fallthrough
    }
    return 'fe-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}


@Injectable({
    providedIn: 'root'
  })

export class PaymentsApi {
    private api = inject(HttpService);
    private http = inject(HttpClient);


    getPayments(pagina: number, cantElementos: number, sortBy?: string, sortDirection?: string, search?: string, status?: string): Observable<GetPaymentResponse> {
        let url = `api/v1/dashboard/payments?pagina=${pagina}&cantElementos=${cantElementos}`;

        if (sortBy && sortDirection) {
            url += `&sortBy=${sortBy}&sortDirection=${sortDirection}`;
        }
        if (search && search.trim()) {
            url += `&search=${encodeURIComponent(search.trim())}`;
        }
        if (status && status.trim()) {
            url += `&status=${encodeURIComponent(status.trim())}`;
        }

        return this.api.get(url);
    }

    getPaymentsGrouped(pagina: number, cantElementos: number, sortBy?: string, sortDirection?: string, search?: string, status?: string): Observable<GetPaymentResponse> {
        let url = `api/v1/dashboard/payments/grouped?pagina=${pagina}&cantElementos=${cantElementos}`;

        if (sortBy && sortDirection) {
            url += `&sortBy=${sortBy}&sortDirection=${sortDirection}`;
        }
        if (search && search.trim()) {
            url += `&search=${encodeURIComponent(search.trim())}`;
        }
        if (status && status.trim()) {
            url += `&status=${encodeURIComponent(status.trim())}`;
        }

        return this.api.get(url);
    }

    postPayment(payment: PostPayment, idempotencyKey?: string): Observable<PostPaymentResponse> {
        const key = idempotencyKey ?? generateIdempotencyKey();
        return this.api.post('api/v1/payment', payment, {
            headers: new HttpHeaders({ 'X-Idempotency-Key': key })
        });
    }

    postOrder(order: any, idempotencyKey?: string): Observable<any> {
        const key = idempotencyKey ?? generateIdempotencyKey();
        return this.api.post('api/v1/culqi/order', order, {
            headers: new HttpHeaders({ 'X-Idempotency-Key': key })
        });
    }

    postCharge(charge: PostPayment, idempotencyKey?: string): Observable<any> {
        const key = idempotencyKey ?? generateIdempotencyKey();
        return this.api.post('api/v1/culqi/charge', charge, {
            headers: new HttpHeaders({ 'X-Idempotency-Key': key })
        });
    }

    // PayPal server-side create/capture endpoints. La idempotency key del
    // frontend viaja en X-Idempotency-Key; el backend la usa como
    // PayPal-Request-Id ante PayPal para evitar dobles capturas.
    postPaypalCreateOrder(dto: any, idempotencyKey?: string): Observable<any> {
        const key = idempotencyKey ?? generateIdempotencyKey();
        return this.api.post('api/v1/payment/paypal/create-order', dto, {
            headers: new HttpHeaders({ 'X-Idempotency-Key': key })
        });
    }

    postPaypalCapture(orderId: string, idempotencyKey?: string): Observable<any> {
        const key = idempotencyKey ?? generateIdempotencyKey();
        return this.api.post(`api/v1/payment/paypal/capture/${orderId}`, {}, {
            headers: new HttpHeaders({ 'X-Idempotency-Key': key })
        });
    }

    // Exchange rate
    getExchangeRate(): Observable<any> {
        return this.api.get('api/v1/payment/paypal/exchange-rate');
    }

    getPaymentsPromotor(promotorId: string): Observable<GetPaymentPromotor> {
        return this.api.get(`api/v1/dashboard/ventasPromotor/${promotorId}`);
    }

    updatePagar(pagar: updatePagar): Observable<PostPaymentResponse> {
        return this.api.put('api/v1/dashboard/pagar', pagar);
    }

    getPaymentDocuments(paymentId: string): Observable<any> {
        return this.api.get(`api/v1/dashboard/payment/${paymentId}/documents`);
    }

    getMyPurchases(): Observable<any> {
        return this.api.get(`api/v1/payment/mis-compras`);
    }

    adminDownloadDocument(documentId: number): Observable<Blob> {
        return this.http.get(`${environment.apiUrl}/api/v1/dashboard/document/${documentId}/admin-download`, {
            responseType: 'blob'
        });
    }

    // Registra una venta manual (admin) sin pasar por la pasarela.
    // El backend responde con un envelope { result, status, data: PaymentResponse }.
    createManualPayment(request: ManualPaymentRequest): Observable<ManualPaymentResponseEnvelope> {
        return this.api.post('api/v1/admin/payments/manual', request);
    }

    // ===== Carritos abandonados (Fase 2 - admin) =====

    getAbandonedCarts(params: AbandonedCartListParams = {}): Observable<AbandonedCartListEnvelope> {
        const qs: Record<string, string> = {};
        if (params.fromDate) qs['fromDate'] = params.fromDate;
        if (params.toDate) qs['toDate'] = params.toDate;
        if (params.minHoursOld != null) qs['minHoursOld'] = String(params.minHoursOld);
        if (params.onlyGuests != null) qs['onlyGuests'] = String(params.onlyGuests);
        if (params.status) qs['status'] = params.status;
        qs['page'] = String(params.page ?? 0);
        qs['size'] = String(params.size ?? 20);
        const query = new URLSearchParams(qs).toString();
        return this.api.get(`api/v1/admin/payments/abandoned?${query}`);
    }

    getAbandonedCartsCount(params: AbandonedCartCountParams = {}): Observable<AbandonedCartCountEnvelope> {
        const qs: Record<string, string> = {};
        if (params.fromDate) qs['fromDate'] = params.fromDate;
        if (params.toDate) qs['toDate'] = params.toDate;
        const query = new URLSearchParams(qs).toString();
        const suffix = query ? `?${query}` : '';
        return this.api.get(`api/v1/admin/payments/abandoned/count${suffix}`);
    }

    getAbandonedCartDetail(orderId: string): Observable<AbandonedCartDetailEnvelope> {
        return this.api.get(`api/v1/admin/payments/abandoned/${encodeURIComponent(orderId)}`);
    }

    getAbandonedCartPrefill(orderId: string): Observable<AbandonedCartPrefillEnvelope> {
        return this.api.get(`api/v1/admin/payments/abandoned/${encodeURIComponent(orderId)}/convert-prefill`);
    }

    discardAbandonedCart(orderId: string, reason?: string): Observable<any> {
        const qs = reason ? `?reason=${encodeURIComponent(reason)}` : '';
        return this.api.delete(`api/v1/admin/payments/abandoned/${encodeURIComponent(orderId)}${qs}`);
    }

    resendPaymentLink(orderId: string): Observable<AbandonedCartResendEnvelope> {
        return this.api.post(`api/v1/admin/payments/abandoned/${encodeURIComponent(orderId)}/resend-link`, {});
    }

    // ===== Detalle de Payment (consumido por la vista admin de audit log) =====

    getPaymentDetail(paymentId: number): Observable<PaymentDetailEnvelope> {
        return this.api.get(`api/v1/admin/payments/${paymentId}/detail`);
    }

    getManualPrefillFromPayment(paymentId: number): Observable<AbandonedCartPrefillEnvelope> {
        return this.api.get(`api/v1/admin/payments/${paymentId}/manual-prefill`);
    }

    /**
     * V29: fuerza la consulta del desglose de fees contra la pasarela
     * (util para PayPal cuando el capture estaba PENDING).
     */
    refetchGatewayFee(paymentId: number): Observable<any> {
        return this.api.post(`api/v1/admin/payments/${paymentId}/refetch-gateway-fee`, {});
    }
}