import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

export interface PreviewDialogData {
  /** URL de la imagen (modo imagen) */
  imageUrl?: string;
  /** URL del PDF a renderizar (modo PDF) */
  pdfUrl?: string;
  /** Título opcional */
  title?: string;
}

@Component({
    selector: 'ngx-image-dialog',
    templateUrl: './image-dialog.component.html',
    styleUrls: ['./image-dialog.component.scss'],
    standalone: true,
    imports: [NgxExtendedPdfViewerModule]
})
export class ImageDialogComponent {
  pdfLoading = true;
  pdfError = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PreviewDialogData,
    private dialogRef: MatDialogRef<ImageDialogComponent>
  ) {}

  get isPdf(): boolean {
    return !!this.data?.pdfUrl;
  }

  onPdfLoaded(): void {
    this.pdfLoading = false;
    this.pdfError = false;
  }

  onPdfError(_err: any): void {
    this.pdfLoading = false;
    this.pdfError = true;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}