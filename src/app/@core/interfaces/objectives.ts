import { Observable } from "rxjs";

export interface Objective {
  id: number;
  key: string;
  message: string;
  target: string; // JSON string con detalles de la meta
  commissionBonus: number;
  status: string;
  assignedTo: number | null; // null si es general
  isPersonal?: boolean; // true si es personalizado, false si es general
}

export interface ObjectiveTarget {
  type?: string; // ej: 'sales', 'revenue', 'custom'
  value?: number;
  description?: string;
}

export interface ResponseObjectives {
  result: boolean;
  data: Objective[];
  timestamp: string;
  status: number;
}

export abstract class ObjectivesData {
  abstract getObjectivesForPromotor(userId: number): Observable<ResponseObjectives>;
  abstract getPersonalObjectives(userId: number): Observable<ResponseObjectives>;
  abstract getGeneralObjectives(): Observable<ResponseObjectives>;
}
