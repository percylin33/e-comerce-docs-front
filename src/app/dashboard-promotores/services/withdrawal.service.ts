import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WithdrawalDto {
  id: number;
  amount: number;
  method: string;
  accountDetails: string;
  status: string;
  requestDate: string;
  userId?: number;
  userEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class WithdrawalService {
  private http = inject(HttpClient);

  // use full backend URL to avoid dev-server 4200 404 when no proxy configured
  private base = `${environment.apiUrl}/api/v1/promotores/withdrawals`;

  list(status?: string): Observable<WithdrawalDto[]> {
    const params: any = {};
    
    if (status) params.status = status;
    return this.http.get<WithdrawalDto[]>(this.base, { params });
  }

  create(data: any): Observable<WithdrawalDto> {
    const formData = new FormData();
    formData.append('userId', data.userId.toString());
    
    if (data.method) {
      formData.append('method', data.method);
    }
    
    if (data.accountDetails) {
      formData.append('accountDetails', data.accountDetails);
    }
    
    return this.http.post<WithdrawalDto>(this.base, formData);
  }

  getDashboardData(userId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/dashboard/${userId}`);
  }

  approve(id: number, reason?: string): Observable<WithdrawalDto> {
    return this.http.post<WithdrawalDto>(`${this.base}/${id}/approve`, { reason });
  }

  reject(id: number, reason?: string): Observable<WithdrawalDto> {
    return this.http.post<WithdrawalDto>(`${this.base}/${id}/reject`, { reason });
  }
}
