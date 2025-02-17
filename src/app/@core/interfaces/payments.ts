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
    userId: string,
    name: string,
    amount: number,
    isSubscription: boolean,
    status: string,
    subscriptionType: string,
    documentIds: number[],
    guestEmail: string,
    email: string,
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

export abstract class PaymentData {
    abstract getPayments(pagina: number, cantElementos: number): Observable<GetPaymentResponse>;
    abstract postPayment(payment: PostPayment): Observable<PostPaymentResponse>;
}
