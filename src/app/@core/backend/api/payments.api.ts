import { Injectable } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable } from "rxjs";
import { GetPaymentPromotor, GetPaymentResponse, Orden, Payment, PostPayment, PostPaymentResponse, updatePagar } from "../../interfaces/payments";


@Injectable({
    providedIn: 'root'
  })

export class PaymentsApi {
    constructor(private api: HttpService) {}

    getPayments(pagina: number, cantElementos: number): Observable<GetPaymentResponse> {
        return this.api.get(`api/v1/dashboard/payments?pagina=${pagina}&cantElementos=${cantElementos}`);
    }

    postPayment(payment: PostPayment): Observable<PostPaymentResponse> {
        return this.api.post('api/v1/payment', payment);
    }

    postOrder(order: any): Observable<any> {
        return this.api.post('api/v1/culqi/order', order);
    }

    postCharge(charge: PostPayment): Observable<any> {
        return this.api.post('api/v1/culqi/charge', charge);
    }

    getPaymentsPromotor(promotorId: string): Observable<GetPaymentPromotor> {
        return this.api.get(`api/v1/dashboard/ventasPromotor/${promotorId}`);
    }

    updatePagar(pagar: updatePagar): Observable<PostPaymentResponse> {
        return this.api.put('api/v1/dashboard/pagar', pagar);
    }

}