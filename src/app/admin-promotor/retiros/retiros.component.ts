import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../@auth/components/shared.service';
import { WithdrawalService } from '../../@core/backend/services/withdrawal.service';
import { WithdrawalRequest, WithdrawalResponse } from '../../@core/interfaces/withdrawal';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'ngx-retiros',
  templateUrl: './retiros.component.html',
  styleUrls: ['./retiros.component.scss']
})
export class RetirosComponent implements OnInit {
  loading = true;

  // Usuario
  currentUser: any;
  userName = '';
  userInitials = '';

  // Estadísticas
  saldoDisponible = 0;
  minimoRetiro = 50;
  retirosPendientes = 0;
  metodoPagoConfigurado = false;

  // Historial de retiros
  withdrawalHistory: WithdrawalResponse[] = [];

  // Formulario
  receiptNumber = '';
  selectedFile: File | null = null;
  fileName = '';

  constructor(
    private sharedService: SharedService,
    private withdrawalService: WithdrawalService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.sharedService.getCurrentUser();
    if (this.currentUser) {
      this.userName = `${this.currentUser.name || ''} ${this.currentUser.lastname || ''}`.trim();
      this.userInitials = this.getInitials(this.userName);
      this.loadData();
    }
  }

  private getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  private loadData(): void {
    this.loading = true;
    const userId = this.currentUser.id;

    // Cargar todos los datos del dashboard en una sola llamada
    this.withdrawalService.getDashboardData(userId).subscribe({
      next: (data) => {
        this.saldoDisponible = data.saldoDisponible || 0;
        this.minimoRetiro = data.minimoRetiro || 50;
        this.retirosPendientes = data.retirosPendientes || 0;
        this.metodoPagoConfigurado = data.metodoPagoConfigurado || false;
        this.withdrawalHistory = data.recentWithdrawals || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos del dashboard:', err);
        this.loading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF');
        return;
      }

      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no debe superar 5MB');
        return;
      }

      this.selectedFile = file;
      this.fileName = file.name;
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    if (this.saldoDisponible < this.minimoRetiro) {
      alert(`El saldo disponible debe ser mayor a S/ ${this.minimoRetiro.toFixed(2)}`);
      return;
    }

    if (!this.selectedFile) {
      alert('Debes subir el comprobante en PDF');
      return;
    }

    // Use fetch() to bypass Angular interceptors that transform error responses incorrectly
    // The AuthInterceptor's switchMap wraps errors in functions due to RxJS 6.6.2 bundling
    this.loading = true;
    
    const formData = new FormData();
    formData.append('userId', this.currentUser.id.toString());
    if (this.receiptNumber) {
      formData.append('receiptNumber', this.receiptNumber);
    }
    if (this.selectedFile) {
      formData.append('receiptFile', this.selectedFile);
    }
    
    // Get token for Authorization header
    const token = localStorage.getItem('auth_app_token');
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${environment.apiUrl}/api/v1/promotores/withdrawals`;
    
    fetch(url, {
      method: 'POST',
      headers: headers,
      body: formData
    })
    .then(async response => {
      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = 'Error al crear solicitud';
        
        try {
          const errorJson = JSON.parse(responseText);
          
          // Handle different backend error structures
          if (errorJson.errorresponse?.message) {
            errorMessage = errorJson.errorresponse.message;
          } else if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch (e) {
          // Not JSON, use raw text
          errorMessage = responseText || errorMessage;
        }
        
        alert(errorMessage);
        this.loading = false;
        return;
      }
      
      // Success
      alert('Solicitud de retiro enviada exitosamente');
      this.resetForm();
      this.loadData();
    })
    .catch(err => {
      console.error('Network error:', err);
      alert('Error de red al crear la solicitud');
      this.loading = false;
    });
  }

  private resetForm(): void {
    this.receiptNumber = '';
    this.selectedFile = null;
    this.fileName = '';
  }

  private extractServerErrorMessage(err: any): string {
    try {
      if (!err) return 'Error desconocido';
      let payload = err?.error ?? err;
      // Fallback: sometimes the response body is embedded in err.message as a JSON string
      if ((payload === undefined || payload === null) && typeof err?.message === 'string') {
        const maybe = err.message.trim();
        try {
          const parsed = JSON.parse(maybe);
          payload = parsed;
        } catch (_) {
          // not JSON, keep payload as-is
        }
      }
      console.error('Server error payload (extracted):', payload);
      if (typeof payload === 'string') {
        try {
          const parsed = JSON.parse(payload);
          return parsed?.message || parsed?.mensaje || parsed?.error || JSON.stringify(parsed);
        } catch (_) {
          return payload;
        }
      }
      if (Array.isArray(payload)) {
        return JSON.stringify(payload);
      }

      if (typeof payload === 'object' && payload !== null) {
        return payload?.message || payload?.mensaje || payload?.error ||
          (Array.isArray(payload?.errors) && (payload.errors[0]?.message || JSON.stringify(payload.errors))) ||
          JSON.stringify(payload) ||
          err?.message || `${err?.status || ''} ${err?.statusText || ''}` || 'Error desconocido';
      }
      // If payload is a function (observed in minified bundles), try to extract JSON-looking content
      if (typeof payload === 'function') {
        try {
          const asStr = payload.toString();
          const m = asStr.match(/(\{[\s\S]*\})/);
          if (m && m[1]) {
            try {
              const parsed = JSON.parse(m[1]);
              return parsed?.message || JSON.stringify(parsed);
            } catch (_) { }
          }
          return asStr.slice(0, 200);
        } catch (_) {
          return 'Error desconocido';
        }
      }
      return err?.message || String(payload) || 'Error desconocido';
    } catch (e) {
      console.error('Error extracting server message', e);
      return 'Error al procesar la respuesta del servidor';
    }
  }

  private async readHttpErrorMessage(err: any): Promise<string> {
    try {
      if (!err) return 'Error desconocido';

      // 1. Check for standard Angular HttpClient error structure with a JSON body
      // where the body has a 'message' property. This matches the backend response:
      // {"message": "El usuario ya tiene una solicitud pendiente"}
      const backendMessage = err?.error?.message;
      if (backendMessage && typeof backendMessage === 'string') {
        return backendMessage;
      }

      // 2. Check if the error is a Blob (common when server returns non-JSON error or configured as blob response)
      const errorBody = err?.error;
      if (errorBody instanceof Blob) {
        const text = await errorBody.text();
        try {
          const parsed = JSON.parse(text);
          return parsed?.message || parsed?.mensaje || parsed?.error || text;
        } catch (_) {
          return text || 'Error desconocido';
        }
      }

      // 3. Check if error body is ArrayBuffer
      if (errorBody instanceof ArrayBuffer) {
        const text = new TextDecoder().decode(new Uint8Array(errorBody));
        try {
          const parsed = JSON.parse(text);
          return parsed?.message || parsed?.mensaje || parsed?.error || text;
        } catch (_) {
          return text || 'Error desconocido';
        }
      }

      // 4. Fallback to existing extraction logic which handles various other formats
      return this.extractServerErrorMessage(err);
    } catch (e) {
      console.error('Error reading http error message', e);
      return 'Error al procesar la respuesta del servidor';
    }
  }

  onCancel(): void {
    window.history.back();
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'status-paid';
      case 'pending':
        return 'status-pending';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazado';
      default:
        return status;
    }
  }
}
