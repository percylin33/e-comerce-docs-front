import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SubscriptionDocumentDetail, SubscriptionDocument } from '../../../@core/interfaces/suscripciones';
import { TokenData } from '../../../@core/interfaces/token';
import { NbIconModule } from '@nebular/theme';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

export interface DocumentosDialogData {
  subscriptionId: number;
  subscriptionName: string;
  documents: { [key: string]: SubscriptionDocumentDetail[] };
}

@Component({
    selector: 'ngx-documentos-dialog',
    templateUrl: './documentos-dialog.component.html',
    styleUrls: ['./documentos-dialog.component.scss'],
    standalone: true,
    imports: [NbIconModule, MatIconButton, MatIcon, MatButton]
})
export class DocumentosDialogComponent {
  subscriptionKeys: string[] = [];
  totalDocuments = 0;
  processedDocuments: any = {};
  
  // Estados de visibilidad para la navegación jerárquica
  materiasVisibles: { [key: string]: boolean } = {};
  gradosVisibles: { [key: string]: boolean } = {};

  constructor(
    public dialogRef: MatDialogRef<DocumentosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DocumentosDialogData,
    private tokenData: TokenData
  ) {
    this.subscriptionKeys = Object.keys(data.documents || {});
    this.processDocuments();
    this.calculateTotalDocuments();
  }

  /**
   * Procesa los documentos del backend organizándolos por nivel > materia > grado
   */
  private processDocuments(): void {
    this.processedDocuments = {};
    
    this.subscriptionKeys.forEach(key => {
      if (this.data.documents[key] && Array.isArray(this.data.documents[key])) {
        this.data.documents[key].forEach(subscriptionDetail => {
          // Los documentos ya vienen organizados en la estructura documents
          if (subscriptionDetail.documents) {
            // Iterar sobre la estructura ya organizada nivel > materia > grado
            Object.keys(subscriptionDetail.documents).forEach(nivel => {
              if (!this.processedDocuments[nivel]) {
                this.processedDocuments[nivel] = {};
              }
              
              Object.keys(subscriptionDetail.documents[nivel]).forEach(materia => {
                if (!this.processedDocuments[nivel][materia]) {
                  this.processedDocuments[nivel][materia] = {};
                }
                
                Object.keys(subscriptionDetail.documents[nivel][materia]).forEach(grado => {
                  if (!this.processedDocuments[nivel][materia][grado]) {
                    this.processedDocuments[nivel][materia][grado] = [];
                  }
                  
                  // Los documentos ya están en el array correcto
                  const documentosDelGrado = subscriptionDetail.documents[nivel][materia][grado];
                  if (Array.isArray(documentosDelGrado)) {
                    this.processedDocuments[nivel][materia][grado].push(...documentosDelGrado);
                  }
                });
              });
            });
          }
        });
      }
    });
  }

  /**
   * Calcula el total de documentos disponibles
   */
  private calculateTotalDocuments(): void {
    this.totalDocuments = 0;
    
    Object.keys(this.processedDocuments).forEach(nivel => {
      Object.keys(this.processedDocuments[nivel]).forEach(materia => {
        Object.keys(this.processedDocuments[nivel][materia]).forEach(grado => {
          this.totalDocuments += this.processedDocuments[nivel][materia][grado].length;
        });
      });
    });
  }

  /**
   * Obtiene las claves de un objeto
   */
  getKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  /**
   * Alterna la visibilidad de una materia
   */
  toggleMateria(nivel: string, materia: string): void {
    const key = `${nivel}-${materia}`;
    this.materiasVisibles[key] = !this.materiasVisibles[key];
  }

  /**
   * Alterna la visibilidad de un grado
   */
  toggleGrado(nivel: string, materia: string, grado: string): void {
    const key = `${nivel}-${materia}-${grado}`;
    this.gradosVisibles[key] = !this.gradosVisibles[key];
  }

  /**
   * Verifica si una materia está visible
   */
  isMateriaVisible(nivel: string, materia: string): boolean {
    const key = `${nivel}-${materia}`;
    return this.materiasVisibles[key] || false;
  }

  /**
   * Verifica si un grado está visible
   */
  isGradoVisible(nivel: string, materia: string, grado: string): boolean {
    const key = `${nivel}-${materia}-${grado}`;
    return this.gradosVisibles[key] || false;
  }

  /**
   * Obtiene el número de grados en una materia
   */
  getGradosCount(nivel: string, materia: string): number {
    return Object.keys(this.processedDocuments[nivel][materia]).length;
  }

  /**
   * Obtiene el número de documentos en un grado
   */
  getDocumentosCount(nivel: string, materia: string, grado: string): number {
    return this.processedDocuments[nivel][materia][grado].length;
  }

  /**
   * Maneja la descarga de documentos usando el servicio de tokens
   */
  verDocumento(fileUrlPublic: string): void {
    if (!fileUrlPublic || !fileUrlPublic.trim()) {
      console.error('URL del documento no válida:', fileUrlPublic);
      return;
    }

    this.tokenData.postToken(fileUrlPublic).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          window.open(response.data, '_blank');
        } else {
          // Fallback: intentar abrir directamente
          window.open(fileUrlPublic, '_blank');
        }
      },
      error: (error) => {
        console.error('Error al obtener el token del documento:', error);
        // Fallback: intentar abrir directamente
        window.open(fileUrlPublic, '_blank');
      }
    });
  }

  /**
   * Formatea el precio en formato de moneda
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(price);
  }

  /**
   * Cierra el modal
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  // === MÉTODOS DE COMPATIBILIDAD (para debugging temporal) ===
  
  getDocumentsForSubscription(key: string): SubscriptionDocument[] {
    const subscriptionDetails = this.data.documents[key];
    if (!subscriptionDetails || !Array.isArray(subscriptionDetails)) {
      return [];
    }
    
    const allDocuments: SubscriptionDocument[] = [];
    subscriptionDetails.forEach(detail => {
      if (detail.documentos && Array.isArray(detail.documentos)) {
        allDocuments.push(...detail.documentos);
      }
    });
    
    return allDocuments;
  }

  getSubscriptionInfo(key: string): SubscriptionDocumentDetail | null {
    const subscriptionDetails = this.data.documents[key];
    return subscriptionDetails && subscriptionDetails.length > 0 ? subscriptionDetails[0] : null;
  }

  downloadDocument(document: SubscriptionDocument): void {
    this.verDocumento(document.fileUrlPublic);
  }
}
