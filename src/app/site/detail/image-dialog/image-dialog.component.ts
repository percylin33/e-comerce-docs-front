import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PdfViewerLazyComponent } from '../pdf-viewer-lazy/pdf-viewer-lazy.component';

export interface PreviewDialogData {
  /** URL de la imagen (modo imagen) */
  imageUrl?: string;
  /** URL del PDF a renderizar (modo PDF) */
  pdfUrl?: string;
  /** URL de Google Drive para fallback */
  googleDriveUrl?: string;
  /** Título opcional */
  title?: string;
}

@Component({
    selector: 'ngx-image-dialog',
    templateUrl: './image-dialog.component.html',
    styleUrls: ['./image-dialog.component.scss'],
    standalone: true,
    imports: [PdfViewerLazyComponent]
})
export class ImageDialogComponent {
  data = inject<PreviewDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<ImageDialogComponent>>(MatDialogRef);

  pdfLoading = true;

  get isPdf(): boolean {
    return !!this.data?.pdfUrl;
  }

  onPdfLoaded(): void {
    this.pdfLoading = false;
  }

  onPdfError(_err: any): void {
    this.pdfLoading = false;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}