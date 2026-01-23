/**
 * Modelo de estado de paginación
 * Representa toda la información necesaria para la paginación server-side
 */
export interface PaginationState {
  /** Página actual (1-based) */
  currentPage: number;
  
  /** Número de elementos por página */
  pageSize: number;
  
  /** Total de elementos en el backend */
  totalItems: number;
  
  /** Total de páginas calculadas */
  totalPages: number;
  
  /** Si hay una página siguiente disponible */
  hasNextPage: boolean;
  
  /** Si hay una página anterior disponible */
  hasPreviousPage: boolean;
}

/**
 * Parámetros de paginación para enviar al backend
 */
export interface PaginationParams {
  pagina: number;
  cantElementos: number;
}

/**
 * Información de paginación que viene del backend
 */
export interface BackendPaginationInfo {
  paginaActual?: number;
  cantidadDePaginas?: number;
  cantidadDeDocumentos?: number;
  cantidadElementosPorPagina?: number;
}
