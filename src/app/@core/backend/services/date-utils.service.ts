import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateUtilsService {
  private readonly LIMA_TIMEZONE = 'America/Lima';

  /**
   * Obtiene la fecha y hora actual en zona horaria de Lima, Perú
   */
  getTodayInLima(): Date {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.LIMA_TIMEZONE,
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

  /**
   * Obtiene la fecha actual en Lima a medianoche (solo fecha, sin hora)
   */
  getTodayInLimaAtMidnight(): Date {
    const lima = this.getTodayInLima();
    lima.setHours(0, 0, 0, 0);
    return lima;
  }

  /**
   * Verifica si un pago está vencido
   */
  isOverdue(paymentDate: string): boolean {
    const today = this.getTodayInLimaAtMidnight();
    const payment = new Date(paymentDate);
    payment.setHours(0, 0, 0, 0);
    return payment < today;
  }

  /**
   * Calcula días de retraso de un pago
   */
  getDaysOverdue(paymentDate: string): number {
    const today = this.getTodayInLima();
    const payment = new Date(paymentDate);
    const diffTime = today.getTime() - payment.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Calcula días restantes hasta el vencimiento (negativo si ya venció)
   */
  getDaysUntilDue(paymentDate: string): number {
    const today = this.getTodayInLimaAtMidnight();
    const payment = new Date(paymentDate);
    payment.setHours(0, 0, 0, 0);
    const diffTime = payment.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica si hay pagos que vencen pronto (1-7 días)
   */
  hasPaymentsDueSoon(pagos: any[]): boolean {
    return pagos.some(pago => {
      if (pago.paymentStatus === 'PENDIENTE') {
        const daysUntil = this.getDaysUntilDue(pago.paymentDate);
        return daysUntil >= 0 && daysUntil <= 7;
      }
      return false;
    });
  }

  /**
   * Obtiene el próximo pago que vence pronto
   */
  getNextDuePayment(pagos: any[]): any {
    const upcomingPayments = pagos
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

  /**
   * Verifica si una suscripción está vigente
   */
  isSubscriptionVigente(fechaFin: string): boolean {
    const today = this.getTodayInLimaAtMidnight();
    const endDate = new Date(fechaFin);
    endDate.setHours(0, 0, 0, 0);
    return endDate >= today;
  }

  /**
   * Verifica si una suscripción está vencida
   */
  isSubscriptionVencida(fechaFin: string): boolean {
    const today = this.getTodayInLimaAtMidnight();
    const endDate = new Date(fechaFin);
    endDate.setHours(0, 0, 0, 0);
    return endDate < today;
  }

  /**
   * Formatea fecha para display
   */
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

  /**
   * Obtiene la hora actual de Lima como string (para debugging)
   */
  getCurrentLimaTime(): string {
    const limaTime = this.getTodayInLima();
    return limaTime.toLocaleString('es-PE', {
      timeZone: this.LIMA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}