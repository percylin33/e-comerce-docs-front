import { Component, Input, OnInit, inject } from '@angular/core';
import { MembershipService } from './membership.service';
import { NgClass, DatePipe } from '@angular/common';
import { PaymentsListComponent } from './payments-list.component';
import { MembershipDetailsComponent } from './membership-details.component';
import { DocumentsListComponent } from './documents-list.component';
import { SubscriptionAlertComponent } from '../../@theme/components/subscription-alert/subscription-alert.component';

@Component({
    selector: 'ngx-membership-card',
    template: `
    <div class="membership-card-v2" tabindex="0" [attr.aria-labelledby]="'membership-title-' + (subscription?.id || subscription?.subscriptionId)">
      <div class="card-indicator"
        [class.activa]="statusInfo.cssClass === 'activa'"
        [class.inactiva]="statusInfo.cssClass === 'inactiva'"
        [class.inactiva-overdue]="statusInfo.cssClass === 'inactiva-overdue'"
        [class.inactiva-temp]="statusInfo.cssClass === 'inactiva-temp'">
      </div>
    
      <div class="card-main">
    
        <!-- Alert: INACTIVA por pago vencido (dentro del periodo comprado) -->
        @if (statusInfo.cssClass === 'inactiva-overdue') {
          <ngx-subscription-alert
            type="error"
            icon="💸"
            title="Suspendida por pago vencido"
            [message]="statusInfo.alertMessage!"
            ctaText="Ver Pagos Pendientes"
            (ctaClick)="loadPayments()">
          </ngx-subscription-alert>
        }
    
        <!-- Alert: INACTIVA temporal (otro motivo, dentro del periodo comprado) -->
        @if (statusInfo.cssClass === 'inactiva-temp') {
          <ngx-subscription-alert
            type="warning"
            icon="⚠️"
            title="Suscripción suspendida temporalmente"
            [message]="statusInfo.alertMessage!"
            ctaText="Ver Pagos"
            (ctaClick)="loadPayments()">
          </ngx-subscription-alert>
        }
    
        <!-- Alert: genuinamente INACTIVA (periodo ya expirado) -->
        @if (statusInfo.cssClass === 'inactiva') {
          <ngx-subscription-alert
            type="error"
            icon="🚫"
            title="Suscripción finalizada"
            [message]="getInactiveMessage()"
            ctaText="Ver Detalle"
            (ctaClick)="loadDetails()">
          </ngx-subscription-alert>
        }
    
        <!-- Motivo de cancelación registrado por el administrador -->
        @if (subscription?.cancelReason) {
          <div class="cancel-reason-note">
            <span class="cancel-note-icon">🚫</span>
            <div class="cancel-note-body">
              <strong class="cancel-note-label">Motivo de cancelación:</strong>
              <span class="cancel-note-text">{{ subscription.cancelReason }}</span>
              @if (subscription?.canceledBy) {
                <span class="cancel-note-by"> — por {{ subscription.canceledBy }}</span>
              }
            </div>
          </div>
        }
    
        <!-- Alert: ACTIVA con pago próximo a vencer -->
        @if (statusInfo.alertType === 'due-soon') {
          <div class="alert-due-soon">
            <span class="alert-icon">⏰</span>
            <div class="alert-body">
              <strong>Pago próximo a vencer</strong>
              <p>{{ statusInfo.alertMessage }}</p>
            </div>
            <button class="alert-cta" (click)="loadPayments()">Ver Pagos</button>
          </div>
        }
    
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
    
          <div class="status-pill" [ngClass]="statusInfo.cssClass">
            {{ statusInfo.label }}
          </div>
        </div>
    
        <div class="card-actions-v2">
          <button class="btn-card payments" (click)="loadPayments()" [class.active]="paymentsLoaded" [disabled]="loadingPayments">
            <span class="btn-icon">
              @if (loadingPayments) {
                <span class="loading-spinner-mini"></span>
              }
              @if (!loadingPayments) {
                <span>💰</span>
              }
            </span>
            Pagos
            <span class="badge-mini secondary">{{ paymentsCount }}</span>
            @if (loadingPayments) {
              <span class="loading-text">Cargando...</span>
            }
          </button>
    
          <button class="btn-card details" (click)="loadDetails()" [class.active]="detailsLoaded" [disabled]="loadingDetails">
            <span class="btn-icon">
              @if (loadingDetails) {
                <span class="loading-spinner-mini"></span>
              }
              @if (!loadingDetails) {
                <span>ℹ️</span>
              }
            </span>
            Detalles
            @if (loadingDetails) {
              <span class="loading-text">Cargando...</span>
            }
          </button>
    
          <button class="btn-card documents" (click)="loadDocuments()" [class.active]="documentsLoaded" [disabled]="loadingDocuments">
            <span class="btn-icon">
              @if (loadingDocuments) {
                <span class="loading-spinner-mini"></span>
              }
              @if (!loadingDocuments) {
                <span>📄</span>
              }
            </span>
            Documentos
            @if (documentsCountKnown) {
              <span class="badge-mini yellow">{{ documentsCount }}</span>
            }
            @if (loadingDocuments) {
              <span class="loading-text">Cargando...</span>
            }
          </button>
        </div>
    
        <div class="card-content-v2" [class.expanded]="paymentsLoaded || detailsLoaded || documentsLoaded || loadingPayments || loadingDetails || loadingDocuments">
          <!-- Loading states -->
          @if (loadingPayments) {
            <div class="content-loading">
              <div class="loading-indicator">
                <div class="loading-spinner"></div>
                <p>📊 Cargando información de pagos...</p>
              </div>
            </div>
          }
    
          @if (loadingDetails) {
            <div class="content-loading">
              <div class="loading-indicator">
                <div class="loading-spinner"></div>
                <p>ℹ️ Cargando detalles de la membresía...</p>
              </div>
            </div>
          }
    
          @if (loadingDocuments) {
            <div class="content-loading">
              <div class="loading-indicator">
                <div class="loading-spinner"></div>
                <p>📚 Cargando documentos disponibles...</p>
              </div>
            </div>
          }
    
          <!-- Content sections -->
          @if (paymentsLoaded) {
            <div class="content-anim">
              <ngx-payments-list
                [payments]="payments"
                [subscriptionTitle]="subscription?.membresiaNombre || 'Membresía'">
              </ngx-payments-list>
            </div>
          }
          @if (detailsLoaded) {
            <div class="content-anim">
              <ngx-membership-details [details]="details"></ngx-membership-details>
            </div>
          }
          @if (documentsLoaded) {
            <div class="content-anim">
              <!-- Pasamos el estado de la suscripción a la lista de documentos -->
              <ngx-documents-list
                [documents]="documents"
                [subscriptionStatus]="subscription?.estado"
                (viewPaymentsRequested)="loadPayments()">
              </ngx-documents-list>
            </div>
          }
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

    .status-pill.inactiva-overdue {
      background: #fff3e0;
      color: #e65100;
      border-color: #ffcc80;
      font-size: 0.72rem;
    }

    .status-pill.inactiva-temp {
      background: #fffde7;
      color: #f57f17;
      border-color: #fff176;
      font-size: 0.72rem;
    }

    /* Alert banner for due-soon (ACTIVA) */
    .alert-due-soon {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #fffde7;
      border: 1px solid #f9a825;
      border-left: 4px solid #f9a825;
      border-radius: 10px;
      padding: 0.9rem 1.2rem;
      margin-bottom: 1.2rem;
      font-size: 0.9rem;
    }

    .alert-due-soon .alert-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .alert-due-soon .alert-body {
      flex: 1;
    }

    .alert-due-soon .alert-body strong {
      display: block;
      color: #e65100;
      margin-bottom: 0.2rem;
      font-size: 0.9rem;
    }

    .alert-due-soon .alert-body p {
      margin: 0;
      color: #5d4037;
      font-size: 0.85rem;
    }

    .alert-due-soon .alert-cta {
      background: #f9a825;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 0.5rem 1rem;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.2s;
    }

    .alert-due-soon .alert-cta:hover {
      background: #e65100;
    }

    /* Motivo de cancelación (admin/sistema) */
    .cancel-reason-note {
      display: flex;
      align-items: flex-start;
      gap: 0.7rem;
      background: #fff3e0;
      border: 1px solid #ffcc80;
      border-left: 4px solid #e65100;
      border-radius: 10px;
      padding: 0.85rem 1.2rem;
      margin-bottom: 1.2rem;
      font-size: 0.88rem;
    }

    .cancel-note-icon {
      font-size: 1.1rem;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .cancel-note-body {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      align-items: baseline;
      line-height: 1.5;
    }

    .cancel-note-label {
      color: #bf360c;
      font-weight: 700;
      white-space: nowrap;
    }

    .cancel-note-text {
      color: #5d4037;
    }

    .cancel-note-by {
      color: #9e9e9e;
      font-size: 0.8rem;
    }

    .card-indicator.inactiva {
      background: #f56565;
    }

    .card-indicator.inactiva-overdue {
      background: linear-gradient(135deg, #ed8936, #dd6b20);
    }

    .card-indicator.inactiva-temp {
      background: linear-gradient(135deg, #ecc94b, #d69e2e);
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
      overflow: visible;
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
      overflow: visible;
    }

    @keyframes fadeInSlide {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .membership-card-v2 {
        margin-bottom: 1.25rem;
        border-radius: 16px;
      }

      .membership-card-v2:hover {
        transform: none;
      }

      .card-main {
        padding: 1.25rem;
        min-width: 0;
      }

      .card-header-v2 {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }

      .info-group h2 {
        font-size: 1.25rem;
        word-break: break-word;
      }

      .period-subtitle {
        font-size: 0.875rem;
        flex-wrap: wrap;
      }

      .status-pill {
        align-self: flex-start;
        font-size: 0.72rem;
        padding: 0.4rem 0.9rem;
        max-width: 100%;
        text-align: center;
        line-height: 1.3;
      }

      .alert-due-soon {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
        padding: 0.85rem 1rem;
      }

      .alert-due-soon .alert-cta {
        width: 100%;
        text-align: center;
        padding: 0.65rem 1rem;
      }

      .cancel-reason-note {
        flex-direction: column;
        padding: 0.85rem 1rem;
      }

      .cancel-note-body {
        flex-direction: column;
        align-items: flex-start;
      }

      .card-actions-v2 {
        flex-direction: column;
        gap: 0.65rem;
      }

      .btn-card {
        width: 100%;
        justify-content: center;
        padding: 0.75rem 1rem;
        box-sizing: border-box;
      }

      .card-content-v2.expanded {
        max-height: none;
        overflow: visible;
        margin-top: 1.25rem;
        padding-top: 1.25rem;
      }

      .content-loading {
        padding: 2rem 1rem;
      }
    }

    @media (max-width: 480px) {
      .card-main {
        padding: 1rem;
      }

      .info-group h2 {
        font-size: 1.1rem;
      }

      .btn-card {
        font-size: 0.9rem;
        gap: 0.5rem;
      }
    }
    `
    ],
    standalone: true,
    imports: [NgClass, PaymentsListComponent, MembershipDetailsComponent, DocumentsListComponent, DatePipe, SubscriptionAlertComponent]
})
export class MembershipCardComponent implements OnInit {
  private membershipService = inject(MembershipService);

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

  /**
   * Computes display information for status pill, left indicator, and alert banners.
   * Detects temporarily-inactive subscriptions (INACTIVA but within purchase period).
   */
  get statusInfo(): { label: string; cssClass: string; alertType: string | null; alertMessage: string | null } {
    const s = this.subscription;
    if (!s) return { label: '', cssClass: '', alertType: null, alertMessage: null };
    const estado = (s.estado || '').toUpperCase();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    if (estado === 'INACTIVA') {
      const start = s.fechaInicioCompra;
      const end = s.fechaFin;
      if (start && end) {
        const s1 = new Date(start); s1.setHours(0, 0, 0, 0);
        const e = new Date(end); e.setHours(23, 59, 59, 999);
        if (today >= s1 && today <= e) {
          // Inside purchase period → temporary inactivation
          const pagos: any[] = s.pagos || s.raw?.pagos || [];
          const overduePending = pagos.filter((p: any) => {
            if ((p.paymentStatus || '').toUpperCase() !== 'PENDIENTE') return false;
            const due = p.fechaVencimiento || p.dueDate;
            return !!due && new Date(due) < today;
          });
          if (overduePending.length > 0 || s.inactiveReason?.code === 'OVERDUE_PAYMENT') {
            const count = overduePending.length || (s.inactiveReason?.overdueCount ?? 1);
            return {
              label: 'INACTIVA — Pago vencido',
              cssClass: 'inactiva-overdue',
              alertType: 'overdue',
              alertMessage: `Tu suscripción está suspendida por ${count} cuota(s) vencida(s). Ponlas al día para recuperar el acceso.`
            };
          }
          return {
            label: 'INACTIVA — Temporal',
            cssClass: 'inactiva-temp',
            alertType: 'warning',
            alertMessage: s.inactiveReason?.message || 'Tu suscripción ha sido suspendida temporalmente.'
          };
        }
      }
      // Outside purchase period → genuinely expired/inactive
      return { label: 'INACTIVA', cssClass: 'inactiva', alertType: null, alertMessage: null };
    }

    if (estado === 'ACTIVA') {
      const pagos: any[] = s.pagos || s.raw?.pagos || [];
      const limit = new Date(today); limit.setDate(limit.getDate() + 7);
      const dueSoon = pagos.filter((p: any) => {
        if ((p.paymentStatus || '').toUpperCase() !== 'PENDIENTE') return false;
        const due = p.fechaVencimiento || p.dueDate;
        if (!due) return false;
        const d = new Date(due); d.setHours(0, 0, 0, 0);
        return d >= today && d <= limit;
      });
      if (dueSoon.length > 0) {
        const next = dueSoon[0];
        const due = next.fechaVencimiento || next.dueDate;
        const d = new Date(due); d.setHours(0, 0, 0, 0);
        const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const dayStr = diff === 0 ? 'hoy' : diff === 1 ? 'mañana' : `en ${diff} días`;
        return {
          label: 'ACTIVA',
          cssClass: 'activa',
          alertType: 'due-soon',
          alertMessage: `Tienes ${dueSoon.length} cuota(s) próxima(s) a vencer. La próxima vence ${dayStr}.`
        };
      }
      return { label: 'ACTIVA', cssClass: 'activa', alertType: null, alertMessage: null };
    }

    return { label: estado, cssClass: estado.toLowerCase(), alertType: null, alertMessage: null };
  }

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

    // Normalizar paymentStatus, limpiar canPay y calcular isOverdue/daysOverdue
    const todayMs = new Date().setHours(0, 0, 0, 0);
    payments.forEach((pay: any) => {
      try {
        const raw = pay.paymentStatus ?? pay.status ?? pay.estado ?? '';
        pay.paymentStatus = String(raw || '').toString().trim().toUpperCase();
      } catch (e) {
        pay.paymentStatus = pay.paymentStatus || pay.status || pay.estado || '';
      }
      pay.canPay = false;

      // Calcular isOverdue y daysOverdue para PENDIENTES
      const dueRaw = pay.fechaVencimiento || pay.dueDate || pay.paymentDate;
      if (pay.paymentStatus === 'PENDIENTE' && dueRaw) {
        const dueMs = new Date(dueRaw).setHours(0, 0, 0, 0);
        if (dueMs < todayMs) {
          pay.isOverdue = true;
          pay.daysOverdue = Math.round((todayMs - dueMs) / (1000 * 60 * 60 * 24));
        } else {
          pay.isOverdue = false;
          pay.daysOverdue = 0;
        }
      } else {
        pay.isOverdue = false;
        pay.daysOverdue = 0;
      }
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
