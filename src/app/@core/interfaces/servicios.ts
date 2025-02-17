import { Observable } from "rxjs";

export interface GetServiciosResponse {
  result: boolean;
  status: number;
  data: Servicios[];
}

export interface Servicios {
  id: number;
  name: string;
  description: string;
}

export abstract class ServiciosData {
  abstract getServicios(): Observable<GetServiciosResponse>;
}
