import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../@auth/components/shared.service';
import { WithdrawalService } from '../../@core/backend/services/withdrawal.service';
import { WithdrawalRequest, WithdrawalResponse } from '../../@core/interfaces/withdrawal';

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
    
    const request: WithdrawalRequest = {
      receiptNumber: this.receiptNumber,
      receiptFile: this.selectedFile
    };
    
    this.loading = true;
    
    this.withdrawalService.createWithdrawalRequest(request, this.currentUser.id).subscribe({
      next: (response) => {
        alert('Solicitud de retiro enviada exitosamente');
        this.resetForm();
        this.loadData();
      },
      error: (err) => {
        console.error('Error al crear solicitud:', err);
        const errorMsg = err?.error?.message || 'Error al enviar la solicitud. Por favor intenta nuevamente.';
        alert(errorMsg);
        this.loading = false;
      }
    });
  }
  
  private resetForm(): void {
    this.receiptNumber = '';
    this.selectedFile = null;
    this.fileName = '';
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
