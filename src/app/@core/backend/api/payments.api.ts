import { Injectable } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable } from "rxjs";
import { GetPaymentPromotor, GetPaymentResponse, Orden, Payment, PostPayment, PostPaymentResponse, updatePagar } from "../../interfaces/payments";


@Injectable({
    providedIn: 'root'
  })

export class PaymentsApi {
    constructor(private api: HttpService) {}

    getPayments(pagina: number, cantElementos: number, sortBy?: string, sortDirection?: string): Observable<GetPaymentResponse> {
        let url = `api/v1/dashboard/payments?pagina=${pagina}&cantElementos=${cantElementos}`;
        
        if (sortBy && sortDirection) {
            url += `&sortBy=${sortBy}&sortDirection=${sortDirection}`;
        }
        
        return this.api.get(url);
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

    // PayPal server-side create/capture endpoints
    postPaypalCreateOrder(dto: any): Observable<any> {
        return this.api.post('api/v1/payment/paypal/create-order', dto);
    }

    postPaypalCapture(orderId: string): Observable<any> {
        return this.api.post(`api/v1/payment/paypal/capture/${orderId}`, {});
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

    getMyPurchases(userId: number): Observable<any> {
        return this.api.get(`api/v1/payment/mis-compras?userId=${userId}`);
    }
}