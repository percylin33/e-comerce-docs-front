import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NbCardModule, NbIconModule, NbSpinnerModule, NbTooltipModule } from '@nebular/theme';
import { Subject, interval } from 'rxjs';
import { startWith, switchMap, takeUntil } from 'rxjs/operators';
import { AuditApiService, AuditSummary } from '../../../@core/backend/services/audit.service';

/**
 * Widget compacto que se muestra en el Panel de Control principal. Resume el
 * estado del sistema de Auditoria (eventos totales, criticos, login fallidos,
 * sesiones activas) y enlaza a la pagina dedicada {@code /pages-admin/auditoria}.
 *
 * <p>Se actualiza cada 60 segundos. Si falla la llamada (p.ej. backend antiguo
 * sin el modulo de auditoria), el widget se oculta sin afectar al panel.</p>
 */
@Component({
  selector: 'ngx-audit-summary-widget',
  standalone: true,
  templateUrl: './audit-summary-widget.component.html',
  styleUrls: ['./audit-summary-widget.component.scss'],
  imports: [CommonModule, RouterModule, NbCardModule, NbIconModule, NbSpinnerModule, NbTooltipModule, DecimalPipe],
})
export class AuditSummaryWidgetComponent implements OnInit, OnDestroy {
  private api = inject(AuditApiService);
  private destroy$ = new Subject<void>();

  summary: AuditSummary | null = null;
  loading = true;
  errored = false;

  ngOnInit(): void {
    interval(60_000)
      .pipe(
        startWith(0),
        switchMap(() => this.api.getSummary()),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: data => {
          this.summary = data;
          this.loading = false;
          this.errored = false;
        },
        error: () => {
          this.loading = false;
          this.errored = true;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get healthBadge(): { label: string; status: 'success' | 'warning' | 'danger' | 'info' } {
    if (!this.summary) return { label: 'Sin datos', status: 'info' };
    if (this.summary.criticalEvents24h > 0 || this.summary.bruteForce24h > 0) {
      return { label: 'Atencion', status: 'danger' };
    }
    if (this.summary.errorEvents24h > 0 || this.summary.failedLogins24h > 20) {
      return { label: 'Vigilando', status: 'warning' };
    }
    return { label: 'Saludable', status: 'success' };
  }
}
