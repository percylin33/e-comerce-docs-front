/**
 * No-op stub mantenido por compatibilidad con `main.ts` (que invoca
 * {@link setupNativeHttpErrorInterception}).
 *
 * <p>El parche anterior a {@code XMLHttpRequest} guardaba en
 * {@code window.__LAST_PAYMENT_ERROR_RESPONSE__} el body completo de
 * cualquier respuesta 4xx/5xx de los endpoints {@code /culqi/charge}
 * y {@code /payment}. Esto significaba que cualquier script o
 * extensión cargada en la página podía leer los detalles del error
 * del último intento de pago (incluyendo info del cliente).</p>
 *
 * <p>Se eliminó por seguridad (P3-2 del plan de endurecimiento).
 * Los componentes que consumen el error deben usar el
 * {@code HttpErrorResponse} estándar del {@code HttpClient} de Angular.</p>
 */
export function setupNativeHttpErrorInterception(): void {
  // intencionalmente vacío
}
