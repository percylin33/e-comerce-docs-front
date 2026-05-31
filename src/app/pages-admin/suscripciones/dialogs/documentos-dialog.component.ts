import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SubscriptionDocumentDetail, SubscriptionDocument } from '../../../@core/interfaces/suscripciones';
import { DownloadSessionService } from '../../../@core/services/download-session.service';
import { NbIconModule, NbToastrService } from '@nebular/theme';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

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
  dialogRef = inject<MatDialogRef<DocumentosDialogComponent>>(MatDialogRef);
  data = inject<DocumentosDialogData>(MAT_DIALOG_DATA);
  private sessionsService = inject(DownloadSessionService);
  private toastr = inject(NbToastrService);

  subscriptionKeys: string[] = [];
  totalDocuments = 0;
  processedDocuments: any = {};

  // Estados de visibilidad para la navegación jerárquica
  materiasVisibles: { [key: string]: boolean } = {};
  gradosVisibles: { [key: string]: boolean } = {};

  // Locks por documento para evitar dobles clicks mientras se crea la sesion.
  private previewingIds = new Set<number>();

  constructor() {
    const data = this.data;

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
   * Abre el documento en una pestaña nueva via sesion de descarga (intent PREVIEW).
   *
   * Sustituye al flujo legacy basado en `tokenData.postToken(fileUrlPublic)`.
   * El back valida acceso (admin tiene bypass) y devuelve una URL single-use con TTL,
   * que el navegador puede abrir directamente.
   */
  verDocumento(documento: SubscriptionDocument): void {
    if (!documento || !documento.id) {
      this.toastr.warning('No se pudo identificar el documento.', 'Documento inválido');
      return;
    }

    if (this.previewingIds.has(documento.id)) return;
    this.previewingIds.add(documento.id);

    this.sessionsService
      .createSession({ documentId: documento.id, intent: 'PREVIEW' })
      .pipe(
        timeout(15000),
        catchError((err) =>
          throwError(() =>
            err?.name === 'TimeoutError' ? { status: 0, _timeout: true } : err,
          ),
        ),
      )
      .subscribe({
        next: (session) => {
          this.previewingIds.delete(documento.id);
          if (!session?.downloadUrl) {
            this.toastr.danger('No se pudo preparar la vista previa.', 'Error');
            return;
          }
          window.open(session.downloadUrl, '_blank', 'noopener,noreferrer');
        },
        error: (err: any) => {
          this.previewingIds.delete(documento.id);
          let message = 'No se pudo abrir el documento. Intenta de nuevo.';
          if (err?.status === 429) {
            message = 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.';
          } else if (err?.status === 410 || err?.status === 404) {
            message = 'El permiso expiró. Intenta de nuevo.';
          } else if (err?.status === 403) {
            message = 'No tienes acceso a este documento.';
          } else if (err?._timeout || err?.status === 0) {
            message = 'El servidor tardó demasiado. Intenta de nuevo.';
          }
          this.toastr.danger(message, 'Error', { duration: 7000 });
        },
      });
  }

  /** Indica si la sesion del documento se esta creando (UI lock). */
  isPreviewing(documentId: number): boolean {
    return this.previewingIds.has(documentId);
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
    this.verDocumento(document);
  }
}
