import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { UnitSchedule } from '../../interfaces/unit-schedule';

@Injectable({ providedIn: 'root' })
export class UnitScheduleApi {
  constructor(private api: HttpService) {}

  getAll(): Observable<UnitSchedule[]> {
    return this.api.get('api/v1/unit-schedule');
  }

  getById(id: number): Observable<UnitSchedule> {
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
}
