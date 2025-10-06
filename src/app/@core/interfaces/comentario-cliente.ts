export interface ComentarioCliente {
  id?: number;
  avatar: string;
  nombre: string;
  texto: string;
  ubicacion: string;
}

export interface ComentarioClienteResponse {
  result: boolean;
  data: ComentarioCliente | ComentarioCliente[];
  timestamp: string;
  status: number;
}
