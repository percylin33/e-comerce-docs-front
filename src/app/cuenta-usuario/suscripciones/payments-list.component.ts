import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { CartService } from '../../@core/backend/services/cart.service';
import { DecimalPipe, DatePipe } from '@angular/common';

@Component({
    selector: 'ngx-payments-list',
    template: `
    <div class="payments-list-v2">
      <div class="header-row">
        <h5>Historial de Pagos</h5>
        <!-- <span class="summary-badge" *ngIf="getOverdueCount() > 0">
        {{ getOverdueCount() }} vencidos
      </span> -->
    </div>
    
    <ul>
      @for (p of payments; track p) {
        <li>
          <div class="pago-item-v2" [class.vencido]="p.isOverdue">
            <div class="pago-left">
              <span class="id">#{{p.paymentId}}</span>
              <div class="status-container">
                <span class="status"
                  [class.pagado]="p.paymentStatus === 'PAGADO'"
                  [class.pendiente]="p.paymentStatus === 'PENDIENTE' && !p.isOverdue"
                  [class.vencido]="p.isOverdue">
                  {{ p.isOverdue ? 'VENCIDO' : p.paymentStatus }}
                </span>
                <!-- Información extra para vencidos -->
                @if (p.isOverdue) {
                  <div class="overdue-info">
                    <span class="days-late">⚠️ {{ p.daysOverdue }} días de atraso</span>
                  </div>
                }
              </div>
            </div>
            <div class="pago-right">
              <span class="amount">S/ {{p.amount | number:'1.2-2'}}</span>
              <div class="date-container">
                <span class="date-label">
                  {{ p.paymentStatus === 'PAGADO' ? 'Pagado el:' : 'Vence el:' }}
                </span>
                <span class="date" [class.text-danger]="p.isOverdue">
                  {{ (p.paymentStatus === 'PAGADO' ? (p.paymentDate || p.fechaVencimiento) : (p.fechaVencimiento || p.dueDate)) | date:'dd/MM/yyyy' }}
                </span>
              </div>
              <!-- BOTÓN PAGAR: solo visible/activo si la cuota es pagable según la lógica del padre -->
              @if (p.paymentStatus === 'PENDIENTE' && p.canPay) {
                <button
                  class="btn-pay"
                  (click)="payInstallment(p)">
                  Pagar Ahora
                </button>
              }
            </div>
          </div>
        </li>
      }
    </ul>
    </div>
    `,
    styles: [
        `
    .payments-list-v2 { padding: 10px; }
    
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    h5 { color: #1a1a1a; margin: 0; font-size: 1.2rem; font-weight: 800; }
    
    ul { list-style: none; padding: 0; margin: 0; }
    
    .pago-item-v2 { 
      display: flex; 
      justify-content: space-between;
      align-items: center; 
      padding: 1rem 1.5rem;
      margin-bottom: 0.75rem;
      background: #f8fafc;
      border: 1px solid #edf2f7;
      border-radius: 12px;
      color: #2d3748;
      transition: all 0.2s ease;
    }

    /* Estilo para items vencidos */
    .pago-item-v2.vencido {
      background: #fff5f5;
      border-color: #feb2b2;
    }

    .pago-item-v2:hover {
      background: #f1f5f9;
      border-color: #e2e8f0;
    }

    .pago-left, .pago-right {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .pago-right {
      align-items: flex-end;
    }

    .id { font-family: monospace; color: #718096; font-size: 0.8rem; font-weight: 600; }
    
    .status-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status { 
       font-weight: 700; 
       font-size: 0.7rem; 
       text-transform: uppercase; 
       padding: 0.25rem 0.6rem;
       border-radius: 6px;
    }
    
    .status.pagado { color: #10b981; background: #ecfdf5; }
    .status.pendiente { color: #718096; background: #e2e8f0; }
    .status.vencido { color: #c53030; background: #fed7d7; }

    .overdue-info {
      display: flex;
      align-items: center;
    }

    .days-late {
      font-size: 0.75rem;
      color: #c53030;
      font-weight: 600;
    }

    .amount { font-weight: 800; color: #1a1a1a; font-size: 1.1rem; }
    
    .date-container {
      display: flex;
      gap: 6px;
      align-items: center;
      font-size: 0.85rem;
    }

    .date-label { color: #718096; }
    .date { color: #2d3748; font-weight: 600; }
    .date.text-danger { color: #e53e3e; }

    .btn-pay {
      margin-top: 0.5rem;
      background: #2b36e8;
      color: white;
      border: none;
      padding: 0.4rem 1rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 5px rgba(43, 54, 232, 0.2);
    }

    .btn-pay:hover {
      background: #1a24b8;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(43, 54, 232, 0.3);
    }
    `
    ],
    standalone: true,
    imports: [DecimalPipe, DatePipe]
})
export class PaymentsListComponent implements OnChanges {
  @Input() payments: any[] = [];
  @Input() subscriptionTitle: string = ''; // To name the cart item correctly

  constructor(
    private cartService: CartService,
    private router: Router,
    private toastrService: NbToastrService
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.payments && this.payments) {
      try {
        console.debug('[PaymentsList] received payments:', this.payments.map(p => ({ id: p.paymentId ?? p.id ?? p.orderId, status: p.paymentStatus ?? p.status ?? p.estado, canPay: !!p.canPay })));
      } catch (e) {
        console.debug('[PaymentsList] debug error', e);
      }
    }
  }

  getOverdueCount() {
    return this.payments.filter(p => p.isOverdue).length;
  }

  payInstallment(payment: any) {
    // 1. Validar que sea pagable
    if (payment.paymentStatus === 'PAGADO') return;

    // 2. Limpiar carrito (política: pagos de cuota son únicos)
    this.cartService.clearCart();

    // 3. Crear item de carrito
    // Formato requerido por CartService.isPaymentQuota: title starts with 'Cuota -'
    const cartItem: any = {
      id: `quota-${payment.paymentId}`,
      title: `Cuota - ${this.subscriptionTitle || 'Suscripción'} - Vence: ${payment.dueDate || payment.date}`,
      price: payment.amount,
      quantity: 1,
      isSubscription: false,
      transactionType: 'installment', // Clave para checkout
      metadata: {
        paymentId: payment.paymentId,
        isInstallment: true
      },
      // Campos requeridos por la interfaz CartItem
      description: `Pago de cuota pendiente #${payment.paymentId}`,
      image: 'assets/images/subscription-payment.png' // Placeholder
    };

    // 4. Agregar al carrito
    this.cartService.addToCart(cartItem);

    // 5. Redirigir a checkout
    this.toastrService.info('Redirigiendo al pago...', 'Procesando');
    this.router.navigate(['/site/checkout']);
  }
}
