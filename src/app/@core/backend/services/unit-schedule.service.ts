import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UnitSchedule } from '../../interfaces/unit-schedule';
import { UnitScheduleApi } from '../api/unit-schedule.api';

@Injectable({ providedIn: 'root' })
export class UnitScheduleService {
  constructor(private api: UnitScheduleApi) {}

  getAll(): Observable<UnitSchedule[]> {
    return this.api.getAll();
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
}
