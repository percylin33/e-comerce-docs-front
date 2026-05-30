import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from './http.service';
import { 
  SubscriptionType, 
  SubscriptionTypeDto,
  NivelEducativo
} from '../../data/subscription-types';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionTypesApi {
  private api = inject(HttpService);


  private readonly API_URL = 'api/v1/subscription-type';

  // ========== ENDPOINTS PÚBLICOS ==========

  /**
   * Obtener todas las membresías
   */
  getAll(): Observable<SubscriptionType[]> {
    return this.api.get(this.API_URL).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Obtener membresía por ID
   */
  getById(id: number): Observable<SubscriptionType> {
    return this.api.get(`${this.API_URL}/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Obtener membresías por nivel educativo (solo activas)
   */
  getByNivel(nivel: NivelEducativo): Observable<SubscriptionType[]> {
    return this.api.get(`${this.API_URL}/nivel/${nivel}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Obtener solo membresías activas
   */
  getAllActive(): Observable<SubscriptionType[]> {
    return this.api.get(`${this.API_URL}/active`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Obtener títulos de unidad por ID de membresía
   */
  getTitulos(id: number): Observable<string[]> {
    return this.api.get(`${this.API_URL}/title/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  // ========== ENDPOINTS ADMIN (Solo SUPADMIN) ==========

  /**
   * Crear nueva membresía
   */
  create(dto: SubscriptionTypeDto): Observable<SubscriptionType> {
    console.log('🚀 API create llamado con DTO:', dto);
    return this.api.post(this.API_URL, dto).pipe(
      map(response => {
        console.log('✅ API create respuesta:', response);
        return response.data || response;
      })
    );
  }

  /**
   * Actualizar membresía existente
   */
  update(id: number, dto: SubscriptionTypeDto): Observable<SubscriptionType> {
    console.log('🚀 API update llamado con ID:', id, 'y DTO:', dto);
    return this.api.put(`${this.API_URL}/${id}`, dto).pipe(
      map(response => {
        console.log('✅ API update respuesta:', response);
        return response.data || response;
      })
    );
  }

  /**
   * Toggle estado activo/inactivo
   */
  toggleActivo(id: number): Observable<SubscriptionType> {
    return this.api.put(`${this.API_URL}/${id}/toggle-activo`, {}).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Actualizar posición de la membresía
   */
  updatePosicion(id: number, nuevaPosicion: number): Observable<SubscriptionType> {
    return this.api.put(`${this.API_URL}/${id}/posicion?nuevaPosicion=${nuevaPosicion}`, {}).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Eliminar membresía
   */
  delete(id: number): Observable<any> {
    return this.api.delete(`${this.API_URL}/${id}`).pipe(
      map(response => response.data || response)
    );
  }
}
