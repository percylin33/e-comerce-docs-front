import { Injectable } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable } from "rxjs";
import { GetPaymentResponse, Payment, PostPayment, PostPaymentResponse } from "../../interfaces/payments";


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

}