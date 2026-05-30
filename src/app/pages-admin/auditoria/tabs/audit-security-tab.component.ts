import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbSpinnerModule,
  NbToastrService,
  NbTooltipModule,
} from '@nebular/theme';
import {
  ActiveSessionDto,
  ActiveSessionStatus,
  AuditApiService,
  IntegrityCheckDto,
  LoginAttemptDto,
  PageResponse,
} from '../../../@core/backend/services/audit.service';
import { AuditLabelPipe } from '../audit-label.pipe';

/**
 * Frecuencia con la que se refresca el listado de sesiones para que el
 * indicador "En linea" no quede stale. Solo se dispara cuando el tab del
 * navegador esta visible (no quema bateria/red en background).
 */
const SESSIONS_REFRESH_INTERVAL_MS = 30_000;

@Component({
  selector: 'ngx-audit-security-tab',
  standalone: true,
  templateUrl: './audit-security-tab.component.html',
  styleUrls: ['./audit-security-tab.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    NbCardModule,
    NbIconModule,
    NbButtonModule,
    NbInputModule,
    NbFormFieldModule,
    NbSpinnerModule,
    NbCheckboxModule,
    NbTooltipModule,
    DatePipe,
    AuditLabelPipe,
  ],
})
export class AuditSecurityTabComponent implements OnInit, OnDestroy {
  private api = inject(AuditApiService);
  private toastr = inject(NbToastrService);

  attempts: PageResponse<LoginAttemptDto> | null = null;
  sessions: PageResponse<ActiveSessionDto> | null = null;
  integrity: PageResponse<IntegrityCheckDto> | null = null;

  loadingAttempts = false;
  loadingSessions = false;
  /**
   * Flag separado de loadingSessions: el auto-refresh no muestra spinner para
   * no parpadear la UI; loadingSessions queda solo para la carga inicial y
   * cambios de filtro explicitos.
   */
  refreshingSessions = false;
  loadingIntegrity = false;
  runningIntegrity = false;

  emailFilter = '';
  includeRevoked = false;
  includeExpired = false;

  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private visibilityHandler = (): void => this.onVisibilityChange();

  ngOnInit(): void {
    this.reloadAttempts();
    this.reloadSessions();
    this.reloadIntegrity();
    this.startAutoRefresh();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  reloadAttempts(): void {
    this.loadingAttempts = true;
    this.api.listLoginAttempts(this.emailFilter || undefined).subscribe({
      next: p => { this.attempts = p; this.loadingAttempts = false; },
      error: () => { this.loadingAttempts = false; this.toastr.danger('No se pudieron cargar los intentos', 'Error'); },
    });
  }

  reloadSessions(): void {
    this.loadingSessions = true;
    this.api.listSessions(this.includeRevoked, this.includeExpired).subscribe({
      next: p => { this.sessions = p; this.loadingSessions = false; },
      error: () => { this.loadingSessions = false; this.toastr.danger('No se pudieron cargar las sesiones', 'Error'); },
    });
  }

  /**
   * Refresh silencioso disparado por el timer. No toca loadingSessions para
   * evitar parpadeo del spinner; usa refreshingSessions para que la UI pueda
   * mostrar un indicador discreto si quiere.
   */
  private silentRefreshSessions(): void {
    if (this.refreshingSessions) return;
    this.refreshingSessions = true;
    this.api.listSessions(this.includeRevoked, this.includeExpired).subscribe({
      next: p => { this.sessions = p; this.refreshingSessions = false; },
      error: () => { this.refreshingSessions = false; },
    });
  }

  reloadIntegrity(): void {
    this.loadingIntegrity = true;
    this.api.listIntegrityChecks().subscribe({
      next: p => { this.integrity = p; this.loadingIntegrity = false; },
      error: () => { this.loadingIntegrity = false; },
    });
  }

  runIntegrityNow(): void {
    if (this.runningIntegrity) return;
    this.runningIntegrity = true;
    this.api.runIntegrityNow().subscribe({
      next: r => {
        this.runningIntegrity = false;
        const msg = `Run ${r.runId.substring(0, 8)} - ${r.findings} hallazgo(s), `
          + `${r.skippedPlanificacion} kit(s) PLANIFICACION/ZIP omitido(s), ${r.durationMs}ms`;
        this.toastr.success(msg, 'Verificacion completada');
        this.reloadIntegrity();
      },
      error: err => {
        this.runningIntegrity = false;
        this.toastr.danger(err?.error?.message || 'No se pudo ejecutar', 'Error');
      },
    });
  }

  revoke(session: ActiveSessionDto): void {
    if (this.isTerminalStatus(session.status)) {
      // Defensa en profundidad: aunque el boton este oculto/disabled,
      // un click via teclado/devtools nunca debe disparar revoke sobre
      // una sesion ya terminal.
      return;
    }
    const who = session.userEmail || `usuario ${session.userId}`;
    if (!confirm(`Revocar la sesion ${session.id} de ${who}?`)) return;
    this.api.revokeSession(session.id, 'manual revoke from dashboard').subscribe({
      next: () => {
        this.toastr.success('Sesion revocada', 'OK');
        this.reloadSessions();
      },
      error: err => this.toastr.danger(err?.error?.message || 'Error revocando', 'Error'),
    });
  }

  // ---------------- presence helpers (UI) ----------------

  /**
   * CSS class para el pill semaforizado del status. Reusa la convencion de
   * .sev-pill del modulo de auditoria.
   */
  statusClass(status: ActiveSessionStatus | undefined): string {
    switch (status) {
      case 'ONLINE': return 'status-online';
      case 'IDLE': return 'status-idle';
      case 'EXPIRED': return 'status-expired';
      case 'REVOKED': return 'status-revoked';
      default: return 'status-unknown';
    }
  }

  /**
   * Etiqueta humana para mostrar dentro del pill. Para IDLE/EXPIRED/REVOKED
   * agrega contexto ("hace 12m", fecha de expiracion / revocacion) cuando
   * esta disponible.
   */
  statusLabel(s: ActiveSessionDto): string {
    switch (s.status) {
      case 'ONLINE': return 'En linea';
      case 'IDLE': {
        const ago = this.formatAgo(s.lastSeenAgoSeconds);
        return ago ? `Inactivo (${ago})` : 'Inactivo';
      }
      case 'EXPIRED': return 'Vencida';
      case 'REVOKED': return 'Revocada';
      default: return '—';
    }
  }

  /**
   * "hace 7m", "hace 2h", "hace 3d". Devuelve null si no hay dato.
   */
  formatAgo(seconds: number | null | undefined): string | null {
    if (seconds == null || seconds < 0) return null;
    if (seconds < 60) return `hace ${Math.floor(seconds)}s`;
    const min = Math.floor(seconds / 60);
    if (min < 60) return `hace ${min}m`;
    const hours = Math.floor(min / 60);
    if (hours < 48) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  }

  isTerminalStatus(status: ActiveSessionStatus | undefined): boolean {
    return status === 'EXPIRED' || status === 'REVOKED';
  }

  // ---------------- auto-refresh ----------------

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    if (typeof window === 'undefined') return;
    this.refreshTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return; // pestaña oculta: no gastamos requests
      }
      this.silentRefreshSessions();
    }, SESSIONS_REFRESH_INTERVAL_MS);
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimer != null) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Cuando el usuario vuelve al tab tras un rato fuera, hacemos un refresh
   * inmediato para que vea data fresca sin esperar el siguiente tick del
   * timer.
   */
  private onVisibilityChange(): void {
    if (typeof document === 'undefined') return;
    if (document.visibilityState === 'visible') {
      this.silentRefreshSessions();
    }
  }
}
