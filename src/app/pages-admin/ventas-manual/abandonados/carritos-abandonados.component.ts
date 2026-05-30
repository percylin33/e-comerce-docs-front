import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder, FormGroup, FormsModule, ReactiveFormsModule,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  MatFormField, MatLabel, MatHint, MatPrefix, MatSuffix,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import {
  MatDatepicker, MatDatepickerInput, MatDatepickerToggle,
} from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import {
  MatTableModule,
} from '@angular/material/table';

import { PaymentService } from '../../../@core/backend/services/payment.service';
import {
  AbandonedCartListParams,
  AbandonedCartSummary,
} from '../../../@core/interfaces/payments';

import {
  AbandonedCartDetailDialogComponent,
  AbandonedCartDetailDialogData,
} from './detail-dialog/abandoned-cart-detail-dialog.component';

interface AgeOption { value: number; label: string; }
interface StatusOption { value: string; label: string; }

/**
 * Pantalla admin "Carritos abandonados / Compras pendientes".
 *
 * Lista los PaymentIntents que el cliente inicio pero no termino de pagar.
 * Permite al admin: (a) ver el detalle, (b) convertir a venta manual en un
 * solo click (precargando el wizard), (c) reenviar el enlace de pago al
 * cliente por email, (d) descartar/limpiar el intent del listado.
 *
 * Requiere rol ADMIN o SUPADMIN.
 */
@Component({
  selector: 'ngx-carritos-abandonados',
  templateUrl: './carritos-abandonados.component.html',
  styleUrls: ['./carritos-abandonados.component.scss'],
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, DatePipe, DecimalPipe,
    MatButton, MatIconButton, MatCard, MatCardContent, MatIcon,
    MatProgressSpinner, MatFormField, MatLabel, MatHint, MatPrefix, MatSuffix,
    MatInput, MatSelect, MatOption, MatSlideToggle, MatTooltip,
    MatMenu, MatMenuItem, MatMenuTrigger, MatChipsModule,
    MatDatepicker, MatDatepickerInput, MatDatepickerToggle,
    MatPaginator, MatTableModule,
  ],
})
export class CarritosAbandonadosComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private location = inject(Location);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private paymentService = inject(PaymentService);

  private destroy$ = new Subject<void>();

  // ===== Roles =====
  canAccess = false;

  // ===== Tabla =====
  readonly displayedColumns = [
    'orderId', 'createdAt', 'customer', 'items',
    'expectedAmount', 'age', 'status', 'actions',
  ];

  data: AbandonedCartSummary[] = [];
  totalElements = 0;
  pageIndex = 0;
  pageSize = 20;
  readonly pageSizeOptions = [10, 20, 50, 100];
  loading = false;

  // ===== Filtros =====
  filtersForm!: FormGroup;

  readonly ageOptions: AgeOption[] = [
    { value: 0,  label: 'Cualquier antiguedad' },
    { value: 1,  label: 'Mas de 1 hora' },
    { value: 6,  label: 'Mas de 6 horas' },
    { value: 24, label: 'Mas de 24 horas' },
    { value: 72, label: 'Mas de 3 dias' },
  ];

  readonly statusOptions: StatusOption[] = [
    { value: '',           label: 'Todos los pendientes' },
    { value: 'PROCESSING', label: 'En proceso (PROCESSING)' },
    { value: 'FAILED',     label: 'Fallidos (FAILED)' },
    { value: '2',          label: 'Activos (2)' },
  ];

  // ===== Acciones por fila =====
  resendingMap: Record<string, boolean> = {};
  discardingMap: Record<string, boolean> = {};

  ngOnInit(): void {
    this.detectRoles();
    if (!this.canAccess) {
      this.snackBar.open(
        'No tiene permisos para ver compras pendientes.',
        'Cerrar', { duration: 4000 },
      );
      this.router.navigate(['/pages-admin/ventas']);
      return;
    }

    this.filtersForm = this.fb.group({
      fromDate: [null as Date | null],
      toDate: [null as Date | null],
      minHoursOld: [0],
      onlyGuests: [false],
      status: [''],
    });

    this.filtersForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(250))
      .subscribe(() => {
        this.pageIndex = 0;
        this.load();
      });

    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== Roles =====
  private detectRoles(): void {
    try {
      const raw = localStorage.getItem('currentUser');
      if (!raw) { this.canAccess = false; return; }
      const u = JSON.parse(raw);
      const roles: string[] = Array.isArray(u?.roles) ? u.roles : [];
      this.canAccess = roles.includes('ADMIN') || roles.includes('SUPADMIN');
    } catch {
      this.canAccess = false;
    }
  }

  // ===== Carga =====
  load(): void {
    this.loading = true;
    const params: AbandonedCartListParams = this.buildParams();
    this.paymentService.getAbandonedCarts(params).subscribe({
      next: env => {
        this.loading = false;
        if (env?.result && env.data) {
          this.data = env.data.data || [];
          this.totalElements = Number(env.data.totalElements || 0);
          // Si la paginacion del backend trae un page distinto, sincronizamos.
          if (typeof env.data.page === 'number') {
            this.pageIndex = env.data.page;
          }
        } else {
          this.data = [];
          this.totalElements = 0;
        }
      },
      error: () => {
        this.loading = false;
        this.data = [];
        this.totalElements = 0;
        this.snackBar.open(
          'Error consultando los carritos abandonados.',
          'Cerrar', { duration: 3500 },
        );
      },
    });
  }

  private buildParams(): AbandonedCartListParams {
    const v = this.filtersForm.value;
    const params: AbandonedCartListParams = {
      page: this.pageIndex,
      size: this.pageSize,
    };
    if (v.fromDate instanceof Date) {
      params.fromDate = this.toIsoDate(v.fromDate);
    }
    if (v.toDate instanceof Date) {
      params.toDate = this.toIsoDate(v.toDate);
    }
    if (typeof v.minHoursOld === 'number' && v.minHoursOld > 0) {
      params.minHoursOld = v.minHoursOld;
    }
    if (v.onlyGuests === true) {
      params.onlyGuests = true;
    }
    if (v.status) {
      params.status = v.status;
    }
    return params;
  }

  private toIsoDate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  onPageChange(ev: PageEvent): void {
    this.pageIndex = ev.pageIndex;
    this.pageSize = ev.pageSize;
    this.load();
  }

  resetFilters(): void {
    this.filtersForm.reset({
      fromDate: null,
      toDate: null,
      minHoursOld: 0,
      onlyGuests: false,
      status: '',
    });
  }

  refresh(): void {
    this.load();
  }

  // ===== Acciones =====
  goBack(): void {
    this.location.back();
  }

  goManualSale(): void {
    this.router.navigate(['/pages-admin/ventas/registrar']);
  }

  /**
   * Convierte un carrito a venta manual: navega al wizard pasando el orderId
   * como queryParam. El wizard se encargara de precargar via
   * GET /api/v1/admin/payments/abandoned/{orderId}/convert-prefill.
   */
  processAsManual(row: AbandonedCartSummary): void {
    this.router.navigate(
      ['/pages-admin/ventas/registrar'],
      { queryParams: { fromIntent: row.orderId } },
    );
  }

  /** Abre el modal con la informacion completa del carrito. */
  viewDetail(row: AbandonedCartSummary): void {
    const data: AbandonedCartDetailDialogData = { orderId: row.orderId };
    const ref = this.dialog.open<
      AbandonedCartDetailDialogComponent,
      AbandonedCartDetailDialogData,
      { action?: 'manual' | 'resend' | 'discard'; orderId?: string }
    >(AbandonedCartDetailDialogComponent, {
      data,
      width: '880px',
      maxWidth: '95vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      if (result.action === 'manual' && result.orderId) {
        this.processAsManual(row);
      } else if (result.action === 'resend' && result.orderId) {
        this.resendLink(row);
      } else if (result.action === 'discard' && result.orderId) {
        this.discard(row);
      }
    });
  }

  /** Reenvia el email de recordatorio de pago al cliente. */
  resendLink(row: AbandonedCartSummary): void {
    if (this.resendingMap[row.orderId]) return;
    this.resendingMap[row.orderId] = true;
    this.paymentService.resendPaymentLink(row.orderId).subscribe({
      next: env => {
        this.resendingMap[row.orderId] = false;
        if (env?.result && env.data) {
          this.snackBar.open(
            `Email de pago reenviado a ${env.data.sentTo} (${env.data.reminderCount}/${env.data.maxReminders}).`,
            'Cerrar', { duration: 4500 },
          );
          this.load();
        } else {
          this.snackBar.open(
            'No se pudo reenviar el enlace de pago.',
            'Cerrar', { duration: 3500 },
          );
        }
      },
      error: (err) => {
        this.resendingMap[row.orderId] = false;
        const msg = err?.error?.message
          || 'Error reenviando el enlace de pago.';
        this.snackBar.open(msg, 'Cerrar', { duration: 4500 });
      },
    });
  }

  /** Descarta (marca como DISCARDED) un carrito abandonado. */
  discard(row: AbandonedCartSummary): void {
    const reason = window.prompt(
      'Motivo del descarte (opcional, para auditoria):',
      '',
    );
    // Si el usuario cancela el prompt, no descartamos.
    if (reason === null) return;

    if (this.discardingMap[row.orderId]) return;
    this.discardingMap[row.orderId] = true;
    this.paymentService.discardAbandonedCart(row.orderId, reason || undefined).subscribe({
      next: () => {
        this.discardingMap[row.orderId] = false;
        this.snackBar.open(
          `Carrito ${row.orderId} descartado.`,
          'Cerrar', { duration: 3000 },
        );
        this.load();
      },
      error: (err) => {
        this.discardingMap[row.orderId] = false;
        const msg = err?.error?.message
          || 'Error descartando el carrito.';
        this.snackBar.open(msg, 'Cerrar', { duration: 4500 });
      },
    });
  }

  // ===== Utilidades de presentacion =====
  customerLabel(row: AbandonedCartSummary): string {
    if (row.customerType === 'REGISTERED') {
      return row.name || row.email || `ID ${row.userId ?? '-'}`;
    }
    return row.email || row.name || 'Invitado sin email';
  }

  customerSubLabel(row: AbandonedCartSummary): string {
    if (row.customerType === 'REGISTERED') {
      return row.email || '';
    }
    return row.phone ? `Tel: ${row.phone}` : '';
  }

  statusBadgeClass(status: string | undefined): string {
    const s = (status || '').toUpperCase();
    if (s === 'PROCESSING') return 'badge badge--processing';
    if (s === 'FAILED') return 'badge badge--failed';
    if (s === '2') return 'badge badge--active';
    if (s === 'DISCARDED') return 'badge badge--discarded';
    return 'badge';
  }

  statusLabel(status: string | undefined): string {
    const s = (status || '').toUpperCase();
    if (s === 'PROCESSING') return 'En proceso';
    if (s === 'FAILED') return 'Fallido';
    if (s === '2') return 'Activo';
    if (s === 'DISCARDED') return 'Descartado';
    return status || '-';
  }

  ageBadgeClass(hours: number | undefined): string {
    const h = Number(hours || 0);
    if (h < 6) return 'age-pill age-pill--fresh';
    if (h < 24) return 'age-pill age-pill--warm';
    if (h < 72) return 'age-pill age-pill--hot';
    return 'age-pill age-pill--cold';
  }

  ageLabel(hours: number | undefined): string {
    const h = Math.max(0, Math.round(Number(hours || 0)));
    if (h < 1) return '< 1 h';
    if (h < 24) return `${h} h`;
    const days = Math.floor(h / 24);
    const rem = h % 24;
    return rem === 0 ? `${days} d` : `${days}d ${rem}h`;
  }

  itemsTooltip(row: AbandonedCartSummary): string {
    const list = row.itemsSummary || [];
    return list.length ? list.join('\n') : 'Sin items registrados';
  }

  itemsBrief(row: AbandonedCartSummary): string {
    const n = row.itemsCount || 0;
    if (n === 0) return 'Sin items';
    if (n === 1) return '1 producto';
    return `${n} productos`;
  }

  hasReminderHistory(row: AbandonedCartSummary): boolean {
    return !!(row.reminderCount && row.reminderCount > 0);
  }

  hasResults(): boolean {
    return !this.loading && this.data.length > 0;
  }
}
