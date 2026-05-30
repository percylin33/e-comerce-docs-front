export interface Historia {
  id?: number;
  year: string;
  img: string;
  title: string;
  text: string;
}

export interface HistoriaResponse {
  result: boolean;
  data: Historia | Historia[];
  timestamp: string;
  status: number;
}
