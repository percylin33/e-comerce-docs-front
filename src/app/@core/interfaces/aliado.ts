export interface Aliado {
  id?: number;
  img: string;
  name: string;
  location: string;
  link: string;
  desc?: string;
}

export interface AliadoResponse {
  result: boolean;
  data: Aliado | Aliado[];
  timestamp: string;
  status: number;
}
