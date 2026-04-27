import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

/**
 * Wrapper standalone alrededor de ngx-extended-pdf-viewer.
 *
 * Existe para que los componentes consumidores (DetailComponent, ImageDialogComponent)
 * NO importen NgxExtendedPdfViewerModule directamente. Si lo importaran, el bundler
 * meteria los ~330 KB del visor en su chunk eager (site-module). En su lugar,
 * referencian este wrapper SOLO dentro de bloques @defer en sus plantillas, y
 * Angular emite un chunk separado que se descarga bajo demanda.
 *
 * Toda la configuracion "modo lectura sin descargas" vive aqui para evitar
 * duplicacion entre los dos consumidores.
 */
@Component({
  selector: 'app-pdf-viewer-lazy',
  standalone: true,
  imports: [NgxExtendedPdfViewerModule],
  template: `
    <ngx-extended-pdf-viewer
      [src]="src"
      [textLayer]="true"
      [showToolbar]="true"
      [showSidebarButton]="false"
      [showFindButton]="false"
      [showPagingButtons]="true"
      [showDrawEditor]="false"
      [showTextEditor]="false"
      [showZoomButtons]="true"
      [showPresentationModeButton]="false"
      [showOpenFileButton]="false"
      [showPrintButton]="false"
      [showDownloadButton]="false"
      [showSecondaryToolbarButton]="false"
      [showRotateButton]="false"
      [showHandToolButton]="false"
      [showScrollingButton]="false"
      [showSpreadButton]="false"
      [showPropertiesButton]="false"
      [useBrowserLocale]="true"
      [enablePrint]="false"
      (pdfLoaded)="loaded.emit()"
      (pdfLoadingFailed)="loadError.emit($event)"
      [height]="height">
    </ngx-extended-pdf-viewer>
  `,
  styles: [':host { display: block; width: 100%; height: 100%; }'],
})
export class PdfViewerLazyComponent {
  @Input() src: string | Uint8Array | undefined;
  @Input() height: string = '100%';
  @Output() loaded = new EventEmitter<void>();
  @Output() loadError = new EventEmitter<unknown>();
}
