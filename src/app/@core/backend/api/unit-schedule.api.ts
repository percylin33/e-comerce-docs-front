import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { UnitSchedule } from '../../interfaces/unit-schedule';

@Injectable({ providedIn: 'root' })
export class UnitScheduleApi {
  private api = inject(HttpService);


  getAll(): Observable<UnitSchedule[]> {
    return this.api.get('api/v1/unit-schedule');
  }

  getBySubscriptionType(subscriptionTypeId: number, anio?: number): Observable<any> {
    const url = `api/v1/unit-schedule/subscription-type/${subscriptionTypeId}`;
    return this.api.get(anio ? `${url}?anio=${anio}` : url);
  }

  getById(id: number): Observable<any> {
    return this.api.get(`api/v1/unit-schedule/${id}`);
  }

  create(unit: UnitSchedule): Observable<UnitSchedule> {
    return this.api.post('api/v1/unit-schedule', unit);
  }

  update(id: number, unit: UnitSchedule): Observable<UnitSchedule> {
    return this.api.put(`api/v1/unit-schedule/${id}`, unit);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(`api/v1/unit-schedule/${id}`);
  }

  getBySubscriptionTypeWithModo(subscriptionTypeId: number, modo: string, anio?: number): Observable<any> {
    const url = `api/v1/unit-schedule/subscription-type/${subscriptionTypeId}`;
    let params = [];
    if (modo) params.push(`modo=${modo}`);
    if (anio) params.push(`anio=${anio}`);
    const fullUrl = params.length ? `${url}?${params.join('&')}` : url;
    return this.api.get(fullUrl);
  }
}
