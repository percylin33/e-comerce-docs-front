import { Component, Input, OnInit } from '@angular/core';
import { MembershipService } from './membership.service';

@Component({
  selector: 'ngx-membership-card',
  template: `
    <div class="membership-card-v2" tabindex="0" [attr.aria-labelledby]="'membership-title-' + (subscription?.id || subscription?.subscriptionId)">
      <div class="card-indicator" [class.activa]="subscription?.estado === 'ACTIVA'" [class.inactiva]="subscription?.estado === 'INACTIVA'"></div>
      
      <div class="card-main">
        
        <!-- ✅ NUEVO: Alert Banner para INACTIVA -->
        <app-subscription-alert
          *ngIf="subscription?.estado === 'INACTIVA'"
          type="error"
          icon="🚫"
          title="Suscripción Suspendida"
          [message]="getInactiveMessage()"
          ctaText="Ver Pagos Pendientes"
          (ctaClick)="loadPayments()">
        </app-subscription-alert>

        <div class="card-header-v2">
          <div class="info-group">
            <h2 id="membership-title-{{subscription?.id || subscription?.subscriptionId}}">
              {{ subscription?.membresiaNombre || 'Membresía' }}
            </h2>
            <div class="period-subtitle">
              <span class="icon">📅</span> 
              {{ subscription?.fechaInicio | date:'dd/MM/yyyy' }} - {{ subscription?.fechaFin | date:'dd/MM/yyyy' }}
            </div>
          </div>
          
          <div class="status-pill" [class.activa]="subscription?.estado === 'ACTIVA'" [class.inactiva]="subscription?.estado === 'INACTIVA'">
             {{ subscription?.estado }}
          </div>
        </div>

        <div class="card-actions-v2">
          <button class="btn-card payments" (click)="loadPayments()" [class.active]="paymentsLoaded" [disabled]="loadingPayments">
            <span class="btn-icon">
              <span *ngIf="loadingPayments" class="loading-spinner-mini"></span>
              <span *ngIf="!loadingPayments">💰</span>
            </span> 
            Pagos 
            <span class="badge-mini secondary">{{ paymentsCount }}</span>
            <span *ngIf="loadingPayments" class="loading-text">Cargando...</span>
          </button>
          
          <button class="btn-card details" (click)="loadDetails()" [class.active]="detailsLoaded" [disabled]="loadingDetails">
            <span class="btn-icon">
              <span *ngIf="loadingDetails" class="loading-spinner-mini"></span>
              <span *ngIf="!loadingDetails">ℹ️</span>
            </span> 
            Detalles
            <span *ngIf="loadingDetails" class="loading-text">Cargando...</span>
          </button>
          
          <button class="btn-card documents" (click)="loadDocuments()" [class.active]="documentsLoaded" [disabled]="loadingDocuments">
            <span class="btn-icon">
              <span *ngIf="loadingDocuments" class="loading-spinner-mini"></span>
              <span *ngIf="!loadingDocuments">📄</span>
            </span> 
            Documentos 
            <span *ngIf="documentsCountKnown" class="badge-mini yellow">{{ documentsCount }}</span>
            <span *ngIf="loadingDocuments" class="loading-text">Cargando...</span>
          </button>
        </div>

        <div class="card-content-v2" [class.expanded]="paymentsLoaded || detailsLoaded || documentsLoaded || loadingPayments || loadingDetails || loadingDocuments">
          <!-- Loading states -->
          <div class="content-loading" *ngIf="loadingPayments">
            <div class="loading-indicator">
              <div class="loading-spinner"></div>
              <p>📊 Cargando información de pagos...</p>
            </div>
          </div>
          
          <div class="content-loading" *ngIf="loadingDetails">
            <div class="loading-indicator">
              <div class="loading-spinner"></div>
              <p>ℹ️ Cargando detalles de la membresía...</p>
            </div>
          </div>
          
          <div class="content-loading" *ngIf="loadingDocuments">
            <div class="loading-indicator">
              <div class="loading-spinner"></div>
              <p>📚 Cargando documentos disponibles...</p>
            </div>
          </div>

          <!-- Content sections -->
          <div class="content-anim" *ngIf="paymentsLoaded">
            <ngx-payments-list 
              [payments]="payments"
              [subscriptionTitle]="subscription?.membresiaNombre || 'Membresía'">
            </ngx-payments-list>
          </div>
          <div class="content-anim" *ngIf="detailsLoaded">
            <ngx-membership-details [details]="details"></ngx-membership-details>
          </div>
          <div class="content-anim" *ngIf="documentsLoaded">
            <!-- Pasamos el estado de la suscripción a la lista de documentos -->
            <ngx-documents-list 
              [documents]="documents" 
              [subscriptionStatus]="subscription?.estado"
              (viewPaymentsRequested)="loadPayments()">
            </ngx-documents-list>
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

    .status-pill.inactiva {
      background: #fff5f5;
      color: #c53030;
      border-color: #feb2b2;
    }

    .card-indicator.inactiva {
      background: #f56565;
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
      position: relative;
      min-height: 44px;
    }

    .btn-card:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e0;
      transform: translateY(-1px);
    }

    .btn-card:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-card:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    .btn-card.active {
      background: #2b36e8;
      color: white;
      border-color: #2b36e8;
    }

    .btn-card.active .badge-mini {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
    }

    .loading-spinner-mini {
      width: 16px;
      height: 16px;
      border: 2px solid #e2e8f0;
      border-top: 2px solid #2b36e8;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      display: inline-block;
    }

    .loading-text {
      font-size: 0.8rem;
      opacity: 0.8;
      font-weight: 500;
    }

    .badge-mini {
      padding: 0.2rem 0.6rem;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-mini.secondary {
      background: #edf2f7;
      color: #4a5568;
    }

    .badge-mini.yellow {
      background: #fef5e7;
      color: #d69e2e;
    }

    .btn-card:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e0;
      transform: translateY(-2px);
    }

    .btn-card.active {
      border-color: #2b36e8;
      background: #ffd24a; /* Yellow from Palette */
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
    .badge-mini.yellow { background: #ffd24a; color: #2b36e8; }
    
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

    .content-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      background: white;
      border-radius: 12px;
      margin-bottom: 1rem;
      border: 1px solid #eef2f7;
    }

    .loading-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      text-align: center;
    }

    .loading-indicator p {
      color: #4a5568;
      font-weight: 500;
      margin: 0;
      font-size: 0.95rem;
    }

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top: 3px solid #2b36e8;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .content-anim {
      animation: fadeInSlide 0.4s ease-out;
      background: white;
      border-radius: 12px;
      border: 1px solid #eef2f7;
      margin-bottom: 1rem;
      overflow: hidden;
    }

    @keyframes fadeInSlide {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
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
  documentsCountKnown = false; // true solo cuando ya tenemos el conteo real (post-HTTP o counts confiable)

  paymentsLoaded = false;
  detailsLoaded = false;
  documentsLoaded = false;

  loadingPayments = false;
  loadingDetails = false;
  loadingDocuments = false;

  constructor(private membershipService: MembershipService) { }

  ngOnInit() {
    if (this.subscription) {
      // Usar pagos del @Input si ya vienen en la respuesta inicial (evita HTTP)
      const inlinePagos = this.subscription.pagos || this.subscription.raw?.pagos;
      if (inlinePagos?.length > 0) {
        this.paymentsCount = inlinePagos.length;
      } else if (this.subscription.counts?.payments) {
        this.paymentsCount = this.subscription.counts.payments;
      }

      // Conteo de documentos: solo mostrar badge si el valor viene pre-cargado y es > 0.
      // Si no hay counts confiable, dejar documentsCountKnown = false para no mostrar "0" al inicio.
      const preCount = this.subscription.counts?.documents || this.subscription.counts?.documentsCount;
      if (preCount > 0) {
        this.documentsCount = preCount;
        this.documentsCountKnown = true;
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

  // Procesa y normaliza un array crudo de pagos: ordena, detecta pagado y marca canPay
  private processPayments(rawPayments: any[]): any[] {
    const payments = (rawPayments || []).slice();

    payments.sort((a: any, b: any) => {
      const normalizeId = (x: any) => {
        if (!x) return 0;
        const raw = x.id ?? x.paymentId ?? x.orderId ?? x.numero ?? x;
        const digits = String(raw).replace(/\D+/g, '');
        const n = parseInt(digits, 10);
        return isNaN(n) ? String(raw) : n;
      };
      const ia: any = normalizeId(a);
      const ib: any = normalizeId(b);
      if (typeof ia === 'number' && typeof ib === 'number') return ia - ib;
      return String(ia).localeCompare(String(ib));
    });

    const isPaid = (it: any) => {
      if (!it) return false;
      const rawStatus = it.paymentStatus ?? it.status ?? it.estado ?? it.state ?? '';
      const s = String(rawStatus || '').toString().trim().toUpperCase();
      if (s.includes('PAGAD') || s.includes('PAID') || s.includes('COMPLET') || s === 'PAGO') return true;
      if (it.isPaid === true) return true;
      return false;
    };

    // Normalizar paymentStatus y limpiar canPay
    payments.forEach((pay: any) => {
      try {
        const raw = pay.paymentStatus ?? pay.status ?? pay.estado ?? '';
        pay.paymentStatus = String(raw || '').toString().trim().toUpperCase();
      } catch (e) {
        pay.paymentStatus = pay.paymentStatus || pay.status || pay.estado || '';
      }
      pay.canPay = false;
    });

    // El siguiente al último pagado es el candidato a pagar
    let lastPaidIndex = -1;
    payments.forEach((pay: any, idx: number) => {
      if (isPaid(pay)) lastPaidIndex = idx;
    });

    const candidate = payments[lastPaidIndex + 1];
    if (candidate && !isPaid(candidate)) {
      candidate.canPay = true;
    } else if (lastPaidIndex === -1) {
      const firstPending = payments.find((x: any) => !isPaid(x));
      if (firstPending) firstPending.canPay = true;
    }

    return payments;
  }

  loadPayments() {
    // Toggle: si ya está abierto, cerrar
    if (this.paymentsLoaded) {
      this.paymentsLoaded = false;
      return;
    }

    this.detailsLoaded = false;
    this.documentsLoaded = false;

    const subId = this.subscription?.id || this.subscription?.subscriptionId;
    if (!subId || this.loadingPayments) return;

    // Si ya fueron procesados antes, solo mostrar
    if (this.payments.length > 0) {
      this.paymentsLoaded = true;
      return;
    }

    // Usar pagos del @Input si ya vienen en la respuesta inicial — sin petición HTTP
    const inlinePagos = this.subscription?.pagos || this.subscription?.raw?.pagos;
    if (inlinePagos?.length > 0) {
      this.payments = this.processPayments(inlinePagos);
      this.paymentsCount = this.payments.length;
      this.paymentsLoaded = true;
      return;
    }

    // Fallback: petición HTTP si los pagos no vinieron en el @Input
    this.loadingPayments = true;
    this.membershipService.getPaymentsForSubscription(subId).subscribe(p => {
      this.payments = this.processPayments(p);
      this.paymentsCount = this.payments.length;
      this.paymentsLoaded = true;
      this.loadingPayments = false;
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

      this.documentsCountKnown = true; // ya tenemos el conteo real — mostrar badge (sea 0 o N)
      this.documentsLoaded = true;
      this.loadingDocuments = false;
    }, (err) => {
      console.error('[MembershipCard] Error al cargar documentos', err);
      this.loadingDocuments = false;
    });
  }

  getInactiveMessage(): string {
    // Fase 2: Uso del motivo de inactividad proveniente del Backend
    const reason = this.subscription?.inactiveReason;

    if (reason) {
      let title = 'Suscripción Suspendida';

      if (reason.code === 'OVERDUE_PAYMENT') {
        title = '¡Pagos Vencidos!';
      } else if (reason.code === 'EXPIRED') {
        title = '¡Suscripción Vencida!';
      }

      return `<strong>${title}</strong><br>${reason.message}`;
    }

    // Fallback para casos donde no llegue la info detallada
    return 'Tu suscripción se encuentra <strong>suspendida</strong>. <br>Es posible que tengas cuotas pendientes o que el periodo de vigencia haya terminado.';
  }
}
