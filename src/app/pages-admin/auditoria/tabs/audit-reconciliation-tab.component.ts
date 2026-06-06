import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  NbButtonModule,
  NbCardModule,
  NbDialogModule,
  NbDialogService,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbSelectModule,
  NbSpinnerModule,
  NbTagModule,
  NbToastrService,
  NbTooltipModule,
} from '@nebular/theme';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import {
  DiscrepancyFilter,
  DiscrepancyListResponse,
  DiscrepancyRow,
  ReconciliationApiService,
} from '../../../@core/backend/services/audit.service';
import { ResolveDiscrepancyModalComponent } from '../resolve-discrepancy/resolve-discrepancy-modal.component';

/**
 * Tab "Conciliación" del módulo de Auditoría.
 *
 * <p>Lista las discrepancias detectadas por los jobs {@code CulqiReconciliationJob}
 * y {@code PayPalReconciliationJob}, con filtros por gateway / estado / rango
 * de fechas. Permite:</p>
 * <ul>
 *   <li>Ver detalle del log (navega a la vista existente)</li>
 *   <li>Reprocesar como venta manual (abre el wizard pre-llenado con
 *       {@code sourceIntentOrderId} para enlazar correctamente)</li>
 *   <li>Marcar resuelto con nota obligatoria (modal)</li>
 * </ul>
 *
 * <p>Banner superior con resumen OPEN / RESOLVED total / RESOLVED hoy.</p>
 */
@Component({
  selector: 'ngx-audit-reconciliation-tab',
  standalone: true,
  templateUrl: './audit-reconciliation-tab.component.html',
  styleUrls: ['./audit-reconciliation-tab.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    NbCardModule,
    NbIconModule,
    NbInputModule,
    NbButtonModule,
    NbSelectModule,
    NbFormFieldModule,
    NbSpinnerModule,
    NbTagModule,
    NbTooltipModule,
    NbDialogModule,
    DatePipe,
  ],
})
export class AuditReconciliationTabComponent implements OnInit, OnDestroy {
  private api = inject(ReconciliationApiService);
  private router = inject(Router);
  private toastr = inject(NbToastrService);
  private dialog = inject(NbDialogService);

  private destroy$ = new Subject<void>();
  private searchTrigger$ = new Subject<void>();

  loading = false;
  data: DiscrepancyListResponse | null = null;

  /** Snapshot de momento de último refresh, para el banner "último refresh". */
  lastRefreshedAt: Date | null = null;

  filter: DiscrepancyFilter = {
    page: 0,
    size: 20,
  };

  ngOnInit(): void {
    this.searchTrigger$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.reload());
    this.reload();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  reload(): void {
    this.loading = true;
    this.api.listDiscrepancies(this.filter).subscribe({
      next: resp => {
        this.data = resp.data;
        this.lastRefreshedAt = new Date();
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.toastr.danger(
          err?.error?.message || 'No se pudieron cargar las discrepancias',
          'Error',
        );
      },
    });
  }

  onFilterChange(): void {
    this.filter.page = 0;
    this.searchTrigger$.next();
  }

  applyFilters(): void {
    this.filter.page = 0;
    this.reload();
  }

  resetFilters(): void {
    this.filter = { page: 0, size: 20 };
    this.reload();
  }

  goToPage(page: number): void {
    if (!this.data) return;
    if (page < 0 || page >= this.data.totalPages) return;
    this.filter.page = page;
    this.reload();
  }

  openDetail(row: DiscrepancyRow): void {
    // El audit_logs unificado tiene los espejos; navegamos al detalle por
    // correlationId que coincide con el orderId, que es lo que más útil
    // ofrece el log-detail-view existente.
    this.router.navigate(['/pages-admin/auditoria/log', row.id]);
  }

  /**
   * Abre el wizard de venta manual pre-llenado con el orderId del intent
   * descalzado. El wizard, al completar la venta, llamará al endpoint
   * existente que enlaza intent → payment vía {@code sourceIntentOrderId}.
   */
  reprocessAsManual(row: DiscrepancyRow): void {
    if (!row.orderId) {
      this.toastr.warning('La discrepancia no tiene orderId asociado', 'Reprocesar');
      return;
    }
    this.router.navigate(
      ['/pages-admin/ventas-manual/registrar'],
      { queryParams: { fromIntent: row.orderId, reason: 'reconciliacion' } },
    );
  }

  /**
   * Abre el modal para capturar la nota de resolución y llama al endpoint.
   */
  markResolved(row: DiscrepancyRow): void {
    this.dialog.open(ResolveDiscrepancyModalComponent, {
      context: { row },
      closeOnBackdropClick: false,
      hasScroll: false,
    }).onClose.subscribe((note: string | undefined) => {
      if (!note) return;
      this.api.resolveDiscrepancy(row.id, note).subscribe({
        next: () => {
          this.toastr.success('Discrepancia marcada como resuelta', 'Conciliación');
          this.reload();
        },
        error: err => {
          this.toastr.danger(
            err?.error?.message || 'No se pudo marcar como resuelta',
            'Error',
          );
        },
      });
    });
  }

  trackById(_: number, row: DiscrepancyRow): number {
    return row.id;
  }

  gatewayClass(g: string): string {
    return (g || '').toUpperCase() === 'CULQI' ? 'gw-culqi' : 'gw-paypal';
  }

  statusClass(s: string): string {
    return (s || '').toUpperCase() === 'RESOLVED' ? 'res-resolved' : 'res-open';
  }
}
