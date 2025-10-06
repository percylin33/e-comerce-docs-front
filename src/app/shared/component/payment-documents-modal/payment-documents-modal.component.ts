import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface PaymentDetailsData {
  isSubscription: boolean;
  paymentType: string;
  summary: string;
  documents?: any[];
  subscription?: any;
  couponCode?: string;
  discountPercentage?: number;
  originalAmount?: number;
  discountAmount?: number;
}

@Component({
  selector: 'ngx-payment-documents-modal',
  templateUrl: './payment-documents-modal.component.html',
  styleUrls: ['./payment-documents-modal.component.scss']
})
export class PaymentDocumentsModalComponent implements OnInit {
  
  // Propiedades calculadas una sola vez
  calculatedDiscountAmount: string = '';
  calculatedTotalPrice: number = 0;
  calculatedHasCoupon: boolean = false;
  calculatedSavingsMessage: string = '';
    parsedSubscriptionDescription: { materia: string; grados: string[] }[] = [];
  
  constructor(
    public dialogRef: MatDialogRef<PaymentDocumentsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { paymentDetails: PaymentDetailsData, paymentInfo: any }
  ) {}

  ngOnInit(): void {
    // Calcular todas las propiedades una sola vez al inicializar
    this.calculateProperties();
      this.parseSubscriptionDescription();
  }

  private calculateProperties(): void {
    // Calcular si tiene cupón
    this.calculatedHasCoupon = !!(this.data.paymentDetails.couponCode && this.data.paymentDetails.couponCode.trim() !== '');
    
    // Calcular precio total
    if (this.data.paymentDetails.isSubscription) {
      this.calculatedTotalPrice = this.data.paymentDetails.subscription?.price || 0;
    } else {
      this.calculatedTotalPrice = this.data.paymentDetails.documents?.reduce((total, doc) => total + doc.price, 0) || 0;
    }
    
    // Calcular descuento aplicado
    if (this.calculatedHasCoupon) {
      const finalPrice = this.data.paymentInfo.amount;
      const descuentoAplicado = this.calculatedTotalPrice - finalPrice;
      const redondeado = Math.round((descuentoAplicado + Number.EPSILON) * 100) / 100;
      this.calculatedDiscountAmount = this.formatPrice(redondeado);
      
      // Calcular mensaje de ahorro
      this.calculatedSavingsMessage = `¡Ahorraste ${this.calculatedDiscountAmount} con tu código promocional!`;
    } else {
      this.calculatedDiscountAmount = this.formatPrice(0);
      this.calculatedSavingsMessage = '';
    }

  }
    /**
     * Parsea y formatea la descripción de la suscripción si es un JSON válido.
     * Espera formato: '[{"materia":"COMUNICACION","grados":["1","2"]}, ...]'
     */
    parseSubscriptionDescription(): void {
      this.parsedSubscriptionDescription = [];
      const desc = this.data.paymentDetails.subscription?.description;
      if (!desc) return;
      try {
        const obj = JSON.parse(desc);
        // Si es array, usar el parser anterior
        if (Array.isArray(obj)) {
          this.parsedSubscriptionDescription = obj.filter(item => item.materia && item.grados);
        } else if (typeof obj === 'object' && obj !== null) {
          // Si es objeto tipo { "Inicial": ["UNIDOCENTE"] }
          this.parsedSubscriptionDescription = Object.keys(obj).map(key => ({ materia: key, grados: obj[key] }));
        }
      } catch (e) {
        // No es JSON válido, no hacer nada
      }
    }

  onClose(): void {
    this.dialogRef.close();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(price);
  }

  formatCategory(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'PLANIFICACION': 'Planificación',
      'EVALUACION': 'Evaluación',
      'ESTRATEGIAS': 'Estrategias',
      'KITS': 'Kits',
      'EBOOKS': 'Ebooks',
      'TALLERES': 'Talleres',
      'PLAN_LECTOR': 'Plan Lector',
      'REFORZAMIENTO': 'Reforzamiento'
    };
    return categoryMap[category] || category;
  }

  formatMateria(materia: string): string {
    if (!materia) return 'No especificada';
    
    const materiaMap: { [key: string]: string } = {
      'COMUNICACION': 'Comunicación',
      'MATEMATICA': 'Matemática',
      'CIENCIA_Y_TECNOLOGIA': 'Ciencia y Tecnología',
      'PERSONAL_SOCIAL': 'Personal Social',
      'ARTE_Y_CULTURA': 'Arte y Cultura',
      'EDUCACION_FISICA': 'Educación Física',
      'EDUCACION_RELIGIOSA': 'Educación Religiosa',
      'INGLES': 'Inglés'
    };
    return materiaMap[materia] || materia;
  }

  getTotalPrice(): number {
    return this.calculatedTotalPrice;
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  isSubscription(): boolean {
    return this.data.paymentDetails.isSubscription;
  }

  isDocuments(): boolean {
    return !this.data.paymentDetails.isSubscription;
  }

  hasCoupon(): boolean {
    return this.calculatedHasCoupon;
  }

  formatDiscount(percentage: number): string {
    return `${percentage}%`;
  }

  getSavingsMessage(): string {
    return this.calculatedSavingsMessage;
  }

  get discountAmount(): string {
    return this.calculatedDiscountAmount;
  }

}
