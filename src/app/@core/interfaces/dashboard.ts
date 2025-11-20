import { Observable } from 'rxjs';

export interface DashboardStats {
  embajadoresActivos: number;
  retirosPendientes: number;
  ventasUltimos30d: number;
  comisionesPagadasMes: number; // currency in minor units or float
}

export abstract class DashboardData {
  abstract getStats(): Observable<DashboardStats>;
}
