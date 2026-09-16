import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  LOCALE_ID,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NbIconModule, NbButtonModule, NbTooltipModule } from '@nebular/theme';
import { MatCard, MatCardHeader, MatCardContent } from '@angular/material/card';

import {
  CompraAgrupada,
  DocumentoComprado,
  DownloadState,
} from '../shared/documento-comprado.model';
import {
  formatDate,
  getFormatIcon,
  groupDocumentsByPurchase,
} from '../shared/document-actions.helper';

/**
 * Vista clásica preservada del componente original.
 * Recibe la lista plana desde el shell y la reagrupa por compra.
 * Toda la lógica de descarga vive en el shell: este hijo solo emite el evento.
 */
@Component({
  selector: 'ngx-documentos-list-legacy',
  templateUrl: './documentos-list-legacy.component.html',
  styleUrls: ['./documentos-list-legacy.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NbIconModule,
    NbButtonModule,
    NbTooltipModule,
    MatCard,
    MatCardHeader,
    MatCardContent,
  ],
})
export class DocumentosListLegacyComponent {
  private readonly locale = inject(LOCALE_ID);

  private readonly _documents = signal<DocumentoComprado[]>([]);
  @Input({ required: true })
  set documents(value: DocumentoComprado[]) {
    const next = value || [];
    const prevKeys = new Set(this._documents().map((d) => d.id));
    const isInitialSet = this._documents().length === 0;
    this._documents.set(next);
    if (isInitialSet) {
      // Primer set: todas las compras arrancan colapsadas.
      this.compras.set(groupDocumentsByPurchase(next).map((c) => ({ ...c, mostrarDocumentos: false })));
    } else {
      // Set subsiguiente (refresh): preservar el estado de colapso por paymentId.
      const prevState = new Map(this.compras().map((c) => [c.paymentId, c.mostrarDocumentos]));
      const nextCompras = groupDocumentsByPurchase(next);
      const newKeys = new Set(nextCompras.map((c) => c.paymentId));
      this.compras.set(
        nextCompras.map((c) => ({
          ...c,
          mostrarDocumentos: prevState.get(c.paymentId) ?? false,
        })),
      );
      // Mantener referencia a prevKeys para futuras extensiones (e.g. detectar altas/bajas).
      void prevKeys;
      void newKeys;
    }
  }
  get documents(): DocumentoComprado[] {
    return this._documents();
  }

  private readonly _downloadStates = signal<ReadonlyMap<number, DownloadState>>(new Map());
  @Input({ required: true })
  set downloadStates(value: ReadonlyMap<number, DownloadState>) {
    this._downloadStates.set(value || new Map());
  }
  /** Signal expuesto para el template: `downloadStates().get(id)`. */
  readonly downloadStatesSignal = this._downloadStates.asReadonly();

  @Output() readonly download = new EventEmitter<DocumentoComprado>();

  readonly compras = signal<CompraAgrupada[]>([]);

  readonly totalDocumentos = computed(() =>
    this.compras().reduce((total, compra) => total + compra.documentos.length, 0),
  );

  toggleDocumentos(compra: CompraAgrupada): void {
    this.compras.set(
      this.compras().map((c) =>
        c.paymentId === compra.paymentId
          ? { ...c, mostrarDocumentos: !c.mostrarDocumentos }
          : c,
      ),
    );
  }

  onDownloadClick(doc: DocumentoComprado): void {
    this.download.emit(doc);
  }

  formatDate(date: string): string {
    return formatDate(date, this.locale);
  }

  getFormatIcon(format: string): string {
    return getFormatIcon(format);
  }
}