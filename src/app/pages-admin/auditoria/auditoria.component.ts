import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NbCardModule, NbIconModule, NbTabComponent, NbTabsetModule } from '@nebular/theme';
import { AuditLogsTabComponent } from './tabs/audit-logs-tab.component';
import { AuditSecurityTabComponent } from './tabs/audit-security-tab.component';
import { AuditAnalyticsTabComponent } from './tabs/audit-analytics-tab.component';
import { AuditReconciliationTabComponent } from './tabs/audit-reconciliation-tab.component';
import { CreadoresAuditComponent } from './creadores-audit/creadores-audit.component';

/**
 * Pagina dedicada del modulo de Auditoria y Seguridad.
 *
 * <p>Cinco tabs (Mejora v1.1):</p>
 * <ul>
 *   <li><b>Registro</b> — tabla virtualizada de audit_logs con filtros
 *       dinamicos, detalle y export CSV.</li>
 *   <li><b>Creadores</b> — eventos del modulo Creadores (Mejora v1.1).</li>
 *   <li><b>Conciliacion</b> — pagos y discrepancias con pasarelas.</li>
 *   <li><b>Seguridad</b> — sesiones activas, login attempts, integrity checks.</li>
 *   <li><b>Analiticas</b> — series temporales, top actores, donut por categoria
 *       y por severidad.</li>
 * </ul>
 *
 * <p>Navegacion: usa {@code nb-tabset} estandar (nb-route-tabset no existe
 * en nebular 14); la sincronia URL<->tab se hace manualmente con el Router.</p>
 */
@Component({
  selector: 'ngx-auditoria',
  standalone: true,
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.scss'],
  imports: [
    CommonModule,
    NbCardModule,
    NbIconModule,
    NbTabsetModule,
    RouterOutlet,
    AuditLogsTabComponent,
    AuditSecurityTabComponent,
    AuditAnalyticsTabComponent,
    AuditReconciliationTabComponent,
    CreadoresAuditComponent,
  ],
})
export class AuditoriaComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** Tab activo, sincronizado con la URL (`/pages-admin/auditoria/<tabId>`). */
  activeTab: 'registro' | 'creadores' | 'conciliacion' | 'seguridad' | 'analiticas' = 'registro';

  constructor() {
    // Sincroniza el tab activo con la URL (al cargar y al navegar).
    this.syncFromUrl(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.syncFromUrl(e.urlAfterRedirects));
  }

  private syncFromUrl(url: string): void {
    const m = url.match(/\/auditoria\/([^/?#]+)/);
    const tab = m ? m[1] : 'registro';
    if (['registro', 'creadores', 'conciliacion', 'seguridad', 'analiticas'].includes(tab)) {
      this.activeTab = tab as any;
    }
  }

  /**
   * Handler del cambio de tab: navega a la URL correspondiente.
   * Cada tab es una ruta hija con su propio componente.
   */
  onTabChange(tabId: string): void {
    if (tabId && tabId !== this.activeTab) {
      this.router.navigate(['/pages-admin/auditoria', tabId]);
    }
    // Resize para que ApexCharts (si los hay) re-rendericen.
    if (typeof window === 'undefined') return;
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
  }
}
