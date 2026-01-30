import { Component, Input } from '@angular/core';

@Component({
  selector: 'ngx-payments-list',
  template: `
    <div class="payments-list-v2">
      <h5>Historial de Pagos</h5>
      <ul>
        <li *ngFor="let p of payments">
          <div class="pago-item-v2">
            <span class="id">#{{p.paymentId}}</span>
            <span class="status">{{p.paymentStatus}}</span>
            <span class="amount">S/ {{p.amount}}</span>
            <span class="date">{{p.paymentDate | date:'dd/MM/yyyy'}}</span>
          </div>
        </li>
      </ul>
    </div>
  `,
  styles: [
    `
    .payments-list-v2 { 
      padding: 10px;
    }
    h5 { color: #1a1a1a; margin-bottom: 1.5rem; font-size: 1.2rem; font-weight: 800; }
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
    .pago-item-v2:hover {
      background: #f1f5f9;
      border-color: #e2e8f0;
    }
    .id { font-family: monospace; color: #718096; font-size: 0.85rem; font-weight: 600; }
    .status { 
       font-weight: 700; 
       font-size: 0.75rem; 
       text-transform: uppercase; 
       color: #10b981; 
       background: #ecfdf5;
       padding: 0.2rem 0.6rem;
       border-radius: 6px;
    }
    .amount { font-weight: 800; color: #1a1a1a; font-size: 1rem; }
    .date { color: #718096; font-size: 0.9rem; }
    `
  ]
})
export class PaymentsListComponent {
  @Input() payments: any[] = [];
}
