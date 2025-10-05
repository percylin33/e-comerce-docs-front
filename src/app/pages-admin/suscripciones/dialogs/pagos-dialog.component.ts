import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Payment } from '../../../@core/interfaces/suscripciones';

export interface PagosDialogData {
  pagos: Payment[];
}

@Component({
  selector: 'ngx-pagos-dialog',
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="payment-icon">payment</mat-icon>
        <h2 mat-dialog-title>Historial de Pagos</h2>
        <button mat-icon-button (click)="cerrar()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div mat-dialog-content class="pagos-content">
        <div *ngIf="data.pagos.length === 0" class="no-pagos">
          <mat-icon class="empty-icon">payment_off</mat-icon>
          <h3>Sin pagos registrados</h3>
          <p>No se encontraron pagos para esta suscripción</p>
        </div>
        
        <div *ngIf="data.pagos.length > 0" class="pagos-container">
          <div class="pagos-summary">
            <div class="summary-card">
              <mat-icon>payments</mat-icon>
              <div class="summary-info">
                <span class="summary-label">Total de Pagos</span>
                <span class="summary-value">{{ data.pagos.length }}</span>
              </div>
            </div>
            <div class="summary-card">
              <mat-icon>account_balance_wallet</mat-icon>
              <div class="summary-info">
                <span class="summary-label">Monto Total</span>
                <span class="summary-value">{{ getTotalAmount() | currency:'PEN':'symbol':'1.2-2' }}</span>
              </div>
            </div>
          </div>
          
          <div class="pagos-list">
            <mat-card class="pago-card" *ngFor="let pago of data.pagos; let i = index">
              <mat-card-content>
                <div class="pago-header">
                  <div class="pago-number">
                    <mat-icon>receipt</mat-icon>
                    <span>#{{ pago.paymentId }}</span>
                  </div>
                  <span class="status-badge" [class]="getStatusClass(pago.paymentStatus)">
                    <mat-icon>{{ getStatusIcon(pago.paymentStatus) }}</mat-icon>
                    {{ pago.paymentStatus }}
                  </span>
                </div>
                
                <div class="pago-details">
                  <div class="detail-row">
                    <mat-icon class="detail-icon">schedule</mat-icon>
                    <div class="detail-content">
                      <span class="detail-label">Fecha de Pago</span>
                      <span class="detail-value">{{ pago.paymentDate | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                  </div>
                  
                  <div class="detail-row">
                    <mat-icon class="detail-icon">monetization_on</mat-icon>
                    <div class="detail-content">
                      <span class="detail-label">Monto</span>
                      <span class="detail-value amount">{{ pago.amount | currency:'PEN':'symbol':'1.2-2' }}</span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-raised-button color="primary" (click)="cerrar()">
          <mat-icon>check</mat-icon>
          Entendido
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./pagos-dialog.component.scss']
})
export class PagosDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PagosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PagosDialogData
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }

  getTotalAmount(): number {
    return this.data.pagos.reduce((total, pago) => total + pago.amount, 0);
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completado':
      case 'pagado':
      case 'aprobado':
        return 'status-completado';
      case 'pendiente':
      case 'procesando':
        return 'status-pendiente';
      case 'fallido':
      case 'rechazado':
      case 'cancelado':
        return 'status-fallido';
      default:
        return 'status-default';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completado':
      case 'pagado':
      case 'aprobado':
        return 'check_circle';
      case 'pendiente':
      case 'procesando':
        return 'schedule';
      case 'fallido':
      case 'rechazado':
      case 'cancelado':
        return 'error';
      default:
        return 'help';
    }
  }
}
