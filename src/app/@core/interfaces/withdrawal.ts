export interface WithdrawalRequest {
  id?: number;
  amount?: number; // Opcional porque ahora se calcula automáticamente en el backend
  method?: string;
  accountDetails?: string;
  status?: string;
  requestDate?: string;
  userId?: number;
  userEmail?: string;
  receiptNumber?: string;
  receiptFile?: File;
}

export interface WithdrawalResponse {
  id: number;
  amount: number;
  method: string;
  accountDetails: string;
  status: string;
  requestDate: string;
  userId: number;
  userEmail: string;
  url?: string;
  receiptUrl?: string;
}

export interface WithdrawalDashboard {
  saldoDisponible: number;
  minimoRetiro: number;
  retirosPendientes: number;
  metodoPagoConfigurado: boolean;
  recentWithdrawals: WithdrawalResponse[];
}

export interface WithdrawalStats {
  saldoDisponible: number;
  retirosPendientes: number;
  metodoPagoConfigurado: boolean;
}

export interface ResponseWithdrawals {
  result: boolean;
  data: WithdrawalResponse[];
  message?: string;
}

export interface PagedWithdrawalsResponse {
  content: WithdrawalResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
