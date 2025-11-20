import { Injectable } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable } from "rxjs";
import { WithdrawalDto, PagedResult } from "../../interfaces/dashboard-promotores";

@Injectable({
  providedIn: 'root'
})
export class DashboardPromotoresApi {

  constructor(private api: HttpService) { }


  getValidar(code: String): Observable<WithdrawalDto> {
    return this.api.get(`api/v1/cupons/validate/${code}`);
  }

  getList(status?: string, search?: string, page: number = 0, size: number = 20): Observable<PagedResult<WithdrawalDto>> {
      const params: any = {};
      if (status) params.status = status;
      if (search) params.search = search;
      params.page = page;
      params.size = size;
      return this.api.get(`api/v1/promotores/withdrawals`, { params });
    }

    approve(id: number, reason?: string): Observable<WithdrawalDto> {
        return this.api.post(`api/v1/promotores/withdrawals/${id}/approve`, { reason });
      }

    reject(id: number, reason?: string): Observable<WithdrawalDto> {
        return this.api.post(`api/v1/promotores/withdrawals/${id}/reject`, { reason });
      }
 
}
