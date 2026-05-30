export interface UnitSchedule {
  id: number;
  subscriptionTypeId: number;
  unidadNumero: number;
  titulo: string;
  fechaInicio: string; // LocalDate como string en formato ISO
  fechaFin: string;    // LocalDate como string en formato ISO
  anio: number;
}

export interface UnitScheduleResponse {
  result: boolean;
  status: number;
  data: UnitSchedule[];
  timestamp: string;
}
