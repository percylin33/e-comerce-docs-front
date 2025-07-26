import { Component, OnInit } from '@angular/core';
import { MembresiaData, MembresiaSuscripcion } from '../../@core/interfaces/membresia';
import { TokenData } from '../../@core/interfaces/token';
import { Router } from '@angular/router';
import { CartService } from '../../@core/backend/services/cart.service';
import { CartItem } from '../../@core/interfaces/cartItem';

@Component({
  selector: 'ngx-suscripciones',
  templateUrl: './suscripciones.component.html',
  styleUrls: ['./suscripciones.component.scss']
})
export class SuscripcionesComponent implements OnInit {
  

  suscripciones: { [nombre: string]: MembresiaSuscripcion[] } = {};
  suscripcionesArray: MembresiaSuscripcion[] = [];
  id: number = 0;
  url: string = '';
  
  // Estados de carga
  loading: boolean = true;
  error: string = '';
  
  // Filtros para suscripciones
  filtroActual: 'vigentes' | 'vencidas' = 'vigentes';
  suscripcionesFiltradas: MembresiaSuscripcion[] = [];
  
  constructor(
    private membresiaData: MembresiaData,
    private tokenData: TokenData,
    private router: Router,
    private cartService: CartService
  ) {

  }

  // Método utilitario para obtener la fecha actual en la zona horaria de Lima, Perú
  private getTodayInLima(): Date {
    // Usar la API nativa para obtener la fecha en la zona horaria de Lima
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(part => part.type === 'year')!.value);
    const month = parseInt(parts.find(part => part.type === 'month')!.value) - 1; // Los meses en JS son 0-indexados
    const day = parseInt(parts.find(part => part.type === 'day')!.value);
    const hour = parseInt(parts.find(part => part.type === 'hour')!.value);
    const minute = parseInt(parts.find(part => part.type === 'minute')!.value);
    const second = parseInt(parts.find(part => part.type === 'second')!.value);
    
    return new Date(year, month, day, hour, minute, second);
  }

  // Método para obtener fecha actual de Lima sin horas (solo fecha)
  private getTodayInLimaAtMidnight(): Date {
    const lima = this.getTodayInLima();
    lima.setHours(0, 0, 0, 0);
    return lima;
  }

  // Método público para obtener la hora actual de Lima como string (para debugging)
  getCurrentLimaTime(): string {
    const limaTime = this.getTodayInLima();
    return limaTime.toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }


  ngOnInit(): void {
    this.loadUserSubscriptions();
  }

  loadUserSubscriptions(): void {
    this.loading = true;
    this.error = '';
    
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      this.id = userData.id;
    }

    this.membresiaData.getMembresiasUser(this.id).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.result) {
          
          this.suscripciones = response.data;
          
          // Convertir la estructura anidada en un array plano
          this.suscripcionesArray = [];
          Object.keys(response.data).forEach(nombreMembresia => {
            const suscripcionesDeMembresia = response.data[nombreMembresia];
            
            // Ordenar los pagos por ID de menor a mayor en cada suscripción
            suscripcionesDeMembresia.forEach(suscripcion => {
              if (suscripcion.pagos && suscripcion.pagos.length > 0) {
                suscripcion.pagos.sort((a, b) => a.paymentId - b.paymentId);
              }
            });
            
            this.suscripcionesArray.push(...suscripcionesDeMembresia);
          });
          
          // Ordenar por fecha de inicio (más reciente primero)
          this.suscripcionesArray.sort((a, b) => 
            new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
          );
          
          // Aplicar filtro inicial
          this.aplicarFiltro();
          
        } else {
          this.error = 'No se pudieron cargar las suscripciones';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Error al obtener las suscripciones';
        console.error('Error al obtener las suscripciones:', error);
      }
    });
  }
  pagosVisibles: { [key: number]: boolean } = {};
  nivelesVisibles: { [key: string]: boolean } = {};
  materiasVisibles: { [key: string]: boolean } = {};
  gradosVisibles: { [key: string]: boolean } = {};
  detallesVisibles: { [key: number]: boolean } = {};

  togglePagos(index: number) {
    this.pagosVisibles[index] = !this.pagosVisibles[index];
  }

  toggleNivel(nivel: string) {
    this.nivelesVisibles[nivel] = !this.nivelesVisibles[nivel];
  }

  toggleMateria(index: number, nivel: string, materia: string) {
    const key = `${index}-${nivel}-${materia}`;
    this.materiasVisibles[key] = !this.materiasVisibles[key];
  }
  toggleGrado(nivel: string, materia: string, grado: string) {
    const key = `${nivel}-${materia}-${grado}`;
    this.gradosVisibles[key] = !this.gradosVisibles[key];
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
    const today = this.getTodayInLimaAtMidnight(); // Usar hora de Lima
    
    return suscripcion.pagos.some(pago => {
      if (pago.paymentStatus === 'PENDIENTE') {
        const paymentDate = new Date(pago.paymentDate);
        paymentDate.setHours(0, 0, 0, 0);
        return paymentDate < today;
      }
      return false;
    });
  }

  // Método para obtener cuántas cuotas están vencidas
  getOverduePaymentsCount(suscripcion: MembresiaSuscripcion): number {
    const today = this.getTodayInLimaAtMidnight(); // Usar hora de Lima
    
    return suscripcion.pagos.filter(pago => {
      if (pago.paymentStatus === 'PENDIENTE') {
        const paymentDate = new Date(pago.paymentDate);
        paymentDate.setHours(0, 0, 0, 0);
        return paymentDate < today;
      }
      return false;
    }).length;
  }

  // Método para obtener la cuota más antigua vencida
  getOldestOverduePayment(suscripcion: MembresiaSuscripcion): any {
    const today = this.getTodayInLimaAtMidnight(); // Usar hora de Lima
    
    const overduePayments = suscripcion.pagos
      .filter(pago => {
        if (pago.paymentStatus === 'PENDIENTE') {
          const paymentDate = new Date(pago.paymentDate);
          paymentDate.setHours(0, 0, 0, 0);
          return paymentDate < today;
        }
        return false;
      })
      .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
    
    return overduePayments.length > 0 ? overduePayments[0] : null;
  }

  // Método para calcular días de retraso
  getDaysOverdue(paymentDate: string): number {
    const today = this.getTodayInLima(); // Usar hora de Lima
    const payment = new Date(paymentDate);
    const diffTime = today.getTime() - payment.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  // Método para obtener días restantes hasta el vencimiento (negativo si ya venció)
  getDaysUntilDue(paymentDate: string): number {
    const today = this.getTodayInLimaAtMidnight(); // Usar hora de Lima
    const payment = new Date(paymentDate);
    payment.setHours(0, 0, 0, 0);
    const diffTime = payment.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Método para verificar si hay pagos que vencen pronto (1-7 días)
  hasPaymentsDueSoon(suscripcion: MembresiaSuscripcion): boolean {
    return suscripcion.pagos.some(pago => {
      if (pago.paymentStatus === 'PENDIENTE') {
        const daysUntil = this.getDaysUntilDue(pago.paymentDate);
        return daysUntil >= 0 && daysUntil <= 7;
      }
      return false;
    });
  }

  // Método para obtener el próximo pago que vence pronto
  getNextDuePayment(suscripcion: MembresiaSuscripcion): any {
    const upcomingPayments = suscripcion.pagos
      .filter(pago => {
        if (pago.paymentStatus === 'PENDIENTE') {
          const daysUntil = this.getDaysUntilDue(pago.paymentDate);
          return daysUntil >= 0 && daysUntil <= 7;
        }
        return false;
      })
      .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
    
    return upcomingPayments.length > 0 ? upcomingPayments[0] : null;
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
    const dateObj = new Date(date);
    
    // Verificar si la fecha incluye hora (no es medianoche exacta)
    const hasTime = dateObj.getHours() !== 0 || dateObj.getMinutes() !== 0 || dateObj.getSeconds() !== 0;
    
    if (hasTime) {
      // Mostrar fecha con hora
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      // Mostrar solo fecha
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
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
      // Navegar al checkout
      this.router.navigate(['/site/checkout']);
    } else {
      console.error('Error al agregar la cuota al carrito');
    }
  }

  // Método para verificar si una suscripción está vigente (fecha de fin no ha pasado)
  isSubscriptionVigente(suscripcion: MembresiaSuscripcion): boolean {
    const today = this.getTodayInLimaAtMidnight(); // Usar hora de Lima
    
    const endDate = new Date(suscripcion.fechaFin);
    endDate.setHours(0, 0, 0, 0);
    
    // Una suscripción está vigente si la fecha de fin aún no ha pasado
    return endDate >= today;
  }

  // Método para verificar si una suscripción está vencida (fecha de fin ya pasó)
  isSubscriptionVencida(suscripcion: MembresiaSuscripcion): boolean {
    const today = this.getTodayInLimaAtMidnight(); // Usar hora de Lima
    
    const endDate = new Date(suscripcion.fechaFin);
    endDate.setHours(0, 0, 0, 0);
    
    // Una suscripción está vencida si la fecha de fin ya pasó
    return endDate < today;
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
}
