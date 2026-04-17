import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Payment, EditPaymentRequest, SuscripcionesData } from '../../../@core/interfaces/suscripciones';
import { MatSnackBar } from '@angular/material/snack-bar';

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
            <mat-card class="pago-card" [class.pago-manual]="isManual(pago.paymentStatus)" *ngFor="let pago of data.pagos; let i = index">
              <mat-card-content>
                <div class="pago-header">
                  <div class="pago-number">
                    <mat-icon>receipt</mat-icon>
                    <span>Cuota {{ i + 1 }}</span>
                    <span class="pago-id">#{{ pago.paymentId }}</span>
                  </div>
                  <div class="pago-header-actions">
                    <span class="status-badge" [class]="getStatusClass(pago.paymentStatus)">
                      <mat-icon>{{ getStatusIcon(pago.paymentStatus) }}</mat-icon>
                      {{ pago.paymentStatus }}
                    </span>
                    <button mat-icon-button class="edit-btn" 
                            (click)="toggleEdit(i)" 
                            [matTooltip]="editingIndex === i ? 'Cancelar' : 'Editar pago'"
                            *ngIf="editingIndex !== i">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button class="cancel-edit-btn" 
                            (click)="cancelEdit()" 
                            matTooltip="Cancelar edición"
                            *ngIf="editingIndex === i">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
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
                    <div class="detail-content" *ngIf="editingIndex !== i">
                      <span class="detail-label">Monto</span>
                      <span class="detail-value amount">{{ pago.amount | currency:'PEN':'symbol':'1.2-2' }}</span>
                    </div>
                    <div class="detail-content edit-field" *ngIf="editingIndex === i">
                      <span class="detail-label">Monto</span>
                      <mat-form-field appearance="outline" class="inline-field">
                        <input matInput type="number" [(ngModel)]="editAmount" min="0" step="0.01" (wheel)="$event.preventDefault()">
                      </mat-form-field>
                    </div>
                  </div>
                </div>

                <!-- Edit panel -->
                <div class="edit-panel" *ngIf="editingIndex === i">
                  <div class="edit-status-row">
                    <span class="edit-label">Cambiar estado:</span>
                    <div class="status-buttons">
                      <button mat-raised-button 
                              [color]="editStatus === 'PAGADO' ? 'primary' : ''"
                              (click)="editStatus = 'PAGADO'"
                              class="status-btn">
                        <mat-icon>check_circle</mat-icon> PAGADO
                      </button>
                      <button mat-raised-button 
                              [color]="editStatus === 'PENDIENTE' ? 'warn' : ''"
                              (click)="editStatus = 'PENDIENTE'"
                              class="status-btn">
                        <mat-icon>schedule</mat-icon> PENDIENTE
                      </button>
                    </div>
                  </div>
                  <mat-form-field appearance="outline" class="reason-field">
                    <mat-label>Motivo del cambio (obligatorio)</mat-label>
                    <textarea matInput [(ngModel)]="editReason" rows="2" maxlength="500"></textarea>
                  </mat-form-field>
                  <div class="edit-actions">
                    <button mat-raised-button color="primary" 
                            (click)="saveEdit(pago)"
                            [disabled]="!editReason?.trim() || saving">
                      <mat-icon>save</mat-icon>
                      {{ saving ? 'Guardando...' : 'Guardar' }}
                    </button>
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
  editingIndex: number | null = null;
  editAmount: number = 0;
  editStatus: string = '';
  editReason: string = '';
  saving = false;
  modified = false;

  constructor(
    public dialogRef: MatDialogRef<PagosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PagosDialogData,
    private suscripcionesService: SuscripcionesData,
    private snackBar: MatSnackBar
  ) {
    this.data.pagos = this.data.pagos.sort((a, b) => a.paymentId - b.paymentId);
  }

  cerrar(): void {
    this.dialogRef.close(this.modified);
  }

  toggleEdit(index: number): void {
    const pago = this.data.pagos[index];
    this.editingIndex = index;
    this.editAmount = pago.amount;
    const upper = pago.paymentStatus?.toUpperCase();
    this.editStatus = (upper === 'PAGADO' || upper === 'PAGADO_MANUAL') ? 'PAGADO' : 'PENDIENTE';
    this.editReason = '';
  }

  cancelEdit(): void {
    this.editingIndex = null;
    this.editReason = '';
  }

  saveEdit(pago: Payment): void {
    if (!this.editReason?.trim()) return;
    this.saving = true;

    const request: EditPaymentRequest = {
      paymentId: pago.paymentId,
      amount: this.editAmount,
      paymentStatus: this.editStatus,
      reason: this.editReason.trim()
    };

    this.suscripcionesService.editPayment(request).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.result) {
          pago.paymentStatus = this.editStatus === 'PAGADO' ? 'PAGADO_MANUAL' : 'PENDIENTE';
          pago.amount = this.editAmount;
          pago.paymentDate = new Date().toISOString();
          this.editingIndex = null;
          this.editReason = '';
          this.modified = true;
          this.snackBar.open('Pago actualizado correctamente', 'OK', { duration: 3000 });
        } else {
          this.snackBar.open('Error al actualizar el pago', 'Cerrar', { duration: 5000 });
        }
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open('Error: ' + (err?.error?.data || 'No se pudo actualizar'), 'Cerrar', { duration: 5000 });
      }
    });
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
      case 'pagado_manual':
        return 'status-manual';
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

  isManual(status: string): boolean {
    return status?.toLowerCase() === 'pagado_manual';
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completado':
      case 'pagado':
      case 'aprobado':
        return 'check_circle';
      case 'pagado_manual':
        return 'admin_panel_settings';
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
