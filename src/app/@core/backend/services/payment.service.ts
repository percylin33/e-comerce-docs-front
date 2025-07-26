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

    getPayments(pagina: number, cantElementos: number): Observable<GetPaymentResponse> {
        return this.api.getPayments(pagina, cantElementos);
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

    getPaymentsPromotor(promotorId: string): Observable<GetPaymentPromotor> {
        return this.api.getPaymentsPromotor(promotorId);
    }

    updatePagar(pagar: updatePagar): Observable<PostPaymentResponse> {
        return this.api.updatePagar(pagar);
    }
}