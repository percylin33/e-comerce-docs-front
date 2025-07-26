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
  styles: [`
    .dialog-container {
      min-width: 450px;
      max-width: 650px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem 0.75rem 1.5rem;
      border-bottom: 1px solid #e0e0e0;
      position: relative;
      flex-shrink: 0;
      
      .payment-icon {
        color: #2196f3;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      
      h2 {
        margin: 0;
        flex: 1;
        color: #333;
        font-weight: 600;
        font-size: 1.3rem;
      }
      
      .close-btn {
        position: absolute;
        right: 0.5rem;
        //top: -4px;
      }
    }
    
    .pagos-content {
      max-height: 450px;
      overflow-y: auto;
      padding: 0.75rem 1.5rem;
      flex: 1;
    }
    
    .no-pagos {
      text-align: center;
      padding: 2rem 1rem;
      color: #666;
      
      .empty-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 0.75rem;
        color: #ccc;
      }
      
      h3 {
        margin: 0 0 0.25rem 0;
        color: #999;
        font-size: 1.1rem;
      }
      
      p {
        margin: 0;
        font-size: 0.85rem;
      }
    }
    
    .pagos-summary {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
      
      .summary-card {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
        border-radius: 6px;
        border-left: 3px solid #2196f3;
        
        mat-icon {
          color: #2196f3;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
        
        .summary-info {
          display: flex;
          flex-direction: column;
          
          .summary-label {
            font-size: 0.7rem;
            color: #666;
            font-weight: 500;
            line-height: 1;
          }
          
          .summary-value {
            font-size: 1rem;
            font-weight: bold;
            color: #333;
            line-height: 1.2;
          }
        }
      }
    }
    
    .pagos-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .pago-card {
      border-radius: 6px;
      transition: all 0.3s ease;
      border-left: 3px solid #2196f3;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 15px rgba(0,0,0,0.08);
      }
      
      .mat-card-content {
        padding: 0.75rem !important;
      }
    }
    
    .pago-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      
      .pago-number {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-weight: 600;
        color: #333;
        font-size: 0.9rem;
        
        mat-icon {
          color: #666;
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }
    
    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.3rem 0.6rem;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 600;
      
      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }
    
    .status-completado {
      background-color: #e8f5e8;
      color: #2e7d32;
      border: 1px solid #c8e6c9;
    }
    
    .status-pendiente {
      background-color: #fff3e0;
      color: #f57c00;
      border: 1px solid #ffcc02;
    }
    
    .status-fallido {
      background-color: #ffebee;
      color: #c62828;
      border: 1px solid #ffcdd2;
    }
    
    .status-default {
      background-color: #f5f5f5;
      color: #666;
      border: 1px solid #e0e0e0;
    }
    
    .pago-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .detail-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      .detail-icon {
        color: #666;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      
      .detail-content {
        display: flex;
        flex-direction: column;
        flex: 1;
        
        .detail-label {
          font-size: 0.7rem;
          color: #999;
          font-weight: 500;
          line-height: 1;
        }
        
        .detail-value {
          font-size: 0.85rem;
          color: #333;
          font-weight: 500;
          line-height: 1.2;
          
          &.amount {
            font-size: 0.95rem;
            font-weight: bold;
            color: #2196f3;
          }
        }
      }
    }
    
    .dialog-actions {
      display: flex;
      justify-content: center;
      padding: 0.75rem 1.5rem 1rem 1.5rem;
      border-top: 1px solid #e0e0e0;
      flex-shrink: 0;
      
      button {
        min-width: 120px;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.5rem 1.5rem;
        
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }
    
    @media (max-width: 600px) {
      .dialog-container {
        min-width: 280px;
        max-width: 95vw;
        max-height: 90vh;
      }
      
      .dialog-header {
        padding: 0.75rem 1rem 0.5rem 1rem;
        
        h2 {
          font-size: 1.1rem;
        }
        
        .payment-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }
      
      .pagos-content {
        padding: 0.5rem 1rem;
        max-height: calc(90vh - 150px);
      }
      
      .pagos-summary {
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        
        .summary-card {
          padding: 0.5rem;
          
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
          
          .summary-info {
            .summary-label {
              font-size: 0.65rem;
            }
            
            .summary-value {
              font-size: 0.9rem;
            }
          }
        }
      }
      
      .pagos-list {
        gap: 0.5rem;
      }
      
      .pago-card {
        .mat-card-content {
          padding: 0.5rem !important;
        }
      }
      
      .pago-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.4rem;
        margin-bottom: 0.5rem;
        
        .pago-number {
          font-size: 0.8rem;
          
          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
        
        .status-badge {
          align-self: flex-end;
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          
          mat-icon {
            font-size: 12px;
            width: 12px;
            height: 12px;
          }
        }
      }
      
      .pago-details {
        gap: 0.4rem;
      }
      
      .detail-row {
        gap: 0.4rem;
        
        .detail-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
        
        .detail-content {
          .detail-label {
            font-size: 0.65rem;
          }
          
          .detail-value {
            font-size: 0.8rem;
            
            &.amount {
              font-size: 0.85rem;
            }
          }
        }
      }
      
      .dialog-actions {
        padding: 0.5rem 1rem 0.75rem 1rem;
        
        button {
          min-width: 100px;
          padding: 0.4rem 1rem;
          font-size: 0.85rem;
          
          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }
        }
      }
    }
  `]
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
