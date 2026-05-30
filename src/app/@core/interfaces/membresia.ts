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
  esEspecial?: boolean; // Indica si ofrece acceso a unidades históricas
  descuentoUnidadesPasadas?: number; // Porcentaje de descuento (0-100) para unidades pasadas
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
  id?: number;                   // backend primary key (alias of subscriptionId)
  subscriptionId: number;
  membresiaNombre: string;
  estado: string;
  estadoPago?: string;           // ACTIVA | PENDIENTE — payment status from backend
  fechaInicio: string;
  fechaFin: string;
  fechaFinUnidad?: string;
  fechaInicioCompra?: string;    // purchase-period start — used to detect temporary inactivation
  pagos: PagoSuscripcion[];
  documents: DocumentosPorNivel;
  materiasOpcionesJson: string; // JSON string con las materias y opciones
  inactiveReason?: {
    code: string;
    message: string;
    totalDebt?: number;
    overdueCount?: number;
  };
  /** Motivo registrado en el audit log al cancelar la suscripción. Solo presente si INACTIVA. */
  cancelReason?: string | null;
  /** Admin o sistema que ejecutó la cancelación. */
  canceledBy?: string | null;
}

export interface PagoSuscripcion {
  paymentId: number;
  amount: number;
  paymentDate?: string;       // timestamp of actual payment — may be absent in slim inline responses
  fechaVencimiento?: string;  // due date of the instalment (from new PaymentSummaryDto)
  paymentStatus: string;
  dueDate?: string;           // alias for fechaVencimiento used by older PaymentDTO endpoint
  isOverdue?: boolean;
  daysOverdue?: number;
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