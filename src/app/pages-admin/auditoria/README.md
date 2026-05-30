# Modulo Auditoria (frontend)

Pagina dedicada para investigar la actividad administrativa, sesiones, intentos
de login y verificaciones de integridad del sistema.

## Estructura

```
auditoria/
  auditoria.component.{ts,html,scss}
  tabs/
    audit-logs-tab.component.{ts,html,scss}
    audit-security-tab.component.{ts,html,scss}
    audit-analytics-tab.component.{ts,html,scss}
  log-detail/
    audit-log-detail-view.component.{ts,html,scss}
```

Componente principal: `AuditoriaComponent`. Es un componente *standalone* que
expone tres tabs (`nb-tabset`).

## Tabs

- **Registro** (`AuditLogsTabComponent`)
  - Tabla con filtros (search, categoria, severidad, email actor, target, fechas).
  - Paginacion server-side; al hacer clic en una fila se navega a la vista
    `/pages-admin/auditoria/log/:id`.
  - Boton `Exportar CSV` que descarga el resultado actual.
  - La vista (`AuditLogDetailViewComponent` en `log-detail/`) muestra
    metadata, payload procesado, timeline relacionado por `correlationId`
    y -cuando aplica- un panel adicional con detalles del Payment o
    PaymentIntent y acciones admin (ver intent, hacer pago manual).

- **Seguridad** (`AuditSecurityTabComponent`)
  - Lista de sesiones activas con accion `Revocar`.
  - Lista de intentos de login (filtrable por email).
  - Hallazgos del `IntegrityCheckJob`.

- **Analiticas** (`AuditAnalyticsTabComponent`)
  - KPIs de 24h.
  - Timeline (area chart) de eventos por hora.
  - Donuts de distribucion por categoria y por severidad.
  - Top acciones / top actores (7 dias).

## Dependencias

- Backend: endpoints `/api/v1/admin/audit/*` expuestos por `AuditController`.
- Frontend: `AuditApiService` (en `@core/backend/services/audit.service.ts`).
- Widget compacto: `AuditSummaryWidgetComponent`
  (`shared/components/audit-summary-widget`) integrado en `PanelControlComponent`.
- Routing: `pages-admin-routing.module.ts` -> `/pages-admin/auditoria`.
- Menu: `pages-menu.ts` -> entrada "Auditoria" con icono `shield-outline`.

## Permisos

El backend valida `hasAnyRole('ADMIN','SUPADMIN')`. Si el usuario no tiene
rol, las llamadas devuelven 403 y los componentes muestran el estado vacio.

## Performance

- La tabla usa paginacion (no virtualizada todavia). Si las filas crecen mucho,
  cambiar a `cdk-virtual-scroll` en el futuro.
- El widget se refresca cada 60 s.
- El detalle del dialog hace una segunda llamada solo si hay `correlationId`.

## Rollback rapido

Cada categoria de emisores tiene un feature flag en el backend
(`features.audit.<categoria>.enabled`). Para desactivar el modulo del
dashboard sin redeploy del frontend, basta con apagar los flags.
