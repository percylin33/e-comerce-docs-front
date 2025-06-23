import { Observable } from "rxjs";

export interface ResponseMembresia {
  result: boolean;
  data: Membresia;
  timestamp: string;
  status: number;
}

export interface Membresia {
  nombre: string;
  descripcion: string;
  materias: Materias[];
}

export interface Materias {
  id: number;
  nombre: string;
  muestra: string[];
  afiche: string;
  opciones: Opciones[];
  beneficios: string[];
}

export interface Opciones {
  nombre: string;
  antes: number;
  ahora: number;
  seleccionada: boolean;
  exclusivo: boolean;
}
export interface MembresiaSuscripcionResponse {
  result: boolean;
  data: { [nombre: string]: MembresiaSuscripcion }; // Clave dinámica por nombre de membresía
  timestamp: string;
  status: number;
}

export interface MembresiaSuscripcion {
  subscriptionId: number;
  membresiaNombre: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  pagos: PagoSuscripcion[];
  documents: DocumentosPorNivel;
}

export interface PagoSuscripcion {
  paymentId: number;
  amount: number;
  paymentDate: string;
  paymentStatus: string;
}

export interface DocumentosPorNivel {
  [nivel: string]: { // Ej: "SECUNDARIA"
    [materia: string]: { // Ej: "COMUNICACION"
      [grado: string]: DocumentoSuscripcion[]; // Ej: "3°"
    }
  }
}

export interface DocumentoSuscripcion {
  id: number;
  title: string;
  description: string;
  price: number;
  fileUrlPublic: string;
}

export abstract class MembresiaData {
  abstract getMembresiaById(id: number): Observable<ResponseMembresia>;
  abstract getMembresiasUser(userId: number): Observable<MembresiaSuscripcionResponse>;
}