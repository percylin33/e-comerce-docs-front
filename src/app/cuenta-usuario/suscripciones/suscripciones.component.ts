import { Component, OnInit } from '@angular/core';
import { MembresiaData, MembresiaSuscripcion, PagoSuscripcion, DocumentosPorNivel, DocumentoSuscripcion } from '../../@core/interfaces/membresia';
import { TokenData } from '../../@core/interfaces/token';
import { Router } from '@angular/router';
import { CartService } from '../../@core/backend/services/cart.service';
import { CartItem } from '../../@core/interfaces/cartItem';
import { MembershipService } from './membership.service';
import { DateUtilsService } from '../../@core/backend/services/date-utils.service';

@Component({
  selector: 'ngx-suscripciones',
  templateUrl: './suscripciones.component.html',
  styleUrls: ['./suscripciones.component.scss']
})
export class SuscripcionesComponent implements OnInit {

  suscripciones: { [nombre: string]: MembresiaSuscripcion[] } = {};
  suscripcionesArray: MembresiaSuscripcion[] = [];
  // Nuevo: resumen plano para renderizar tarjetas
  membershipsKeys: string[] = [];
  membershipsMap: { [key: string]: any[] } = {};
  id: number = 0;
  url: string = '';

  // Estados de carga mejorados
  loading: boolean = true;
  error: string = '';
  canRetry: boolean = false;
  retryAction?: () => void;

  // Filtros para suscripciones
  filtroActual: 'vigentes' | 'vencidas' = 'vigentes';
  suscripcionesFiltradas: MembresiaSuscripcion[] = [];

  // Búsqueda
  searchTerm: string = '';
  searchResults: MembresiaSuscripcion[] = [];

  // Estado de búsqueda
  isSearching: boolean = false;

  // Estado de visibilidad unificado
  visibilityState: { [key: string]: boolean } = {};

  // Estados de carga granular
  loadingStates = {
    summary: false,
    payments: new Set<number>(),
    documents: new Set<number>(),
    details: new Set<number>()
  };

  // Cache para datos lazy
  documentsCache: { [key: number]: any } = {};
  detailsCache: { [key: number]: any } = {};

  // Compatibilidad con código legacy
  detallesVisibles: { [key: number]: boolean } = {};

  // Método para manejar errores con reintentos
  private handleApiError(error: any, context: string, retryAction?: () => void) {
    let message = 'Error desconocido';
    let canRetry = false;

    if (error?.status) {
      switch (error.status) {
        case 404:
          message = `${context}: Información no encontrada`;
          break;
        case 500:
          message = `${context}: Error del servidor`;
          canRetry = true;
          break;
        case 0:
        case -1:
          message = `${context}: Sin conexión a internet`;
          canRetry = true;
          break;
        default:
          message = `${context}: Error inesperado`;
          canRetry = !!retryAction;
      }
    } else {
      message = `${context}: Error de conexión`;
      canRetry = !!retryAction;
    }

    this.error = message;
    this.canRetry = canRetry;
    this.retryAction = retryAction;

    console.error(`[${context}] Error:`, error);
  }

  // Método para reintentar la carga
  retryLoad() {
    if (this.retryAction) {
      this.error = '';
      this.canRetry = false;
      this.retryAction();
    }
  }

  constructor(
    private membresiaData: MembresiaData,
    private tokenData: TokenData,
    private router: Router,
    private cartService: CartService,
    private membershipService: MembershipService,
    private dateUtils: DateUtilsService
  ) {

  }

  ngOnInit(): void {
    // Verificar si regresamos de checkout (flag persistido en sessionStorage)
    const pendingRefresh = sessionStorage.getItem('pendingSubscriptionRefresh');
    if (pendingRefresh) {
      sessionStorage.removeItem('pendingSubscriptionRefresh');
      this.clearAllCache();
    }
    this.loadUserSubscriptions();
  }

  loadUserSubscriptions(): void {
    this.loading = true;
    this.loadingStates.summary = true;
    this.error = '';
    this.canRetry = false;

    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      this.loading = false;
      this.loadingStates.summary = false;
      this.error = 'No se encontró sesión activa. Por favor inicia sesión.';
      return;
    }

    try {
      const userData = JSON.parse(currentUser);
      this.id = userData.id;
    } catch (e) {
      this.loading = false;
      this.loadingStates.summary = false;
      this.error = 'Sesión inválida. Por favor inicia sesión nuevamente.';
      return;
    }

    if (!this.id) {
      this.loading = false;
      this.loadingStates.summary = false;
      this.error = 'No se encontró ID de usuario. Por favor inicia sesión.';
      return;
    }

    // Usar MembershipService para cargar un resumen liviano y delegar requests por subscriptionId
    this.membershipService.loadSummaryForUser(this.id).subscribe({
      next: (data) => {
        this.loading = false;
        this.loadingStates.summary = false;

        // El servicio puede devolver ya un mapa {nombreMembresia: [...]}
        // o bien un array plano de suscripciones según la versión del backend.
        let grouped: { [key: string]: any[] } = {};

        if (Array.isArray(data)) {
          (data as any[]).forEach((s: any) => {
            const key = s.nombre || s.membresiaNombre || s.subscriptionTypeName || s.name || 'Membresía';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(s);
          });
        } else if (data && typeof data === 'object') {
          grouped = data as { [key: string]: any[] };
        } else {
          grouped = {};
        }

        this.membershipsMap = grouped || {};
        this.membershipsKeys = Object.keys(this.membershipsMap || {});

        // Preparar el array plano para compatibilidad con filtros
        this.suscripcionesArray = [];
        Object.keys(this.membershipsMap).forEach(nombreMembresia => {
          const suscripcionesDeMembresia = this.membershipsMap[nombreMembresia] || [];
          suscripcionesDeMembresia.forEach((suscripcion: any) => {
           // console.log('🔄 Procesando suscripción:', suscripcion);
            // Normalizar estructura mínima esperada por la UI
            const normalized: any = {
              subscriptionId: suscripcion.subscriptionId || suscripcion.id,
              id: suscripcion.subscriptionId || suscripcion.id,
              membresiaNombre: suscripcion.nombre || suscripcion.membresiaNombre || suscripcion.subscriptionTypeName,
              estado: suscripcion.estado || suscripcion.status,
              estadoPago: suscripcion.estadoPago || null,
              fechaInicio: suscripcion.fechaInicio || suscripcion.startDate,
              fechaFin: suscripcion.fechaFin || suscripcion.endDate,
              fechaFinUnidad: suscripcion.fechaFinUnidad || null,
              fechaInicioCompra: suscripcion.fechaInicioCompra || null,
              pagos: suscripcion.pagos || suscripcion.payments || [],
              documents: suscripcion.documents || suscripcion.docs || {},
              links: suscripcion.links || {},
              materiasOpcionesJson: suscripcion.materiasOpcionesJson || suscripcion.materiasOpciones || '',
              inactiveReason: suscripcion.inactiveReason || suscripcion.raw?.inactiveReason || null,
              cancelReason: suscripcion.cancelReason || suscripcion.raw?.cancelReason || null,
              canceledBy: suscripcion.canceledBy || suscripcion.raw?.canceledBy || null,
              raw: suscripcion
            } as MembresiaSuscripcion;

            // console.log('✅ Suscripción normalizada:', {
            //   id: normalized.id,
            //   membresiaNombre: normalized.membresiaNombre,
            //   nombreOriginal: suscripcion.nombre,
            //   membresiaNombreOriginal: suscripcion.membresiaNombre,
            //   subscriptionTypeNameOriginal: suscripcion.subscriptionTypeName
            // });

            if (normalized.pagos && normalized.pagos.length > 0) {
              normalized.pagos.sort((a: any, b: any) => (a.paymentId || 0) - (b.paymentId || 0));
            }

            this.suscripcionesArray.push(normalized);
          });
        });

        this.suscripcionesArray.sort((a, b) =>
          new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
        );

        this.aplicarFiltro();
      },
      error: (error) => {
        this.loading = false;
        this.loadingStates.summary = false;
        this.membershipsMap = {};
        this.membershipsKeys = [];
        this.suscripcionesArray = [];
        this.suscripcionesFiltradas = [];

        this.handleApiError(error, 'Cargando suscripciones', () => this.loadUserSubscriptions());
      }
    });
  }

  // Método para cargar documentos bajo demanda (lazy loading)
  loadDocumentsForSubscription(subscriptionId: number): void {
    if (this.documentsCache[subscriptionId]) {
      console.log(`💾 [Cache] Documentos de suscripción ${subscriptionId} ya en caché`);
      return;
    }
    
    if (this.loadingStates.documents.has(subscriptionId)) {
      console.log(`⏳ [Cache] Documentos de suscripción ${subscriptionId} ya cargando...`);
      return;
    }

    console.log(`📄 [Load] Cargando documentos para suscripción ${subscriptionId}`);
    this.loadingStates.documents.add(subscriptionId);

    this.membershipService.getDocumentsForSubscription(subscriptionId).subscribe({
      next: (documents) => {
        console.log(`✅ [Cache] Documentos cargados para suscripción ${subscriptionId}:`, documents);
        this.documentsCache[subscriptionId] = documents;
        this.loadingStates.documents.delete(subscriptionId);
      },
      error: (error) => {
        console.error(`❌ [Error] Fallo al cargar documentos de suscripción ${subscriptionId}:`, error);
        this.loadingStates.documents.delete(subscriptionId);
        this.handleApiError(error, `Cargando documentos de suscripción ${subscriptionId}`);
      }
    });
  }

  // Método para obtener documentos (con lazy loading automático)
  getDocumentsForSubscription(subscriptionId: number): any {
    if (!this.documentsCache[subscriptionId] && !this.loadingStates.documents.has(subscriptionId)) {
      this.loadDocumentsForSubscription(subscriptionId);
    }
    return this.documentsCache[subscriptionId] || {};
  }

  // Método para verificar si los documentos están cargando
  areDocumentsLoading(subscriptionId: number): boolean {
    return this.loadingStates.documents.has(subscriptionId);
  }

  // Método para limpiar todo el caché (componente + servicio)
  clearAllCache(): void {
    this.documentsCache = {};
    this.detailsCache = {};
    this.loadingStates.documents.clear();
    this.loadingStates.details.clear();
    this.membershipService.clearAllCaches();
  }

  // Método para invalidar caché de una suscripción específica
  invalidateSubscriptionCache(subscriptionId: number): void {
    delete this.documentsCache[subscriptionId];
    delete this.detailsCache[subscriptionId];
    this.loadingStates.documents.delete(subscriptionId);
    this.loadingStates.details.delete(subscriptionId);
    this.membershipService.invalidateSubscriptionCaches(subscriptionId);
  }

  // Método para refrescar una suscripción específica
  refreshSubscription(subscriptionId: number): void {
    console.log(`🔄 Refrescando suscripción ${subscriptionId}`);
    this.invalidateSubscriptionCache(subscriptionId);
    
    // Recargar documentos si están visibles
    if (this.isVisible('documents', subscriptionId)) {
      this.loadDocumentsForSubscription(subscriptionId);
    }
    
    // Recargar toda la lista de suscripciones para actualizar pagos
    this.loadUserSubscriptions();
  }

  // Método para alternar visibilidad de elementos
  toggleVisibility(type: 'pagos' | 'detalles' | 'documents' | 'nivel' | 'materia' | 'unidad' | 'grado', ...args: any[]): void {
    let key: string;

    switch (type) {
      case 'pagos':
        key = `pagos-${args[0]}`;
        break;
      case 'detalles':
        key = `detalles-${args[0]}`;
        break;
      case 'documents':
        key = `documents-${args[0]}`;
        break;
      case 'nivel':
        key = `nivel-${args[0]}`;
        break;
      case 'materia':
        key = `materia-${args[0]}-${args[1]}-${args[2]}`;
        break;
      case 'unidad':
        key = `unidad-${args[0]}-${args[1]}`;
        break;
      case 'grado':
        key = `grado-${args[0]}-${args[1]}-${args[2]}`;
        break;
      default:
        return;
    }

    this.visibilityState[key] = !this.visibilityState[key];
  }

  // Método para verificar visibilidad
  isVisible(type: 'pagos' | 'detalles' | 'documents' | 'nivel' | 'materia' | 'unidad' | 'grado', ...args: any[]): boolean {
    let key: string;

    switch (type) {
      case 'pagos':
        key = `pagos-${args[0]}`;
        break;
      case 'detalles':
        key = `detalles-${args[0]}`;
        break;
      case 'documents':
        key = `documents-${args[0]}`;
        break;
      case 'nivel':
        key = `nivel-${args[0]}`;
        break;
      case 'materia':
        key = `materia-${args[0]}-${args[1]}-${args[2]}`;
        break;
      case 'unidad':
        key = `unidad-${args[0]}-${args[1]}`;
        break;
      case 'grado':
        key = `grado-${args[0]}-${args[1]}-${args[2]}`;
        break;
      default:
        return false;
    }

    return this.visibilityState[key] || false;
  }

  // Métodos legacy para compatibilidad (reemplazan los antiguos)
  togglePagos(index: number) {
    this.toggleVisibility('pagos', index);
  }

  toggleNivel(nivel: string) {
    this.toggleVisibility('nivel', nivel);
  }

  toggleMateria(index: number, nivel: string, materia: string) {
    this.toggleVisibility('materia', index, nivel, materia);
  }

  toggleUnidad(index: number, unidadLabel: string) {
    this.toggleVisibility('unidad', index, unidadLabel);
  }

  toggleGrado(unidadLabel: string, materia: string, grado: string) {
    this.toggleVisibility('grado', unidadLabel, materia, grado);
  }

  // Helpers to parse unit label generated by backend
  getUnitPrefix(unidadLabel: string): string {
    if (!unidadLabel) return '';
    // Prefer colon separator
    const colonIdx = unidadLabel.indexOf(':');
    if (colonIdx !== -1) return unidadLabel.substring(0, colonIdx).trim();

    // Try to match up to 'Unidad <num>' pattern
    const match = unidadLabel.match(/(.*?Unidad\s*\d+)/i);
    if (match && match[1]) return match[1].trim();

    // Try to find 'Unidad <num>' and return prefix including it
    const unidadIdx = unidadLabel.search(/Unidad\s*\d+/i);
    if (unidadIdx !== -1) {
      const before = unidadLabel.substring(0, unidadIdx).trim();
      const unitToken = (unidadLabel.substring(unidadIdx).match(/Unidad\s*\d+/i) || [])[0];
      return (before + ' ' + (unitToken || '')).trim();
    }

    // Fallback: return a short prefix (year and first words)
    return unidadLabel.length > 40 ? unidadLabel.substring(0, 40) + '...' : unidadLabel;
  }

  getUnitTitle(unidadLabel: string): string {
    if (!unidadLabel) return '';
    const colonIdx = unidadLabel.indexOf(':');
    if (colonIdx !== -1) return unidadLabel.substring(colonIdx + 1).trim();

    // If there's no colon, try to extract text after 'Unidad <num>' token
    const match = unidadLabel.match(/(?:.*?Unidad\s*\d+)\s*(.*)/i);
    if (match && match[1]) return match[1].trim();

    // Try splitting by ' - ' (e.g., '2025 - Unidad 4Titulo...')
    const parts = unidadLabel.split(' - ');
    if (parts.length > 1) {
      const after = parts.slice(1).join(' - ');
      const unitMatch = after.match(/(?:Unidad\s*\d+)(.*)/i);
      if (unitMatch && unitMatch[1]) return unitMatch[1].trim();
      // else return everything after first ' - '
      return after.trim();
    }

    return '';
  }

  getShortUnitTitle(unidadLabel: string, max = 60): string {
    const full = this.getUnitTitle(unidadLabel);
    if (!full) return '';
    return full.length > max ? full.substring(0, max - 3) + '...' : full;
  }

  // Remove duplicate documents (by id) inside the nested documents map
  sanitizeDocuments(suscripcion: any) {
    if (!suscripcion || !suscripcion.documents) return;
    try {
      const units = Object.keys(suscripcion.documents);
      units.forEach(unitKey => {
        const materias = Object.keys(suscripcion.documents[unitKey]);
        materias.forEach(mat => {
          const grados = Object.keys(suscripcion.documents[unitKey][mat]);
          grados.forEach(gr => {
            const docs: any[] = suscripcion.documents[unitKey][mat][gr] || [];
            const seen = new Set<number>();
            const deduped = [];
            for (const d of docs) {
              if (!d || !d.id) continue;
              if (!seen.has(d.id)) {
                seen.add(d.id);
                deduped.push(d);
              }
            }
            suscripcion.documents[unitKey][mat][gr] = deduped;
          });
        });
      });
    } catch (e) {
      console.error('Error sanitizing documents', e);
    }
  }

  toggleDetalles(index: number) {
    this.detallesVisibles[index] = !this.detallesVisibles[index];
  }

  parseMateriasOpciones(materiasOpcionesJson: string): any {
    try {
      return JSON.parse(materiasOpcionesJson);
    } catch (error) {
      console.error('Error al parsear materiasOpcionesJson:', error);
      return {};
    }
  }

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  // Método para verificar si una suscripción está activa
  isActive(suscripcion: MembresiaSuscripcion): boolean {
    return suscripcion.estado === 'ACTIVA';
  }

  // Método para verificar si una suscripción tiene cuotas vencidas
  hasOverduePayments(suscripcion: MembresiaSuscripcion): boolean {
    return suscripcion.pagos.some(pago => {
      if (pago.paymentStatus === 'PENDIENTE') {
        // Use fechaVencimiento (new DTO) falling back to dueDate/paymentDate (old DTO)
        const dueDate = pago.fechaVencimiento || pago.dueDate || pago.paymentDate;
        return this.dateUtils.isOverdue(dueDate);
      }
      return false;
    });
  }

  // Método para obtener cuántas cuotas están vencidas
  getOverduePaymentsCount(suscripcion: MembresiaSuscripcion): number {
    return suscripcion.pagos.filter(pago => {
      if (pago.paymentStatus === 'PENDIENTE') {
        const dueDate = pago.fechaVencimiento || pago.dueDate || pago.paymentDate;
        return this.dateUtils.isOverdue(dueDate);
      }
      return false;
    }).length;
  }

  // Método para obtener la cuota más antigua vencida
  getOldestOverduePayment(suscripcion: MembresiaSuscripcion): any {
    const overduePayments = suscripcion.pagos
      .filter(pago => {
        if (pago.paymentStatus === 'PENDIENTE') {
          const dueDate = pago.fechaVencimiento || pago.dueDate || pago.paymentDate;
          return this.dateUtils.isOverdue(dueDate);
        }
        return false;
      })
      .sort((a, b) => {
        const da = pago => pago.fechaVencimiento || pago.dueDate || pago.paymentDate || '';
        return new Date(da(a)).getTime() - new Date(da(b)).getTime();
      });

    return overduePayments.length > 0 ? overduePayments[0] : null;
  }

  // Método para calcular días de retraso
  getDaysOverdue(paymentDate: string): number {
    return this.dateUtils.getDaysOverdue(paymentDate);
  }

  // Método para obtener días restantes hasta el vencimiento (negativo si ya venció)
  getDaysUntilDue(paymentDate: string): number {
    return this.dateUtils.getDaysUntilDue(paymentDate);
  }

  // Método para verificar si hay pagos que vencen pronto (1-7 días)
  hasPaymentsDueSoon(suscripcion: MembresiaSuscripcion): boolean {
    return this.dateUtils.hasPaymentsDueSoon(suscripcion.pagos);
  }

  // Método para obtener el próximo pago que vence pronto
  getNextDuePayment(suscripcion: MembresiaSuscripcion): any {
    return this.dateUtils.getNextDuePayment(suscripcion.pagos);
  }

  // Método para obtener el tipo de alerta
  getAlertType(suscripcion: MembresiaSuscripcion): 'overdue' | 'due-soon' | 'none' {
    // Primero verificar si hay pagos vencidos
    if (this.hasOverduePayments(suscripcion)) {
      return 'overdue';
    }

    // Luego verificar si hay pagos que vencen pronto
    if (this.hasPaymentsDueSoon(suscripcion)) {
      return 'due-soon';
    }

    return 'none';
  }

  // Método para obtener el mensaje de alerta
  getAlertMessage(suscripcion: MembresiaSuscripcion): { title: string, content: string, type: string } {
    const alertType = this.getAlertType(suscripcion);

    if (alertType === 'overdue') {
      const count = this.getOverduePaymentsCount(suscripcion);
      const oldestPayment = this.getOldestOverduePayment(suscripcion);
      const daysOverdue = oldestPayment ? this.getDaysOverdue(oldestPayment.paymentDate) : 0;

      return {
        title: 'Cuenta Inactiva por Pagos Pendientes',
        content: `${count} ${count === 1 ? 'cuota vencida' : 'cuotas vencidas'}. La más antigua: ${daysOverdue} ${daysOverdue === 1 ? 'día' : 'días'} de retraso.`,
        type: 'danger'
      };
    }

    if (alertType === 'due-soon') {
      const nextPayment = this.getNextDuePayment(suscripcion);
      if (nextPayment) {
        const daysUntil = this.getDaysUntilDue(nextPayment.paymentDate);

        if (daysUntil === 0) {
          return {
            title: 'Pago Vence Hoy',
            content: `Tu cuota de S/ ${nextPayment.amount} vence hoy. ¡No olvides realizar el pago para mantener tu suscripción activa!`,
            type: 'warning-urgent'
          };
        } else if (daysUntil <= 3) {
          return {
            title: 'Pago Próximo a Vencer',
            content: `Tu cuota de S/ ${nextPayment.amount} vence en ${daysUntil} ${daysUntil === 1 ? 'día' : 'días'}. Te recomendamos realizar el pago pronto.`,
            type: 'warning'
          };
        } else if (daysUntil <= 7) {
          return {
            title: 'Recordatorio de Pago',
            content: `Tu próxima cuota de S/ ${nextPayment.amount} vence en ${daysUntil} días (${this.formatDate(nextPayment.paymentDate)}). Mantén tu suscripción al día.`,
            type: 'info'
          };
        }
      }
    }

    return { title: '', content: '', type: 'none' };
  }

  // Método para obtener el número de documentos disponibles
  getDocumentCount(suscripcion: MembresiaSuscripcion): number {
    let count = 0;
    Object.keys(suscripcion.documents).forEach(nivel => {
      Object.keys(suscripcion.documents[nivel]).forEach(materia => {
        Object.keys(suscripcion.documents[nivel][materia]).forEach(grado => {
          count += suscripcion.documents[nivel][materia][grado].length;
        });
      });
    });
    return count;
  }

  // Método para obtener el estado de los pagos
  getPaymentStatus(suscripcion: MembresiaSuscripcion): { pendientes: number, pagados: number } {
    const pendientes = suscripcion.pagos.filter(p => p.paymentStatus === 'PENDIENTE').length;
    const pagados = suscripcion.pagos.filter(p => p.paymentStatus === 'PAGADO').length;
    return { pendientes, pagados };
  }

  // Método para verificar si un pago específico puede ser pagado
  canPayment(pago: any, suscripcion: MembresiaSuscripcion): boolean {
    // Solo permitir pago si el estado es PENDIENTE
    if (pago.paymentStatus !== 'PENDIENTE') {
      return false;
    }

    // Obtener todos los pagos pendientes ordenados por ID
    const pagosPendientes = suscripcion.pagos
      .filter(p => p.paymentStatus === 'PENDIENTE')
      .sort((a, b) => a.paymentId - b.paymentId);

    // Solo permitir pagar el que tenga el menor ID
    return pagosPendientes.length > 0 && pagosPendientes[0].paymentId === pago.paymentId;
  }

  // Método para obtener la posición del pago en la cola
  getPaymentPosition(pago: any, suscripcion: MembresiaSuscripcion): number {
    const pagosPendientes = suscripcion.pagos
      .filter(p => p.paymentStatus === 'PENDIENTE')
      .sort((a, b) => a.paymentId - b.paymentId);

    return pagosPendientes.findIndex(p => p.paymentId === pago.paymentId) + 1;
  }

  // Método para obtener el próximo pago disponible
  getNextPayment(suscripcion: MembresiaSuscripcion): any {
    const pagosPendientes = suscripcion.pagos
      .filter(p => p.paymentStatus === 'PENDIENTE')
      .sort((a, b) => a.paymentId - b.paymentId);

    return pagosPendientes.length > 0 ? pagosPendientes[0] : null;
  }

  // Método para formatear fechas
  formatDate(date: string): string {
    return this.dateUtils.formatDate(date);
  }

  verDocumento(code: string) {
    this.tokenData.postToken(code).subscribe({
      next: (response) => {
        if (response.result) {
          this.url = response.data;
          window.open(this.url, '_blank');
        }
      },
      error: (error) => {
        console.error('Error al obtener las suscripciones:', error);
      }
    });
  }

  pagar(pago: any, suscripcion: MembresiaSuscripcion) {
    console.log('💳 [Pago] Iniciando proceso de pago:', {
      paymentId: pago.paymentId,
      subscriptionId: suscripcion.subscriptionId,
      amount: pago.amount
    });
    
    // Limpiar el carrito antes de agregar el pago de la cuota
    this.cartService.clearCart();

    // Crear un item del carrito para el pago de la cuota
    const cuotaItem: CartItem = {
      id: pago.paymentId, // ID único numérico para la cuota
      title: `Cuota - ${suscripcion.membresiaNombre}`,
      description: `Pago de cuota pendiente - ${suscripcion.membresiaNombre}`,
      price: pago.amount,
      imagenUrlPublic: 'assets/images/cuota.png', // Imagen por defecto para cuotas
      isSubscription: false // Es un pago de cuota, no una nueva suscripción
    };

    // Agregar al carrito
    const added = this.cartService.addToCart(cuotaItem);

    if (added) {
      // Persistir flag en sessionStorage para que survive la re-creación del componente
      sessionStorage.setItem('pendingSubscriptionRefresh', 'true');
      sessionStorage.setItem('lastPaidSubscriptionId', suscripcion.subscriptionId?.toString() || '');

      // Invalidar caché antes de navegar
      this.invalidateSubscriptionCache(suscripcion.subscriptionId!);

      this.router.navigate(['/site/checkout']);
    } else {
      console.error('[Pago] Error al agregar la cuota al carrito');
    }
  }

  // ─── Detección de inactivación temporal ────────────────────────────────────

  /**
   * Devuelve true cuando la suscripción está INACTIVA pero el periodo comprado
   * todavía vigente: hoy >= fechaInicioCompra && hoy <= fechaFin.
   * Esto indica que se desactivó por alguna razón (pago, suspensión, etc.)
   * y que el usuario puede reactivarla.
   */
  isTemporarilyInactive(suscripcion: MembresiaSuscripcion): boolean {
    if ((suscripcion.estado || '').toUpperCase() !== 'INACTIVA') return false;
    const raw = suscripcion as any;
    const start = raw.fechaInicioCompra;
    const end = suscripcion.fechaFin;
    if (!start || !end) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const s = new Date(start); s.setHours(0, 0, 0, 0);
    const e = new Date(end); e.setHours(23, 59, 59, 999);
    return today >= s && today <= e;
  }

  /**
   * Devuelve 'OVERDUE_PAYMENT' si la inactivación temporal se debe a un pago
   * vencido (hay un pago PENDIENTE con fechaVencimiento en el pasado).
   * En otros casos devuelve 'OTHER'.
   */
  getTemporaryInactiveReason(suscripcion: MembresiaSuscripcion): 'OVERDUE_PAYMENT' | 'OTHER' {
    if (suscripcion.inactiveReason?.code === 'OVERDUE_PAYMENT') return 'OVERDUE_PAYMENT';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const hasOverduePending = suscripcion.pagos.some(p => {
      if ((p.paymentStatus || '').toUpperCase() !== 'PENDIENTE') return false;
      const due = p.fechaVencimiento || p.dueDate;
      return !!due && new Date(due) < today;
    });
    return hasOverduePending ? 'OVERDUE_PAYMENT' : 'OTHER';
  }

  /**
   * Devuelve los pagos PENDIENTES cuya fechaVencimiento cae dentro de los
   * próximos `daysAhead` días (por defecto 7). Sirve para mostrar avisos.
   */
  getPaymentsDueSoon(suscripcion: MembresiaSuscripcion, daysAhead = 7): PagoSuscripcion[] {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const limit = new Date(today); limit.setDate(limit.getDate() + daysAhead);
    return suscripcion.pagos.filter(p => {
      if ((p.paymentStatus || '').toUpperCase() !== 'PENDIENTE') return false;
      const due = p.fechaVencimiento || p.dueDate;
      if (!due) return false;
      const d = new Date(due); d.setHours(0, 0, 0, 0);
      return d >= today && d <= limit;
    });
  }

  /**
   * Calcula toda la información de estado que necesita la tarjeta:
   * label para el pill, clase CSS, tipo de alerta y mensaje de alerta.
   */
  getSubscriptionStatusInfo(suscripcion: MembresiaSuscripcion): {
    label: string;
    cssClass: string;
    alertType: 'overdue' | 'due-soon' | 'warning' | null;
    alertMessage: string | null;
  } {
    const estado = (suscripcion.estado || '').toUpperCase();

    if (estado === 'ACTIVA') {
      const dueSoon = this.getPaymentsDueSoon(suscripcion);
      if (dueSoon.length > 0) {
        const next = dueSoon[0];
        const due = next.fechaVencimiento || next.dueDate;
        const days = due ? this.getDaysUntilDue(due) : 0;
        const dayStr = days === 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${days} días`;
        return {
          label: 'ACTIVA',
          cssClass: 'activa',
          alertType: 'due-soon',
          alertMessage: `Tienes ${dueSoon.length} cuota(s) próxima(s) a vencer. La próxima vence ${dayStr}.`
        };
      }
      return { label: 'ACTIVA', cssClass: 'activa', alertType: null, alertMessage: null };
    }

    if (this.isTemporarilyInactive(suscripcion)) {
      const reason = this.getTemporaryInactiveReason(suscripcion);
      if (reason === 'OVERDUE_PAYMENT') {
        const count = suscripcion.pagos.filter(p =>
          (p.paymentStatus || '').toUpperCase() === 'PENDIENTE' &&
          (p.fechaVencimiento || p.dueDate) &&
          new Date(p.fechaVencimiento! || p.dueDate!) < new Date()
        ).length;
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
        alertMessage: suscripcion.inactiveReason?.message || 'Tu suscripción ha sido suspendida temporalmente.'
      };
    }

    return { label: 'INACTIVA', cssClass: 'inactiva', alertType: null, alertMessage: null };
  }

  // ─── Clasificación vigente / vencida ────────────────────────────────────────

  // Método para verificar si una suscripción está vigente.
  // Prioridad: el campo `estado` del backend es la fuente de verdad.
  // Las suscripciones INACTIVA temporales (dentro del periodo comprado) también
  // se muestran en la pestaña "Vigentes" con una alerta de motivo.
  isSubscriptionVigente(suscripcion: MembresiaSuscripcion): boolean {
    const estado = (suscripcion.estado || '').toUpperCase();
    if (estado === 'CANCELADA' || estado === 'EXPIRADA') { return false; }
    if (estado === 'ACTIVA') { return true; }
    // INACTIVA dentro del periodo comprado → mostrar en vigentes con alerta
    if (this.isTemporarilyInactive(suscripcion)) { return true; }
    // Para INACTIVA fuera de rango: usar fecha de fin
    if (!suscripcion.fechaFin) { return false; }
    return this.dateUtils.isSubscriptionVigente(suscripcion.fechaFin);
  }

  // Método para verificar si una suscripción está vencida.
  isSubscriptionVencida(suscripcion: MembresiaSuscripcion): boolean {
    const estado = (suscripcion.estado || '').toUpperCase();
    if (estado === 'ACTIVA') { return false; }
    if (estado === 'CANCELADA' || estado === 'EXPIRADA') { return true; }
    // Las temporalmente inactivas van a "vigentes", no a "vencidas"
    if (this.isTemporarilyInactive(suscripcion)) { return false; }
    if (!suscripcion.fechaFin) { return true; }
    return this.dateUtils.isSubscriptionVencida(suscripcion.fechaFin);
  }

  // Método para cambiar el filtro
  cambiarFiltro(filtro: 'vigentes' | 'vencidas'): void {
    this.filtroActual = filtro;
    this.aplicarFiltro();
  }

  // Método para aplicar el filtro actual
  aplicarFiltro(): void {
    if (this.filtroActual === 'vigentes') {
      this.suscripcionesFiltradas = this.suscripcionesArray.filter(sus => this.isSubscriptionVigente(sus));
    } else {
      this.suscripcionesFiltradas = this.suscripcionesArray.filter(sus => this.isSubscriptionVencida(sus));
    }
  }

  // Método para contar suscripciones vigentes
  getContadorVigentes(): number {
    return this.suscripcionesArray.filter(sus => this.isSubscriptionVigente(sus)).length;
  }

  // Método para contar suscripciones vencidas
  getContadorVencidas(): number {
    return this.suscripcionesArray.filter(sus => this.isSubscriptionVencida(sus)).length;
  }

  // Método de búsqueda
  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.searchResults = [];
      this.isSearching = false;
      this.aplicarFiltro();
      return;
    }

    this.isSearching = true;
    const term = this.searchTerm.toLowerCase().trim();

    this.searchResults = this.suscripcionesArray.filter(suscripcion => {
      const nombre = (suscripcion.membresiaNombre || '').toLowerCase();
      const estado = (suscripcion.estado || '').toLowerCase();
      const fechaInicio = this.formatDate(suscripcion.fechaInicio).toLowerCase();
      const fechaFin = this.formatDate(suscripcion.fechaFin).toLowerCase();

      return nombre.includes(term) ||
             estado.includes(term) ||
             fechaInicio.includes(term) ||
             fechaFin.includes(term);
    });

    // Aplicar filtro actual sobre resultados de búsqueda
    this.suscripcionesFiltradas = this.searchResults.filter(sus => {
      if (this.filtroActual === 'vigentes') {
        return this.isSubscriptionVigente(sus);
      } else {
        return this.isSubscriptionVencida(sus);
      }
    });
  }

  // Método para limpiar búsqueda
  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.isSearching = false;
    this.aplicarFiltro();
  }

  // Navegación pública (evita acceso directo a router privado desde template)
  navegarA(path: string[]): void {
    this.router.navigate(path);
  }
}
