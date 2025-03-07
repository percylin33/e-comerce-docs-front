import { Observable } from "rxjs"

export interface PostPaymentResponse {
    result: boolean;
    status: number;
    data: boolean;
    timestamp:string;
  }

  export interface GetPaymentResponse {
    result: boolean;
    status: number;
    data: Payment[];
    timestamp:string;
    pagination: {
        paginaActual: number;
        cantidadDePaginas: number;
        cantidadDeDocumentos: number;
        cantidadElementosPorPagina: number;
      };
  }

  export interface PostPayment {
    token: string;
    orderId: string;
    userId: string,
    name: string,
    amount: number,
    description: string,
    phone: string,
    isSubscription: boolean,
    status: string,
    subscriptionType: string,
    documentIds: number[],
    guestEmail: string,
    email: string,
    codigo: string,
}

export interface Payment {
    paymentId: string,
    userId: string
    email: string,
    firstName: string,
    amount: number,
    paymentDate: string,
    state: string
}

export interface Orden {
    orderId: string;
    currency_code: string;
    confirm: boolean;
    order_number: string;
    userId: string;
    amount: number;
    status: string;
    subscriptionType: string;
    description: string;
    email: string;
    phone: string;
    name: string;
    documentIds: number[];
    guestEmail: string;
    isSubscription: boolean;
    metadata: PostPayment;
}

export abstract class PaymentData {
    abstract getPayments(pagina: number, cantElementos: number): Observable<GetPaymentResponse>;
    abstract postPayment(payment: PostPayment): Observable<PostPaymentResponse>;
    abstract postOrder(order: any): Observable<any>;
    abstract postCharge(charge: PostPayment): Observable<any>;
}
