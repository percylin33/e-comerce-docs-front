import { Observable } from "rxjs";
import { DashboardPromotoresApi } from "../api/dashboard-promotores.api";
import { DashboardPromotoresData, WithdrawalDto, PagedResult } from "../../interfaces/dashboard-promotores";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class DashboardPromotoresService extends DashboardPromotoresData {

  constructor(private api: DashboardPromotoresApi) {
    super();
   }

  getList(status?: string, search?: string, page: number = 0, size: number = 20): Observable<PagedResult<WithdrawalDto>> {
    return this.api.getList(status, search, page, size);
  }

  approve(id: number, reason?: string): Observable<WithdrawalDto> {
    return this.api.approve(id, reason);
  }

  reject(id: number, reason?: string): Observable<WithdrawalDto> {
    return this.api.reject(id, reason);
  }

}