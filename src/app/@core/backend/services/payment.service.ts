import { Injectable } from "@angular/core";
import { GetPaymentPromotor, GetPaymentResponse, Payment, PaymentData, PostPayment, PostPaymentResponse, updatePagar } from "../../interfaces/payments";
import { PaymentsApi } from "../api/payments.api";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable({
    providedIn: 'root'
  })

export class PaymentService extends PaymentData {
    constructor(private api: PaymentsApi) {
        super();    
    }

    getPayments(pagina: number, cantElementos: number, sortBy?: string, sortDirection?: string): Observable<GetPaymentResponse> {
        return this.api.getPayments(pagina, cantElementos, sortBy, sortDirection);
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
}