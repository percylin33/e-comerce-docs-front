/**
 * Modelo compartido entre el shell `DocumentosComponent` y sus dos vistas hijas
 * (`DocumentosGridViewComponent`, `DocumentosListLegacyComponent`).
 *
 * Refleja el contrato del backend `DocumentoCompradoDto` enriquecido con
 * categoryId / categoryCode / categoryName (necesarios para filtrar por
 * categoría en el sidebar) y `paymentId` (necesario para reagrupar en la
 * vista legacy por fecha de compra).
 */
export interface DocumentoComprado {
  id: number;
  paymentId?: number;
  title: string;
  description: string;
  price: number;
  fileUrlPublic: string;
  fechaCompra: string;
  format: string;
  nivel?: string;
  materia?: string;
  grado?: string;
  categoryId?: number;
  categoryCode?: string;
  categoryName?: string;
  descargable: boolean;
  mensajeDescarga?: string;
  imagenUrlPublic?: string;
  imagenThumbUrlPublic?: string;
  esKitPlanificacion?: boolean;
  kitEstado?: string;
}

export type ViewMode = 'grid' | 'legacy';

export type DownloadState = 'preparing' | 'downloading';

/**
 * Compra reagrupada a partir de la lista plana de `DocumentoComprado[]`.
 * Es el modelo que consume la vista legacy para renderizar el header de
 * cada compra con fecha + monto total + documentos.
 */
export interface CompraAgrupada {
  paymentId: number;
  fechaCompra: string;
  montoTotal: number;
  documentos: DocumentoComprado[];
  mostrarDocumentos: boolean;
}

/** Entrada del sidebar de categorías en la vista grid. */
export interface SidebarCategoryItem {
  code: string;
  name: string;
  icon: string;
  categoryId: number | null;
  isSyntheticKits?: boolean;
}

/** Constantes reusables entre vistas. */
export const VIEW_MODE_STORAGE_KEY = 'cuenta.documentos.view';

/** 7 días en milisegundos: umbral para marcar un documento como "NUEVO". */
export const NEW_BADGE_DAYS = 7;
export const NEW_BADGE_WINDOW_MS = NEW_BADGE_DAYS * 24 * 60 * 60 * 1000;