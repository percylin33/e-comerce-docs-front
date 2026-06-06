import { Component } from '@angular/core';
import { NbCardModule, NbIconModule, NbRouteTabsetModule, NbTabComponent, NbTabsetModule } from '@nebular/theme';
import { AuditLogsTabComponent } from './tabs/audit-logs-tab.component';
import { AuditSecurityTabComponent } from './tabs/audit-security-tab.component';
import { AuditAnalyticsTabComponent } from './tabs/audit-analytics-tab.component';
import { AuditReconciliationTabComponent } from './tabs/audit-reconciliation-tab.component';

/**
 * Pagina dedicada del modulo de Auditoria y Seguridad.
 *
 * <p>Tres tabs:</p>
 * <ul>
 *   <li><b>Registro</b> — tabla virtualizada de audit_logs con filtros dinamicos
 *       (categoria PAYMENT cubre pasarelas Culqi/PayPal, DOCUMENT cubre
 *       descargas legacy y v2), detalle y export CSV.</li>
 *   <li><b>Seguridad</b> — sesiones activas, login attempts y resultados de
 *       integrity checks.</li>
 *   <li><b>Analiticas</b> — series temporales, top actores, donut por categoria
 *       y por severidad.</li>
 * </ul>
 */
@Component({
  selector: 'ngx-auditoria',
  standalone: true,
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.scss'],
  imports: [
    NbCardModule,
    NbIconModule,
    NbTabsetModule,
    NbRouteTabsetModule,
    AuditLogsTabComponent,
    AuditSecurityTabComponent,
    AuditAnalyticsTabComponent,
    AuditReconciliationTabComponent,
  ],
})
export class AuditoriaComponent {
  /**
   * Workaround para charts (ApexCharts) que viven dentro del nb-tabset:
   * cuando un tab se vuelve activo, su contenedor recien entonces tiene
   * dimensiones reales. Disparamos un window:resize para que los charts
   * remidan y dibujen correctamente, evitando el bug de "se ve vacio
   * hasta que muevo el ancho de pantalla".
   */
  onTabChange(_tab: NbTabComponent): void {
    if (typeof window === 'undefined') return;
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
  }
}
