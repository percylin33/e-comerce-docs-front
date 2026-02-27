import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PaymentService } from '../../../@core/backend/services/payment.service';

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
  // Optional fallbacks used by the template
  paymentContactEmail?: string;
  phone?: string;
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
  isLoading: boolean = false;
  isSupAdmin: boolean = false;
  downloadingDocId: number | null = null;
  
  constructor(
    public dialogRef: MatDialogRef<PaymentDocumentsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { paymentDetails: PaymentDetailsData, paymentInfo: any, isLoading?: boolean, isSupAdmin?: boolean },
    private cdr: ChangeDetectorRef,
    private paymentService: PaymentService
  ) {
    console.log('Payment Documents Modal Data:', data);
    this.isLoading = data.isLoading || false;
    this.isSupAdmin = data.isSupAdmin || false;
  }

  ngOnInit(): void {
    if (!this.isLoading) {
      // Calcular todas las propiedades una sola vez al inicializar
      this.calculateProperties();
      this.parseSubscriptionDescription();
    }
  }

  updateData(newData: { paymentDetails: PaymentDetailsData, paymentInfo: any }): void {
    console.log('Payment Documents Modal Updated Data:', newData);
    this.isLoading = false;
    this.data.paymentDetails = newData.paymentDetails;
    // Keep existing paymentInfo or update if provided
    if (newData.paymentInfo) this.data.paymentInfo = newData.paymentInfo;
    
    this.calculateProperties();
    this.parseSubscriptionDescription();
    this.cdr.detectChanges();
  }


  private calculateProperties(): void {
    // Calcular si tiene cupón
    this.calculatedHasCoupon = !!(this.data.paymentDetails.couponCode && this.data.paymentDetails.couponCode.trim() !== '');
    
    // Calcular precio total (subtotal antes de descuento)
    // Usar originalAmount del backend si existe, sino calcular de los documentos
    if (this.data.paymentDetails.originalAmount !== undefined && this.data.paymentDetails.originalAmount > 0) {
      this.calculatedTotalPrice = this.data.paymentDetails.originalAmount;
    } else if (this.data.paymentDetails.isSubscription) {
      this.calculatedTotalPrice = this.data.paymentDetails.subscription?.price || 0;
    } else {
      this.calculatedTotalPrice = this.data.paymentDetails.documents?.reduce((total, doc) => total + doc.price, 0) || 0;
    }
    
    // Usar el descuento que viene del backend
    if (this.calculatedHasCoupon && this.data.paymentDetails.discountAmount !== undefined) {
      // Usar el discountAmount del backend directamente
      this.calculatedDiscountAmount = this.formatPrice(Math.abs(this.data.paymentDetails.discountAmount));
      
      // Calcular mensaje de ahorro
      this.calculatedSavingsMessage = `¡Ahorraste ${this.calculatedDiscountAmount} con tu código promocional!`;
    } else {
      this.calculatedDiscountAmount = this.formatPrice(0);
      this.calculatedSavingsMessage = '';
    }

  }

  /**
   * Parsea y formatea la descripción de la suscripción
   */
  parseSubscriptionDescription(): void {
    try {
      this.parsedSubscriptionDescription = [];
      let desc = this.data.paymentDetails.subscription?.description;
      
      if (!desc) return;
      
      let obj = null;

      // 1. Si es string, limpiamos posibles escapes dobles y parseamos
      if (typeof desc === 'string') {
        // A veces llega como "{\"Ciencia\": ...}" (correctamente escapado json string)
        // O a veces con doble escape "\\\"...\\\""
        // Intentar parse simple primero
        try {
          obj = JSON.parse(desc);
        } catch (e1) {
            // Si falla, probar quitando backslashes escapados
            // e.g. "{\"key\":...}" -> {"key":...}
            try {
               const unescaped = desc.replace(/\\"/g, '"');
               obj = JSON.parse(unescaped); 
            } catch (e2) {
               console.warn('Could not parse subscription description JSON:', desc);
               obj = null;
            }
        }
      } else if (typeof desc === 'object') {
        obj = desc; 
      }
      
      if (!obj) return;
      
      // Si el resultado del primer parse sigue siendo string (doble stringify), parsear de nuevo
      if (typeof obj === 'string') {
         try { obj = JSON.parse(obj); } catch { }
      }

      // 2. Mapear al formato interno { materia: string, grados: string[] }
      if (Array.isArray(obj)) {
        // Caso: [{"materia":"X", "grados":["1","2"]}]
        this.parsedSubscriptionDescription = obj
          .filter(item => item && (item.materia || item.name))
          .map(item => ({
             materia: item.materia || item.name,
             grados: Array.isArray(item.grados || item.grades) 
               ? (item.grados || item.grades) 
               : (item.grados ? [item.grados] : [])
          }));
      } else if (typeof obj === 'object') {
        // Caso: {"Ciencia y Tecnologia": ["1 GRADO", ...]}
        this.parsedSubscriptionDescription = Object.keys(obj).map(key => ({
            materia: key,
            grados: Array.isArray(obj[key]) ? obj[key] : [String(obj[key])]
        }));
      }

    } catch (err) {
      console.warn('Error in parseSubscriptionDescription', err);
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
    return this.data.paymentDetails.isSubscription === true || this.data.paymentDetails.paymentType === 'Suscripción';
  }

  isDocuments(): boolean {
    // Mostrar sección de documentos si hay documentos en la lista
    // O si NO es una suscripción (casos de documentos vacíos o kits fallidos)
    return (this.data.paymentDetails.documents && this.data.paymentDetails.documents.length > 0) || !this.isSubscription();
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

  /**
   * Maneja el error de carga de imagen sin crear loops infinitos
   * Solo intenta cargar un placeholder una vez
   */
  onImageError(event: any): void {
    const target = event.target as HTMLImageElement;
    // Solo cambiar si no estamos ya intentando cargar un placeholder
    if (!target.src.includes('data:image')) {
      // Usar una imagen base64 simple en lugar de intentar cargar un archivo
      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TaW4gaW1hZ2VuPC90ZXh0Pjwvc3ZnPg==';
      // Remover el event listener para evitar loops
      target.onerror = null;
    }
  }

  /**
   * Descarga un documento como SUPADMIN (sin verificar compra)
   */
  downloadDocument(documentId: number, title: string): void {
    this.downloadingDocId = documentId;
    this.paymentService.adminDownloadDocument(documentId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = title || `documento_${documentId}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloadingDocId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al descargar documento:', err);
        this.downloadingDocId = null;
        this.cdr.detectChanges();
      }
    });
  }

}
