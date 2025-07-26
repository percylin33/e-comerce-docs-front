import { Observable } from "rxjs";

export interface ResponseMembresia {
  result: boolean;
  data: Membresia;
  timestamp: string;
  status: number;
}

export interface ResponseMembresiaTiles {
  result: boolean;
  data: string[]; // Array de nombres de membresías
  timestamp: string;
  status: number;
}

export interface ResponseMembresiaValidateRevendedor {
  result: boolean;
  data: string; 
  timestamp: string;
  status: number;
}

export interface ResponseMembresiaMateriasOpciones {
  result: boolean;
  data: Materias[];
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
  data: { [nombre: string]: MembresiaSuscripcion[] }; // Clave dinámica por nombre de membresía, valor es array
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
  materiasOpcionesJson: string; // JSON string con las materias y opciones

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
  abstract getMateriasOpciones(subscriptionTypeId: number): Observable<ResponseMembresiaMateriasOpciones>;
  abstract getTitleById(id: number): Observable<ResponseMembresiaTiles>;
  abstract getValidateRevendedor(userId: number, materiaNombre: string): Observable<ResponseMembresiaValidateRevendedor>;
}