import { Injectable, inject } from "@angular/core";
import {
  AbandonedCartCountEnvelope,
  AbandonedCartCountParams,
  AbandonedCartDetailEnvelope,
  AbandonedCartListEnvelope,
  AbandonedCartListParams,
  AbandonedCartPrefillEnvelope,
  AbandonedCartResendEnvelope,
  GetPaymentPromotor, GetPaymentResponse, ManualPaymentRequest, ManualPaymentResponseEnvelope,
  Payment, PaymentData, PaymentDetailEnvelope, PostPayment, PostPaymentResponse, updatePagar,
} from "../../interfaces/payments";
import { PaymentsApi } from "../api/payments.api";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable({
    providedIn: 'root'
  })

export class PaymentService extends PaymentData {
    private api = inject(PaymentsApi);


    getPayments(pagina: number, cantElementos: number, sortBy?: string, sortDirection?: string, search?: string, status?: string): Observable<GetPaymentResponse> {
        return this.api.getPayments(pagina, cantElementos, sortBy, sortDirection, search, status);
    }

    getPaymentsGrouped(pagina: number, cantElementos: number, sortBy?: string, sortDirection?: string, search?: string, status?: string): Observable<GetPaymentResponse> {
        return this.api.getPaymentsGrouped(pagina, cantElementos, sortBy, sortDirection, search, status);
    }

    postPayment(payment: PostPayment): Observable<PostPaymentResponse> {
        return this.api.postPayment(payment);
    }

    postOrder(order: any, idempotencyKey?: string): Observable<any> {
        return this.api.postOrder(order, idempotencyKey);
    }
    postCharge(charge: PostPayment, idempotencyKey?: string): Observable<any> {
        return this.api.postCharge(charge, idempotencyKey);
    }

    // PayPal server-side create/capture
    postPaypalCreateOrder(dto: any, idempotencyKey?: string): Observable<any> {
        return this.api.postPaypalCreateOrder(dto, idempotencyKey);
    }

    postPaypalCapture(orderId: string, idempotencyKey?: string): Observable<any> {
        return this.api.postPaypalCapture(orderId, idempotencyKey);
    }

    // Exchange rate
    getExchangeRate(): Observable<any> {
        return this.api.getExchangeRate();
    }

    getPaymentsPromotor(promotorId: string): Observable<GetPaymentPromotor> {
        return this.api.getPaymentsPromotor(promotorId);
    }

    updatePagar(pagar: updatePagar): Observable<PostPaymentResponse> {
        return this.api.updatePagar(pagar);
    }

    getPaymentDocuments(paymentId: string): Observable<any> {
        return this.api.getPaymentDocuments(paymentId);
    }

    getMyPurchases(): Observable<any> {
        return this.api.getMyPurchases();
    }

    adminDownloadDocument(documentId: number): Observable<Blob> {
        return this.api.adminDownloadDocument(documentId);
    }

    createManualPayment(request: ManualPaymentRequest): Observable<ManualPaymentResponseEnvelope> {
        return this.api.createManualPayment(request);
    }

    // ===== Carritos abandonados (Fase 2 - admin) =====

    getAbandonedCarts(params: AbandonedCartListParams = {}): Observable<AbandonedCartListEnvelope> {
        return this.api.getAbandonedCarts(params);
    }

    getAbandonedCartsCount(params: AbandonedCartCountParams = {}): Observable<AbandonedCartCountEnvelope> {
        return this.api.getAbandonedCartsCount(params);
    }

    getAbandonedCartDetail(orderId: string): Observable<AbandonedCartDetailEnvelope> {
        return this.api.getAbandonedCartDetail(orderId);
    }

    getAbandonedCartPrefill(orderId: string): Observable<AbandonedCartPrefillEnvelope> {
        return this.api.getAbandonedCartPrefill(orderId);
    }

    discardAbandonedCart(orderId: string, reason?: string): Observable<any> {
        return this.api.discardAbandonedCart(orderId, reason);
    }

    resendPaymentLink(orderId: string): Observable<AbandonedCartResendEnvelope> {
        return this.api.resendPaymentLink(orderId);
    }

    // ===== Detalle de Payment (consumido por la vista admin de audit log) =====

    getPaymentDetail(paymentId: number): Observable<PaymentDetailEnvelope> {
        return this.api.getPaymentDetail(paymentId);
    }

    getManualPrefillFromPayment(paymentId: number): Observable<AbandonedCartPrefillEnvelope> {
        return this.api.getManualPrefillFromPayment(paymentId);
    }
}