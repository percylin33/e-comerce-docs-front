import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WithdrawalApi } from '../api/withdrawal.api';
import { PagedWithdrawalsResponse, WithdrawalRequest, WithdrawalResponse, WithdrawalDashboard } from '../../interfaces/withdrawal';

@Injectable({ providedIn: 'root' })
export class WithdrawalService {
  constructor(private withdrawalApi: WithdrawalApi) {}

  getDashboardData(userId: number): Observable<WithdrawalDashboard> {
    return this.withdrawalApi.getDashboardData(userId);
  }

  getWithdrawals(status?: string, search?: string, page: number = 0, size: number = 20): Observable<PagedWithdrawalsResponse> {
    return this.withdrawalApi.getWithdrawals(status, search, page, size);
  }

  getWithdrawalsByUser(userId: number): Observable<any> {
    return this.withdrawalApi.getWithdrawalsByUser(userId);
  }

  createWithdrawalRequest(request: WithdrawalRequest, userId: number): Observable<any> {
    const formData = new FormData();
    formData.append('userId', userId.toString());
    
    if (request.receiptNumber) {
      formData.append('receiptNumber', request.receiptNumber);
    }
    
    if (request.receiptFile) {
      formData.append('receiptFile', request.receiptFile);
    }
    
    if (request.method) {
      formData.append('method', request.method);
    }
    
    if (request.accountDetails) {
      formData.append('accountDetails', request.accountDetails);
    }
    
    return this.withdrawalApi.createWithdrawal(formData);
  }

  approveWithdrawal(id: number, note?: string): Observable<WithdrawalResponse> {
    return this.withdrawalApi.approveWithdrawal(id, note);
  }

  rejectWithdrawal(id: number, reason: string): Observable<WithdrawalResponse> {
    return this.withdrawalApi.rejectWithdrawal(id, reason);
  }
}
