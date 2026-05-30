export interface Equipo {
  id?: number;
  img: string;
  name: string;
  role: string;
  title?: string;
  especialidades: string[];
  detalle?: string;
  tipo?: string;
}

export interface EquipoResponse {
  result: boolean;
  data: Equipo | Equipo[];
  timestamp: string;
  status: number;
}
