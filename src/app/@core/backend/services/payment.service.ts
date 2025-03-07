import { Injectable } from "@angular/core";
import { GetPaymentResponse, Payment, PaymentData, PostPayment, PostPaymentResponse } from "../../interfaces/payments";
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

    getPayments(pagina: number, cantElementos: number): Observable<GetPaymentResponse> {
        return this.api.getPayments(pagina, cantElementos);
    }

    postPayment(payment: PostPayment): Observable<PostPaymentResponse> {
        return this.api.postPayment(payment);
    }

    chargePayment(payment: PostPayment): Observable<PostPaymentResponse> {
        return this.api.chargePayment(payment);
    }
}