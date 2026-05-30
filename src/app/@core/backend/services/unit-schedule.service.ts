import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UnitSchedule } from '../../interfaces/unit-schedule';
import { UnitScheduleApi } from '../api/unit-schedule.api';

@Injectable({ providedIn: 'root' })
export class UnitScheduleService {
  private api = inject(UnitScheduleApi);


  getAll(): Observable<UnitSchedule[]> {
    return this.api.getAll();
  }

  /**
   * Obtiene los cronogramas (UnitSchedules) disponibles para un tipo de suscripción y año específico.
   * Si no se especifica año, usa el año actual en el backend.
   * 
   * @param subscriptionTypeId ID del tipo de suscripción
   * @param anio Año opcional (si no se proporciona, el backend usa año actual)
   * @returns Observable con la lista de UnitSchedules
   */
  getBySubscriptionType(subscriptionTypeId: number, anio?: number): Observable<UnitSchedule[]> {
    return this.api.getBySubscriptionType(subscriptionTypeId, anio);
  }

  getById(id: number): Observable<UnitSchedule> {
    return this.api.getById(id);
  }

  create(unit: UnitSchedule): Observable<UnitSchedule> {
    return this.api.create(unit);
  }

  update(id: number, unit: UnitSchedule): Observable<UnitSchedule> {
    return this.api.update(id, unit);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id);
  }

  getBySubscriptionTypeWithModo(subscriptionTypeId: number, modo: string, anio?: number): Observable<UnitSchedule[]> {
    return this.api.getBySubscriptionTypeWithModo(subscriptionTypeId, modo, anio);
  }
}
