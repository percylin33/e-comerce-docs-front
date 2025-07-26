import { Observable } from "rxjs";

export interface ResponseSuscripciones {
  result: boolean;
  data: Suscripcion[];
  timestamp: string;
  status: number;
}

export interface ResponseSuscripcionesBoolean {
  result: boolean;
  data: boolean;
  timestamp: string;
  status: number;
}

export interface ResponseSuscripcionesPayments {
  result: boolean;
  data: Payment[];
  timestamp: string;
  status: number;
}

export interface Payment {
  paymentId: number;
  amount: number;
  paymentDate: string;
  paymentStatus: string;
}

export interface Suscripcion {
  id: number;
  userName: string;
  subscriptionType: string;
  materiasOpcionesJson: string;
  startDate: string;
  endDate: string;
  status: string; // Activa o Inactiva
}

export abstract class SuscripcionesData{
  abstract getAllSuscripciones(): Observable<ResponseSuscripciones>;
  abstract getPaymentsBySuscripcionId(suscripcionId: number): Observable<ResponseSuscripcionesPayments>;
  abstract putCancelarSuscripcion(suscripcionId: number): Observable<ResponseSuscripcionesBoolean>;
  abstract putActivarSuscripcion(suscripcionId: number, dias: number): Observable<ResponseSuscripcionesBoolean>;
    
}