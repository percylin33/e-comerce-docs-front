import { Observable } from "rxjs"

export interface PostPaymentResponse {
    result: boolean;
    status: number;
    data: boolean;
    timestamp:string;
  }

export interface GetExchangeRateResponse {
  result: boolean;
  status: number;
  data: number; // PEN per USD
  timestamp: string;
}

  export interface GetPaymentPromotor {
    result: boolean;
    status: number;
    data: DataPaymentPromotor;
    timestamp:string;
  }

  export interface DataPaymentPromotor {
    idPayment: string;
    totalRecaudado: Number;
    paymentDate: string;
    totalDeuda: Number;
    ventas: Ventas[];
    status: string;

  }
  export interface Ventas{
    amount: number,
    paidPromotor: boolean,
    name: string,
    idPayment: string,
    paymentDate: string,
    status: string
  }

  export interface updatePagar {
    id: string;
    totalPagar: number;
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
    firstName: string,
    lastName: string,
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
    transactionType: string,
    idPayment?: string,
    // Campos para validación de descuentos en el backend
    subtotalOriginal?: number,
    totalSituationDiscounts?: number,
    totalReforzamientoDiscounts?: number,
    totalPlanLectorDiscounts?: number,
    totalAutomaticDiscounts?: number,
    // Campo para indicar la unidad del cronograma seleccionado en suscripciones
    unidadNumero?: number,
}

export interface Payment {
    paymentId: string,
    userId: string
    email: string,
    firstName: string,
    amount: number,
    paymentDate: string,
    state: string
    phone: string,
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
    abstract getPaymentsPromotor(promotorId: string): Observable<GetPaymentPromotor>;
    abstract updatePagar(pagar: updatePagar): Observable<PostPaymentResponse>;
  // PayPal server-side create/capture
  abstract postPaypalCreateOrder(dto: any): Observable<any>;
  abstract postPaypalCapture(orderId: string): Observable<any>;
  // Get current PEN per USD exchange rate from backend
  abstract getExchangeRate(): Observable<GetExchangeRateResponse>;
}
