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

export interface ResponseNextUnits {
  result: boolean;
  data: UnitOption[];
  timestamp: string;
  status: number;
}

export interface ResponseUnitDetails {
  result: boolean;
  data: UnitDetails;
  timestamp: string;
  status: number;
}

export interface ResponseSubscriptionDetails {
  result: boolean;
  data: SubscriptionDetails;
  timestamp: string;
  status: number;
}

export interface Payment {
  paymentId: number;
  amount: number;
  paymentDate: string;
  paymentStatus: string;
}

export interface SubscriptionDetails {
  id: number;
  userName: string;
  subscriptionType: string;
  subscriptionTypeId: number;
  materiasOpcionesJson: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  fechaFinUnidad: string;
  unidadActual: number;
  unidadActualTitulo: string;
}

export interface UnitOption {
  id: number;
  unidadNumero: number;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  subscriptionTypeId: number;
}

export interface UnitDetails {
  id: number;
  unidadNumero: number;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  subscriptionTypeId: number;
}

export interface EditSubscriptionRequest {
  subscriptionId: number;
  unidadNumero?: number;
  fechaInicio?: string;
  fechaFinUnidad?: string;
  action: 'EDIT' | 'CANCEL';
}

export interface SubscriptionDocument {
  id: number;
  title: string;
  description: string;
  price: number;
  fileUrlPublic: string;
  nivel: string;
  materia: string;
  opcion: string;
}

export interface SubscriptionDocumentDetail {
  id: number;
  membresiaNombre: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  pagos: Payment[];
  documentos: SubscriptionDocument[];
  materiasOpcionesJson: string;
  // Estructura organizada de documentos por nivel > materia > grado
  documents?: {
    [nivel: string]: {
      [materia: string]: {
        [grado: string]: SubscriptionDocument[];
      };
    };
  };
}

export interface ResponseSubscriptionDocuments {
  result: boolean;
  data: { [key: string]: SubscriptionDocumentDetail[] };
  timestamp: string;
  status: number;
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
  abstract getNextUnits(subscriptionId: number): Observable<ResponseNextUnits>;
  abstract getUnitDetails(subscriptionTypeId: number, unidadNumero: number): Observable<ResponseUnitDetails>;
  abstract editSubscription(editData: EditSubscriptionRequest): Observable<ResponseSuscripcionesBoolean>;
  abstract getSubscriptionDetails(subscriptionId: number): Observable<ResponseSubscriptionDetails>;
  abstract getDocumentsBySubscription(subscriptionId: number): Observable<ResponseSubscriptionDocuments>;
}