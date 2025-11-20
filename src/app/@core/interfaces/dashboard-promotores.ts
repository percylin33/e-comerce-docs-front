import { Observable } from "rxjs";

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

export interface PagedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page (0-based)
  size: number;
}

 export abstract class DashboardPromotoresData {
    // status is optional (e.g. 'pending'), search is optional (text to search by email or receipt)
    abstract getList(status?: string, search?: string, page?: number, size?: number): Observable<PagedResult<WithdrawalDto>>;
    abstract approve(id: number, reason?: string): Observable<WithdrawalDto>;
    abstract reject(id: number, reason?: string): Observable<WithdrawalDto>;
  }