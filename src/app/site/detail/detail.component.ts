import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { DocumentData, DocumentDetail } from '../../@core/interfaces/documents';
import { ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ImageDialogComponent } from './image-dialog/image-dialog.component';
import { environment } from '../../../environments/environment';
import { DocumentViewerComponent } from '../../shared/component/document-viewer/document-viewer.component';
import { AppBadgeComponent } from '../../shared/ui/badge/badge.component';
import { AppIconButtonComponent } from '../../shared/ui/icon-button/icon-button.component';
import { PdfViewerLazyComponent } from './pdf-viewer-lazy/pdf-viewer-lazy.component';
import { CarrouselVerticalComponent } from '../../shared/component/carrousel-vertical/carrousel-vertical.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'ngx-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  standalone: true,
  imports: [
    DocumentViewerComponent,
    AppBadgeComponent,
    AppIconButtonComponent,
    PdfViewerLazyComponent,
    CarrouselVerticalComponent,
    MatIconModule,
    HttpClientModule
  ],
})
export class DetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private documentsService = inject(DocumentData);
  private dialog = inject(MatDialog);

  documentId!: string;
  documentDetail: DocumentDetail | null = null;
  urls: string[] = [];

  pdfViewerUrl: string = '';
  pdfStreamUrl: string = '';
  previewDialogOpen: boolean = false;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const id = params.get('id') ?? '';
      this.documentId = id;
      this.loadDocument(this.documentId);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    try {
      sessionStorage.removeItem('currentDocument');
    } catch { }
  }

  loadDocument(id: string): void {
    if (!id) return;

    // Reset state
    this.pdfViewerUrl = '';
    this.pdfStreamUrl = '';
    this.documentDetail = null;

    this.documentsService.getDocument(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.urls = response.data.imagenUrlPublic.split('|');
        if (this.urls && response.data.format === 'ZIP') {
          response.data.imagenUrlPublic = this.urls[0];
        }
        this.documentDetail = response.data;

        console.log('[DetailComponent] documentDetail loaded:', this.documentDetail);
        console.log('[DetailComponent] documentDetail.category:', this.documentDetail?.category);
        console.log('[DetailComponent] Condition check - documentDetail:', !!this.documentDetail, 'category:', !!this.documentDetail?.category);

        if (response.data.pdfPreviewUrl) {
          this.pdfViewerUrl = this.processGoogleDriveUrl(response.data.pdfPreviewUrl);
          this.pdfStreamUrl = `${environment.apiUrl}/api/v1/document/${response.data.id}/preview-pdf`;
        }

        this.saveCurrentDocumentContext(response.data);
      },
      error: (error) => {
        console.error('[DetailComponent] Error loading document:', error);
      }
    });
  }

  private processGoogleDriveUrl(url: string): string {
    if (!url) return url;
    const fileIdMatch = url.match(/\/file\/d\/([^\/\?]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
    if (!url.includes('/') && !url.includes('.')) {
      return `https://drive.google.com/file/d/${url}/preview`;
    }
    return url;
  }

  private saveCurrentDocumentContext(document: DocumentDetail): void {
    try {
      const documentContext = {
        id: document.id,
        category: document.category,
        materia: document.materia,
        nivel: document.nivel,
        grado: document.grado,
        subjectId: document.grade?.subject?.id,
        format: document.format
      };
      sessionStorage.setItem('currentDocument', JSON.stringify(documentContext));
    } catch { }
  }

  openImageDialog(imageUrl: string): void {
    this.dialog.open(ImageDialogComponent, {
      data: { imageUrl },
      panelClass: 'full-screen-dialog'
    });
  }

  openPreview(): void {
    if (this.pdfStreamUrl) {
      this.previewDialogOpen = true;
      const ref = this.dialog.open(ImageDialogComponent, {
        data: { pdfUrl: this.pdfStreamUrl, title: this.documentDetail?.title },
        panelClass: 'full-screen-dialog',
        maxWidth: '100vw',
        width: '100vw',
        height: '100vh'
      });
      ref.afterClosed().subscribe(() => {
        this.previewDialogOpen = false;
      });
      return;
    }
    if (this.documentDetail?.imagenUrlPublic) {
      this.openImageDialog(this.documentDetail.imagenUrlPublic);
    }
  }

  onPdfLoaded(): void {
    // PDF cargado exitosamente
  }

  onPdfLoadError(_err: any): void {
    // Error manejado por el componente hijo
  }

  onFirstPageRendered(): void {
    // Primera página renderizada
  }
}
