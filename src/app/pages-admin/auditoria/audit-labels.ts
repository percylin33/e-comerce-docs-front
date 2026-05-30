/**
 * Diccionario de traducciones al espanol para los valores tecnicos que viaja
 * el modulo de auditoria (action, targetTable, category, severity).
 *
 * El backend persiste estos valores en SCREAMING_SNAKE_CASE (ej.
 * "GATEWAY_CHARGE_FAILED") y son utiles para correlacionar con codigo / logs,
 * pero los admins se confunden al verlos crudos. Aqui definimos un mapeo
 * humano-legible y un fallback que humaniza cualquier string desconocido.
 *
 * Convenciones:
 *  - Sin tildes (sigue el resto del front del proyecto).
 *  - Si una accion no esta mapeada, devolvemos un "humanize" del raw para que
 *    igual se lea decentemente, p.ej. "FOO_BAR_BAZ" -> "Foo bar baz".
 *  - El raw siempre debe quedar accesible al admin via tooltip / title en el
 *    HTML, para no perder la trazabilidad tecnica.
 */

// -----------------------------------------------------------------------------
// ACTION
// -----------------------------------------------------------------------------

const ACTION_LABELS_ES_BASE: Record<string, string> = {
  // ---- Pagos: PaymentAuditEventType (enum del backend) ----
  PAYMENT_INITIATED: 'Pago iniciado',
  VALIDATION_STARTED: 'Validacion iniciada',
  VALIDATION_COMPLETED: 'Validacion completada',
  VALIDATION_FAILED: 'Validacion fallida',
  PRICE_CALCULATION_STARTED: 'Calculo de precio iniciado',
  PRICE_CALCULATION_COMPLETED: 'Calculo de precio completado',
  DISCOUNT_APPLIED: 'Descuento aplicado',
  COUPON_APPLIED: 'Cupon aplicado',
  GATEWAY_CHARGE_INITIATED: 'Cargo iniciado en pasarela',
  GATEWAY_CHARGE_SUCCESS: 'Cargo exitoso en pasarela',
  GATEWAY_CHARGE_FAILED: 'Cargo fallido en pasarela',
  GATEWAY_CHARGE_PENDING: 'Cargo pendiente en pasarela',
  GATEWAY_TIMEOUT: 'Timeout de pasarela',
  GATEWAY_RETRY_ATTEMPTED: 'Reintento de cargo',
  PAYMENT_CREATED: 'Pago creado',
  PAYMENT_APPROVED: 'Pago aprobado',
  PAYMENT_REJECTED: 'Pago rechazado',
  PAYMENT_CANCELLED: 'Pago cancelado',
  PAYMENT_REFUNDED: 'Pago reembolsado',
  DOCUMENTS_GRANTED: 'Documentos otorgados',
  SUBSCRIPTION_ACTIVATED: 'Suscripcion activada',
  SUBSCRIPTION_RENEWAL: 'Suscripcion renovada',
  EMAIL_SENT: 'Email enviado',
  EMAIL_FAILED: 'Error al enviar email',
  WEBHOOK_RECEIVED: 'Webhook recibido',
  SYSTEM_ERROR: 'Error de sistema',
  NETWORK_ERROR: 'Error de red',
  DATABASE_ERROR: 'Error de base de datos',
  MANUAL_APPROVAL: 'Aprobacion manual',
  MANUAL_REJECTION: 'Rechazo manual',
  FRAUD_SUSPECTED: 'Posible fraude',

  // ---- Pagos: acciones extra (no estan en el enum) ----
  PAYMENT_FAILED: 'Pago fallido',
  WEBHOOK_PAYMENT_NOT_PAID: 'Webhook: pago no completado',
  PAYPAL_CAPTURE_FAILED: 'Captura PayPal fallida',
  MANUAL_PAYMENT_CREATED: 'Pago manual creado',
  PAYMENT_INTENT_CONVERTED: 'Intent convertido a pago',
  PAYMENT_INTENT_DISCARDED: 'Intent de pago descartado',

  // ---- Documentos ----
  DOCUMENT_DOWNLOADED: 'Documento descargado',
  DOCUMENT_DOWNLOAD_DENIED: 'Descarga denegada',
  DOCUMENT_FILE_MISSING: 'Archivo del documento faltante',
  DOCUMENT_INTEGRITY_OK: 'Documento integro',

  // ---- Usuarios / cuentas ----
  USER_CREATED: 'Usuario creado',
  USER_UPDATED: 'Usuario actualizado',
  USER_DELETED: 'Usuario eliminado',
  USER_ROLE_CHANGED: 'Rol de usuario cambiado',

  // ---- Cupones ----
  COUPON_CREATED: 'Cupon creado',
  COUPON_UPDATED: 'Cupon actualizado',
  COUPON_DELETED: 'Cupon eliminado',

  // ---- Suscripciones (acciones legacy en espanol que ya estan en BD) ----
  CANCELAR: 'Cancelar',
  ACTIVAR: 'Activar',
  EDITAR: 'Editar',
  EDITAR_PAGO: 'Editar pago',
  CREAR: 'Crear',

  // ---- Promotores / retiros ----
  WITHDRAWAL_CREATED: 'Retiro creado',
  WITHDRAWAL_APPROVED: 'Retiro aprobado',
  WITHDRAWAL_REJECTED: 'Retiro rechazado',

  // ---- Kits ----
  KIT_APPROVED: 'Kit aprobado',
  KIT_REJECTED: 'Kit rechazado',
  KIT_PENDING: 'Kit pendiente',

  // ---- Seguridad / sesiones ----
  SESSION_REVOKED: 'Sesion revocada',
  BRUTE_FORCE_DETECTED: 'Fuerza bruta detectada',
  LOGIN_SUCCESS: 'Login exitoso',
  LOGIN_FAILED: 'Login fallido',

  // ---- Sistema / mantenimiento ----
  AUDIT_ARCHIVE_RUN: 'Archivado de auditoria ejecutado',
  INTEGRITY_CHECK_RUN: 'Verificacion de integridad ejecutada',
};

/**
 * Construye el mapa final reconociendo tambien la variante con prefijo
 * "PAYMENT_" que emite PaymentAuditService.
 *
 * Ejemplo: "GATEWAY_CHARGE_FAILED" tambien se puede recibir como
 * "PAYMENT_GATEWAY_CHARGE_FAILED" (prefijado en
 * PaymentAuditService#emitEvent), y ambos deben mostrar la misma etiqueta.
 */
const ACTION_LABELS_ES: Record<string, string> = (() => {
  const out: Record<string, string> = { ...ACTION_LABELS_ES_BASE };
  Object.entries(ACTION_LABELS_ES_BASE).forEach(([key, label]) => {
    if (!key.startsWith('PAYMENT_')) {
      out[`PAYMENT_${key}`] = label;
    }
  });
  return out;
})();

export function translateAction(raw: string | null | undefined): string {
  if (!raw) return '—';
  const upper = raw.toUpperCase();
  if (ACTION_LABELS_ES[upper]) return ACTION_LABELS_ES[upper];
  return humanize(raw);
}

// -----------------------------------------------------------------------------
// TARGET TABLE
// -----------------------------------------------------------------------------

const TARGET_TABLE_LABELS_ES: Record<string, string> = {
  payments: 'Pago',
  payment_intent: 'Intent de pago',
  payment_intents: 'Intent de pago',
  users: 'Usuario',
  user: 'Usuario',
  documents: 'Documento',
  cupons: 'Cupon',
  coupons: 'Cupon',
  login_attempts: 'Intento de login',
  active_sessions: 'Sesion activa',
  audit_logs: 'Log de auditoria',
  audit_logs_archive: 'Archivo de auditoria',
  withdrawal_requests: 'Solicitud de retiro',
  kit_approval_requests: 'Solicitud de aprobacion de kit',
  promotional_campaigns: 'Campania promocional',
  integrity_checks: 'Verificacion de integridad',
  suscriptions: 'Suscripcion',
  subscriptions: 'Suscripcion',
};

export function translateTargetTable(raw: string | null | undefined): string {
  if (!raw) return '—';
  const lower = raw.toLowerCase();
  if (TARGET_TABLE_LABELS_ES[lower]) return TARGET_TABLE_LABELS_ES[lower];
  return humanize(raw);
}

// -----------------------------------------------------------------------------
// CATEGORY
// -----------------------------------------------------------------------------

const CATEGORY_LABELS_ES: Record<string, string> = {
  USER: 'Usuarios',
  PAYMENT: 'Pagos',
  SUBSCRIPTION: 'Suscripciones',
  DOCUMENT: 'Documentos',
  SECURITY: 'Seguridad',
  SYSTEM: 'Sistema',
  PROMOTOR: 'Promotores',
  KIT: 'Kits',
  CAMPAIGN: 'Campanias',
  COUPON: 'Cupones',
};

export function translateCategory(raw: string | null | undefined): string {
  if (!raw) return '—';
  return CATEGORY_LABELS_ES[raw.toUpperCase()] || humanize(raw);
}

// -----------------------------------------------------------------------------
// SEVERITY
// -----------------------------------------------------------------------------

const SEVERITY_LABELS_ES: Record<string, string> = {
  INFO: 'Info',
  WARN: 'Advertencia',
  ERROR: 'Error',
  CRITICAL: 'Critico',
  DEBUG: 'Debug',
};

export function translateSeverity(raw: string | null | undefined): string {
  if (!raw) return '—';
  return SEVERITY_LABELS_ES[raw.toUpperCase()] || humanize(raw);
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function humanize(s: string): string {
  return s
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, m => m.toUpperCase())
    .trim();
}
