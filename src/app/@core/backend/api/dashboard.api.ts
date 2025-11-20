import { Injectable } from "@angular/core";
import { HttpService } from "./http.service";
import { Observable } from "rxjs";
import { DashboardStats } from "../../interfaces/dashboard";

@Injectable({
  providedIn: 'root'
})
export class DashboardApi {
  constructor(private api: HttpService) { }

  // GET /api/v1/dashboard/stats
  getStats(): Observable<DashboardStats> {
    return this.api.get(`api/v1/dashboard/stats`);
  }

}
