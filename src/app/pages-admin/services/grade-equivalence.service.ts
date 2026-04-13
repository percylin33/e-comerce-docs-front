// =====================================================
// GradeEquivalence Service - PagesAdmin
// =====================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import {
  GradeEquivalence,
  GradeEquivalenceRequest,
  GradeEquivalenceStats,
  LevelCode
} from '../models';

export interface GradeEquivalenceResponse {
  equivalences: GradeEquivalence[];
  stats?: GradeEquivalenceStats;
}

export interface MateriaOption {
  id: number;
  nombre: string;
}

export interface OpcionOption {
  id: number;
  nombre: string;
}

export interface GradeOption {
  id: number;
  nombre: string;
  tipoSuscripcion?: string;
}

export interface SubjectOption {
  id: number;
  code: string;
  name: string;
  nombre?: string; // Alias para compatibilidad
  position: number;
}

export interface MateriasResponse {
  materias: MateriaOption[];
  count: number;
}

export interface OpcionesResponse {
  opciones: OpcionOption[];
  count: number;
}

export interface SubjectsResponse {
  subjects: SubjectOption[];
  count: number;
}

export interface GradesResponse {
  grades: GradeOption[];
  count: number;
}

export interface DuplicateCheckResponse {
  exists: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class GradeEquivalenceService {
  private readonly baseUrl = `${environment.apiUrl}/api/v1/admin/grade-equivalences`;

  constructor(private http: HttpClient) {}

  /**
   * Get all equivalences with optional level filter
   */
  getEquivalences(level?: LevelCode): Observable<GradeEquivalence[]> {
    let params = new HttpParams();
    if (level) {
      params = params.set('level', level);
    }
    return this.http.get<GradeEquivalence[]>(this.baseUrl, { params });
  }

  /**
   * Get equivalence by ID
   */
  getEquivalence(id: number): Observable<GradeEquivalence> {
    return this.http.get<GradeEquivalence>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create new equivalence
   */
  createEquivalence(data: GradeEquivalenceRequest): Observable<GradeEquivalence> {
    return this.http.post<GradeEquivalence>(this.baseUrl, data);
  }

  /**
   * Update existing equivalence
   */
  updateEquivalence(id: number, data: GradeEquivalenceRequest): Observable<GradeEquivalence> {
    return this.http.put<GradeEquivalence>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Delete equivalence (soft delete)
   */
  deleteEquivalence(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create multiple equivalences at once (bulk)
   */
  createBulkEquivalences(data: GradeEquivalenceRequest[]): Observable<GradeEquivalence[]> {
    return this.http.post<GradeEquivalence[]>(`${this.baseUrl}/bulk`, data);
  }

  /**
   * Get statistics of equivalences by level
   */
  getStats(): Observable<GradeEquivalenceStats> {
    return this.http.get<GradeEquivalenceStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Check if equivalence exists for given combination
   */
  checkDuplicate(levelCode: LevelCode, materiaId: number, opcionId: number): Observable<DuplicateCheckResponse> {
    const params = new HttpParams()
      .set('levelCode', levelCode)
      .set('materiaId', materiaId.toString())
      .set('opcionId', opcionId.toString());
    return this.http.get<DuplicateCheckResponse>(`${this.baseUrl}/check-duplicate`, { params });
  }

  /**
   * Get materias available for a specific level
   */
  getMateriasForLevel(levelCode: LevelCode): Observable<MateriaOption[]> {
    return this.http.get<any>(`${this.baseUrl}/materias`, {
      params: new HttpParams().set('level', levelCode)
    }).pipe(
      map(response => (response.data?.materias || response.materias || []))
    );
  }

  /**
   * Get opciones available for a specific materia
   */
  getOpcionesForMateria(materiaId: number): Observable<OpcionOption[]> {
    return this.http.get<any>(`${this.baseUrl}/opciones`, {
      params: new HttpParams().set('materiaId', materiaId.toString())
    }).pipe(
      map(response => (response.data?.opciones || response.opciones || []))
    );
  }

  /**
   * Get subjects available for a specific level (from PLANIFICACION category)
   */
  getSubjectsForLevel(levelCode: LevelCode): Observable<SubjectOption[]> {
    return this.http.get<any>(`${this.baseUrl}/subjects`, {
      params: new HttpParams().set('levelCode', levelCode)
    }).pipe(
      map(response => (response.data?.subjects || response.subjects || []))
    );
  }

  /**
   * Get grades available for a specific subject
   */
  getGradesForSubject(subjectId: number): Observable<GradeOption[]> {
    return this.http.get<any>(`${this.baseUrl}/grades`, {
      params: new HttpParams().set('subjectId', subjectId.toString())
    }).pipe(
      map(response => (response.data?.grades || response.grades || []))
    );
  }

  /**
   * Get grades available for a specific level (legacy, use getGradesForSubject instead)
   */
  getGradesForLevel(levelCode: LevelCode): Observable<GradeOption[]> {
    return this.http.get<any>(`${this.baseUrl}/grades`, {
      params: new HttpParams().set('level', levelCode)
    }).pipe(
      map(response => (response.data?.grades || response.grades || []))
    );
  }

  /**
   * Find equivalence for given combination
   */
  findByLevelMateriaOpcion(
    levelCode: LevelCode,
    materiaId: number,
    opcionId: number
  ): Observable<GradeEquivalence | null> {
    const params = new HttpParams()
      .set('levelCode', levelCode)
      .set('materiaId', materiaId.toString())
      .set('opcionId', opcionId.toString());
    return this.http.get<GradeEquivalence | null>(`${this.baseUrl}/find`, { params });
  }

  /**
   * Get all active equivalences
   */
  getActiveEquivalences(): Observable<GradeEquivalence[]> {
    return this.http.get<GradeEquivalence[]>(this.baseUrl, {
      params: new HttpParams().set('activo', 'true')
    });
  }

  /**
   * Toggle equivalence active status
   */
  toggleActive(id: number, activo: boolean): Observable<GradeEquivalence> {
    return this.http.patch<GradeEquivalence>(`${this.baseUrl}/${id}/toggle`, { activo });
  }
}
