import { Component, Input, OnInit } from '@angular/core';
import { MembershipService } from './membership.service';

@Component({
  selector: 'ngx-membership-card',
  template: `
    <div class="membership-card-v2" tabindex="0" [attr.aria-labelledby]="'membership-title-' + (subscription?.id || subscription?.subscriptionId)">
      <div class="card-indicator" [class.activa]="subscription?.estado === 'ACTIVA'"></div>
      
      <div class="card-main">
        <div class="card-header-v2">
          <div class="info-group">
            <h2 id="membership-title-{{subscription?.id || subscription?.subscriptionId}}">
              {{ subscription?.nombre || 'Membresía' }}
            </h2>
            <div class="period-subtitle">
              <span class="icon">📅</span> 
              {{ subscription?.fechaInicio | date:'dd/MM/yyyy' }} - {{ subscription?.fechaFin | date:'dd/MM/yyyy' }}
            </div>
          </div>
          
          <div class="status-pill" [class.activa]="subscription?.estado === 'ACTIVA'">
             {{ subscription?.estado }}
          </div>
        </div>

        <div class="card-actions-v2">
          <button class="btn-card payments" (click)="loadPayments()" [class.active]="paymentsLoaded" [disabled]="loadingPayments">
            <span class="btn-icon">💰</span> Pagos <span class="badge-mini secondary">{{ paymentsCount }}</span>
          </button>
          
          <button class="btn-card details" (click)="loadDetails()" [class.active]="detailsLoaded" [disabled]="loadingDetails">
            <span class="btn-icon">ℹ️</span> Detalles
          </button>
          
          <button class="btn-card documents" (click)="loadDocuments()" [class.active]="documentsLoaded" [disabled]="loadingDocuments">
            <span class="btn-icon">📄</span> Documentos <span class="badge-mini yellow">{{ documentsCount }}</span>
          </button>
        </div>

        <div class="card-content-v2" [class.expanded]="paymentsLoaded || detailsLoaded || documentsLoaded">
          <div class="content-anim" *ngIf="paymentsLoaded">
            <ngx-payments-list [payments]="payments"></ngx-payments-list>
          </div>
          <div class="content-anim" *ngIf="detailsLoaded">
            <ngx-membership-details [details]="details"></ngx-membership-details>
          </div>
          <div class="content-anim" *ngIf="documentsLoaded">
            <ngx-documents-list [documents]="documents"></ngx-documents-list>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    .membership-card-v2 {
      background: #ffffff;
      border-radius: 20px;
      margin-bottom: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      border: 1px solid #eef2f7;
      display: flex;
      overflow: hidden;
      transition: all 0.3s ease;
      position: relative;
    }

    .membership-card-v2:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 30px rgba(43, 54, 232, 0.08);
      border-color: #2b36e822;
    }

    .card-indicator {
      width: 6px;
      background: #e2e8f0;
      flex-shrink: 0;
    }

    .card-indicator.activa {
      background: #2b36e8; /* Blue like the sidebar */
    }

    .card-main {
      padding: 2rem;
      flex-grow: 1;
    }

    .card-header-v2 {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .info-group h2 {
      color: #1a1a1a;
      font-size: 1.6rem;
      font-weight: 800;
      margin: 0 0 0.5rem 0;
    }

    .period-subtitle {
      color: #718096;
      font-size: 0.95rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-pill {
      padding: 0.5rem 1.2rem;
      border-radius: 30px;
      font-size: 0.8rem;
      font-weight: 700;
      background: #f7fafc;
      color: #4a5568;
      border: 1px solid #edf2f7;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-pill.activa {
      background: #f0f4ff;
      color: #2b36e8;
      border-color: #2b36e822;
    }

    .card-actions-v2 {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .btn-card {
      background: white;
      border: 1px solid #e2e8f0;
      padding: 0.8rem 1.5rem;
      border-radius: 14px;
      font-size: 0.95rem;
      font-weight: 600;
      color: #4a5568;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      transition: all 0.2s ease;
    }

    .btn-card:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e0;
      transform: translateY(-2px);
    }

    .btn-card.active {
      border-color: #2b36e8;
      background: #fbdf32; /* Yellow from Palette */
      color: #2b36e8;
      box-shadow: 0 4px 12px rgba(251, 211, 50, 0.3);
    }

    .btn-icon {
      font-size: 1.1rem;
    }

    .badge-mini {
      font-size: 0.75rem;
      padding: 0.1rem 0.6rem;
      border-radius: 8px;
      font-weight: 700;
    }

    .badge-mini.secondary { background: #edf2f7; color: #4a5568; }
    .badge-mini.yellow { background: #fbdf32; color: #2b36e8; }
    
    .btn-card.active .badge-mini {
       background: #2b36e811;
       color: #2b36e8;
    }

    .card-content-v2 {
      max-height: 0;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      margin-top: 0;
    }

    .card-content-v2.expanded {
      max-height: 1200px;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #f1f5f9;
    }

    .content-anim {
      animation: fadeInSlide 0.4s ease-out;
    }

    @keyframes fadeInSlide {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    `
  ]
})
export class MembershipCardComponent implements OnInit {
  @Input() subscription: any = null;
  @Input() userId: number = 0;

  payments: any[] = [];
  details: any = null;
  documents: any = null;

  paymentsCount = 0;
  documentsCount = 0;

  paymentsLoaded = false;
  detailsLoaded = false;
  documentsLoaded = false;

  loadingPayments = false;
  loadingDetails = false;
  loadingDocuments = false;

  constructor(private membershipService: MembershipService) { }

  ngOnInit() {
    if (this.subscription) {
      // Use counts from summary if available
      if (this.subscription.counts) {
        this.paymentsCount = this.subscription.counts.payments || 0;
        this.documentsCount = this.subscription.counts.documents || 0;
      }

      // If counts are missing or 0, we could prefetch, but let's stick to the plan
      // and only load data when requested, using the summary as the initial state.
      if (this.subscription.id || this.subscription.subscriptionId) {
        const subId = this.subscription.id || this.subscription.subscriptionId;

        // If counts weren't in summary, we can fetch them once
        if (this.paymentsCount === 0 && !this.subscription.counts) {
          this.membershipService.getPaymentsForSubscription(subId).subscribe(p => {
            this.paymentsCount = (p || []).length;
          }, () => this.paymentsCount = 0);
        }

        if (this.documentsCount === 0 && !this.subscription.counts) {
          this.membershipService.getDocumentsForSubscription(subId).subscribe(d => {
            this.documentsCount = this.countDocuments(d);
          }, () => this.documentsCount = 0);
        }
      }
    }
  }

  private countDocuments(d: any): number {
    let count = 0;
    if (d) {
      Object.keys(d).forEach(unidad => {
        const materias = d[unidad] || {};
        Object.keys(materias).forEach(materia => {
          const grados = materias[materia] || {};
          Object.keys(grados).forEach(grado => {
            const docs = grados[grado] || [];
            count += docs.length;
          });
        });
      });
    }
    return count;
  }

  loadPayments() {
    // Si ya está abierto, lo cerramos (Toggle)
    if (this.paymentsLoaded) {
      this.paymentsLoaded = false;
      return;
    }

    // Cerramos los otros
    this.detailsLoaded = false;
    this.documentsLoaded = false;

    const subId = this.subscription?.id || this.subscription?.subscriptionId;
    if (!subId || this.loadingPayments) return;

    // Si ya tenemos datos, solo mostramos
    if (this.payments.length > 0) {
      this.paymentsLoaded = true;
      return;
    }

    this.loadingPayments = true;
    this.membershipService.getPaymentsForSubscription(subId).subscribe(p => {
      this.payments = p || [];
      this.paymentsLoaded = true;
      this.loadingPayments = false;
      this.paymentsCount = this.payments.length;
    }, (err) => {
      console.error('[MembershipCard] Error al cargar pagos', err);
      this.loadingPayments = false;
    });
  }

  loadDetails() {
    if (this.detailsLoaded) {
      this.detailsLoaded = false;
      return;
    }

    this.paymentsLoaded = false;
    this.documentsLoaded = false;

    const subId = this.subscription?.id || this.subscription?.subscriptionId;
    if (!subId || this.loadingDetails) return;

    if (this.details) {
      this.detailsLoaded = true;
      return;
    }

    this.loadingDetails = true;
    this.membershipService.getDetailsForSubscription(subId).subscribe(d => {
      this.details = d;
      this.detailsLoaded = true;
      this.loadingDetails = false;
    }, (err) => {
      console.error('[MembershipCard] Error al cargar detalles', err);
      this.loadingDetails = false;
    });
  }

  loadDocuments() {
    if (this.documentsLoaded) {
      this.documentsLoaded = false;
      return;
    }

    this.paymentsLoaded = false;
    this.detailsLoaded = false;

    const subId = this.subscription?.id || this.subscription?.subscriptionId;
    if (!subId || this.loadingDocuments) return;

    if (this.documents) {
      this.documentsLoaded = true;
      return;
    }

    this.loadingDocuments = true;
    this.membershipService.getDocumentsForSubscription(subId).subscribe(response => {
      // El backend ahora devuelve directamente la estructura agrupada:
      // Map<Unidad, Map<Materia, Map<Grado, List<Docs>>>>

      if (response && Object.keys(response).length > 0) {
        this.documents = response;

        // Calcular conteo total para el badge (si es necesario)
        let total = 0;
        Object.values(response).forEach((matMap: any) => {
          Object.values(matMap).forEach((gradeMap: any) => {
            Object.values(gradeMap).forEach((list: any) => {
              if (Array.isArray(list)) total += list.length;
            });
          });
        });
        this.documentsCount = total;
      } else {
        this.documents = {};
        this.documentsCount = 0;
      }

      this.documentsLoaded = true;
      this.loadingDocuments = false;
    }, (err) => {
      console.error('[MembershipCard] Error al cargar documentos', err);
      this.loadingDocuments = false;
    });
  }
}
