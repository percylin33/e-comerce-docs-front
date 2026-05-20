import { Injectable, inject } from "@angular/core";
import { GetPaymentPromotor, GetPaymentResponse, Payment, PaymentData, PostPayment, PostPaymentResponse, updatePagar } from "../../interfaces/payments";
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

    postOrder(order: any): Observable<any> {
        return this.api.postOrder(order);
    }
    postCharge(charge: PostPayment): Observable<any> {
        return this.api.postCharge(charge);
    }

    // PayPal server-side create/capture
    postPaypalCreateOrder(dto: any): Observable<any> {
        return this.api.postPaypalCreateOrder(dto);
    }

    postPaypalCapture(orderId: string): Observable<any> {
        return this.api.postPaypalCapture(orderId);
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
}