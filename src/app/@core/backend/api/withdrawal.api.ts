import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { PagedWithdrawalsResponse, WithdrawalResponse, WithdrawalDashboard } from '../../interfaces/withdrawal';

@Injectable({ providedIn: 'root' })
export class WithdrawalApi {
  private api = inject(HttpService);


  // Obtener datos del dashboard de retiros para un usuario
  getDashboardData(userId: number): Observable<WithdrawalDashboard> {
    return this.api.get(`api/v1/promotores/withdrawals/dashboard/${userId}`);
  }

  // Obtener retiros con filtros y paginación
  getWithdrawals(status?: string, search?: string, page: number = 0, size: number = 20): Observable<PagedWithdrawalsResponse> {
    let params: any = { page, size };
    if (status) params.status = status;
    if (search) params.search = search;
    
    return this.api.get('api/v1/promotores/withdrawals', params);
  }

  // Obtener retiros de un usuario específico
  getWithdrawalsByUser(userId: number): Observable<any> {
    return this.api.get(`api/v1/promotores/withdrawals/user/${userId}`);
  }

  // Crear nueva solicitud de retiro
  createWithdrawal(data: FormData): Observable<WithdrawalResponse> {
    return this.api.post('api/v1/promotores/withdrawals', data);
  }

  // Aprobar retiro (admin)
  approveWithdrawal(id: number, note?: string): Observable<WithdrawalResponse> {
    return this.api.post(`api/v1/promotores/withdrawals/${id}/approve`, { reason: note });
  }

  // Rechazar retiro (admin)
  rejectWithdrawal(id: number, reason: string): Observable<WithdrawalResponse> {
    return this.api.post(`api/v1/promotores/withdrawals/${id}/reject`, { reason });
  }
}
