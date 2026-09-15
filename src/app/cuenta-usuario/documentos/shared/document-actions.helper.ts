import { DocumentoComprado, CompraAgrupada, NEW_BADGE_WINDOW_MS } from './documento-comprado.model';

/**
 * Helpers compartidos entre el shell y las dos vistas hijas.
 * Mantienen el mismo formato de fechas, iconos por tipo de archivo,
 * marcado de documentos nuevos y agrupación por compra.
 */

const FORMAT_ICON_MAP: Record<string, string> = {
  PDF: 'file-text-outline',
  ZIP: 'archive-outline',
  DOCX: 'file-outline',
  DOC: 'file-outline',
};

/** Devuelve el icono de Nebular según el formato del documento. */
export function getFormatIcon(format: string): string {
  return FORMAT_ICON_MAP[format?.toUpperCase()] ?? 'download-outline';
}

/** Formato largo localizado: '15 de enero de 2026, 14:30'. */
export function formatDate(date: string, locale: string): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Marca "NUEVO" si la compra es de los últimos `NEW_BADGE_WINDOW_MS` ms. */
export function isNewDocument(doc: Pick<DocumentoComprado, 'fechaCompra'>, now: number = Date.now()): boolean {
  if (!doc?.fechaCompra) return false;
  const ts = new Date(doc.fechaCompra).getTime();
  if (Number.isNaN(ts)) return false;
  return now - ts < NEW_BADGE_WINDOW_MS;
}

/**
 * Normaliza las URLs de imagen de un documento.
 * El backend puede devolver varias URLs separadas por `|`; dejamos solo la
 * primera para evitar que `<img src="a|b|c">` falle.
 */
export function normalizeImageUrls<T extends { imagenUrlPublic?: string | null; imagenThumbUrlPublic?: string | null }>(doc: T): T {
  if (doc.imagenUrlPublic && doc.imagenUrlPublic.includes('|')) {
    doc.imagenUrlPublic = doc.imagenUrlPublic.split('|')[0] || doc.imagenUrlPublic;
  }
  if (doc.imagenThumbUrlPublic && doc.imagenThumbUrlPublic.includes('|')) {
    doc.imagenThumbUrlPublic = doc.imagenThumbUrlPublic.split('|')[0] || doc.imagenThumbUrlPublic;
  }
  return doc;
}

/**
 * Agrupa una lista plana de documentos por `paymentId` (con fallback por
 * día cuando el backend aún no expone `paymentId` en documentos sueltos).
 * Cada grupo preserva orden de aparición.
 */
export function groupDocumentsByPurchase(documents: DocumentoComprado[]): CompraAgrupada[] {
  const byPayment = new Map<number, CompraAgrupada>();

  for (const doc of documents) {
    const key = doc.paymentId ?? dayKey(doc.fechaCompra);
    let group = byPayment.get(key);
    if (!group) {
      group = {
        paymentId: key,
        fechaCompra: doc.fechaCompra,
        montoTotal: 0,
        documentos: [],
        mostrarDocumentos: false,
      };
      byPayment.set(key, group);
    }
    group.documentos.push(doc);
    group.montoTotal += doc.price || 0;
  }

  // Más recientes primero.
  return Array.from(byPayment.values()).sort(
    (a, b) => new Date(b.fechaCompra).getTime() - new Date(a.fechaCompra).getTime(),
  );
}

/** Día truncado a yyyy-mm-dd en horario local. */
function dayKey(fechaCompra: string): number {
  const d = new Date(fechaCompra);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}