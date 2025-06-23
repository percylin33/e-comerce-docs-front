import { Observable } from "rxjs";

export interface ResponseSuscripciones {
  result: boolean;
  data: Suscripcion[];
  timestamp: string;
  status: number;
}

export interface Suscripcion {
  id: number;
  userName: string;
  subscriptionType: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string; // Activa o Inactiva
}

export abstract class SuscripcionesData{
    
}