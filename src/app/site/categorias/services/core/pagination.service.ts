import { Injectable, signal, Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import {
  PaginationState,
  PaginationParams,
  BackendPaginationInfo
} from '../../models/pagination-state.model';

/**
 * Servicio centralizado para gestionar la paginación server-side
 * 
 * Responsabilidades:
 * - Mantener el estado de paginación
 * - Proveer métodos de navegación (siguiente, anterior, ir a página)
 * - Calcular rangos de páginas visibles
 * - Sincronizar con respuestas del backend
 * 
 * @example
 * ```typescript
 * constructor(private pagination: PaginationService) {
 *   this.pagination.pagination$.subscribe(state => {
 *     console.log(`Página ${state.currentPage} de ${state.totalPages}`);
 *   });
 * }
 * 
 * // Navegar
 * this.pagination.goToPage(2);
 * this.pagination.nextPage();
 * 
 * // Obtener parámetros para backend
 * const params = this.pagination.getPaginationParams();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  private readonly DEFAULT_PAGE_SIZE = 12; // Documentos por página
  private readonly MAX_VISIBLE_PAGES = 5;

  private readonly _pagination = signal<PaginationState>(this.createInitialState());

  /**
   * Signal del estado de paginación.
   * Emite cada vez que cambia la página o se actualiza el total.
   */
  public readonly pagination: Signal<PaginationState> = this._pagination.asReadonly();

  /**
   * Observable derivado para compatibilidad con consumers RxJS / pipes async.
   */
  public readonly pagination$: Observable<PaginationState> = toObservable(this._pagination);

  constructor() {}

  // ============ MÉTODOS DE NAVEGACIÓN ============

  /**
   * Navega a una página específica
   * Solo navega si la página es válida y diferente de la actual
   * 
   * @param page - Número de página (1-based)
   * @returns true si navegó exitosamente, false si no
   */
  goToPage(page: number): boolean {
    const currentState = this._pagination();
    
    // Validar que la página esté en rango válido
    if (page < 1 || page > currentState.totalPages) {
      return false;
    }
    
    // No navegar si ya estamos en esa página
    if (page === currentState.currentPage) {
      return false;
    }
    
    this.updateState({ currentPage: page });
    return true;
  }

  /**
   * Navega a la página siguiente
   * @returns true si navegó exitosamente, false si ya está en la última página
   */
  nextPage(): boolean {
    const currentState = this._pagination();
    
    if (!currentState.hasNextPage) {
      return false;
    }
    
    return this.goToPage(currentState.currentPage + 1);
  }

  /**
   * Navega a la página anterior
   * @returns true si navegó exitosamente, false si ya está en la primera página
   */
  previousPage(): boolean {
    const currentState = this._pagination();
    
    if (!currentState.hasPreviousPage) {
      return false;
    }
    
    return this.goToPage(currentState.currentPage - 1);
  }

  /**
   * Va a la primera página
   */
  goToFirstPage(): void {
    this.goToPage(1);
  }

  /**
   * Va a la última página
   */
  goToLastPage(): void {
    const currentState = this._pagination();
    this.goToPage(currentState.totalPages);
  }

  // ============ MÉTODOS DE ACTUALIZACIÓN ============

  /**
   * Actualiza el total de elementos desde la respuesta del backend
   * Recalcula automáticamente el total de páginas
   * 
   * @param totalItems - Total de elementos o información de paginación del backend
   */
  setTotalItems(totalItems: number | BackendPaginationInfo): void {
    let total: number;
    
    if (typeof totalItems === 'number') {
      total = totalItems;
    } else {
      // Extraer total de la respuesta del backend
      total = totalItems.cantidadDeDocumentos || 0;
    }
    
    const currentState = this._pagination();
    const totalPages = Math.ceil(total / currentState.pageSize);
    
    // Si la página actual es mayor que el nuevo total de páginas, ir a la última
    const currentPage = currentState.currentPage > totalPages 
      ? Math.max(1, totalPages) 
      : currentState.currentPage;
    
    this.updateState({
      totalItems: total,
      totalPages: totalPages,
      currentPage: currentPage
    });
  }

  /**
   * Reinicia la paginación al estado inicial preservando el pageSize actual.
   * El pageSize lo gestiona applyResponsivePageSize() en el componente;
   * resetear aquí lo perdería y volvería al DEFAULT (12).
   */
  resetPagination(): void {
    const currentPageSize = this._pagination().pageSize;
    this._pagination.set({
      ...this.createInitialState(),
      pageSize: currentPageSize
    });
  }

  /**
   * Establece la página actual sin validar contra totalPages.
   * Útil para restaurar la página desde la URL antes de que el backend responda.
   * setTotalItems() ajustará la página si excede el total real.
   */
  setCurrentPage(page: number): void {
    if (page < 1) return;
    this.updateState({ currentPage: page });
  }

  /**
   * Establece el tamaño de página
   * Resetea a la página 1 automáticamente
   * 
   * @param pageSize - Nuevo tamaño de página
   */
  setPageSize(pageSize: number): void {
    if (pageSize < 1) {
      console.warn('Page size must be at least 1');
      return;
    }
    
    const currentState = this._pagination();
    const totalPages = Math.ceil(currentState.totalItems / pageSize);
    
    this.updateState({
      pageSize: pageSize,
      totalPages: totalPages,
      currentPage: 1 // Resetear a primera página al cambiar tamaño
    });
  }

  // ============ GETTERS ============

  /**
   * Obtiene el estado actual de paginación
   */
  getCurrentState(): PaginationState {
    return this._pagination();
  }

  /**
   * Obtiene la página actual
   */
  getCurrentPage(): number {
    return this._pagination().currentPage;
  }

  /**
   * Obtiene el tamaño de página actual
   */
  getPageSize(): number {
    return this._pagination().pageSize;
  }

  /**
   * Obtiene el total de páginas
   */
  getTotalPages(): number {
    return this._pagination().totalPages;
  }

  /**
   * Obtiene el total de elementos
   */
  getTotalItems(): number {
    return this._pagination().totalItems;
  }

  /**
   * Verifica si se puede ir a la siguiente página
   */
  canGoNext(): boolean {
    return this._pagination().hasNextPage;
  }

  /**
   * Verifica si se puede ir a la página anterior
   */
  canGoPrevious(): boolean {
    return this._pagination().hasPreviousPage;
  }

  /**
   * Calcula el rango de páginas a mostrar en la UI
   * Muestra máximo 5 páginas centradas alrededor de la página actual
   * 
   * @returns Array de números de página a mostrar
   * 
   * @example
   * // Si estás en página 5 de 20:
   * getPageRange() // [3, 4, 5, 6, 7]
   * 
   * // Si estás en página 2 de 20:
   * getPageRange() // [1, 2, 3, 4, 5]
   * 
   * // Si estás en página 19 de 20:
   * getPageRange() // [16, 17, 18, 19, 20]
   */
  getPageRange(): number[] {
    const state = this._pagination();
    const { currentPage, totalPages } = state;
    const maxVisible = this.MAX_VISIBLE_PAGES;
    
    if (totalPages <= maxVisible) {
      // Si hay pocas páginas, mostrar todas
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Calcular rango centrado alrededor de la página actual
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    // Ajustar si estamos cerca del final
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  /**
   * Obtiene los parámetros de paginación para enviar al backend
   * 
   * @returns Objeto con pagina y cantElementos
   */
  getPaginationParams(): PaginationParams {
    const state = this._pagination();
    return {
      pagina: state.currentPage,
      cantElementos: state.pageSize
    };
  }

  /**
   * Calcula el índice del primer elemento en la página actual
   * Útil para mostrar "Mostrando X-Y de Z"
   */
  getStartIndex(): number {
    const state = this._pagination();
    return (state.currentPage - 1) * state.pageSize + 1;
  }

  /**
   * Calcula el índice del último elemento en la página actual
   * Útil para mostrar "Mostrando X-Y de Z"
   */
  getEndIndex(): number {
    const state = this._pagination();
    return Math.min(
      state.currentPage * state.pageSize,
      state.totalItems
    );
  }

  // ============ MÉTODOS PRIVADOS ============

  /**
   * Crea el estado inicial de paginación
   */
  private createInitialState(): PaginationState {
    return {
      currentPage: 1,
      pageSize: this.DEFAULT_PAGE_SIZE,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    };
  }

  /**
   * Actualiza el estado con nuevos valores
   * Recalcula automáticamente hasNextPage y hasPreviousPage
   */
  private updateState(partial: Partial<PaginationState>): void {
    const currentState = this._pagination();
    const newState = { ...currentState, ...partial };
    
    // Recalcular flags de navegación
    newState.hasNextPage = newState.currentPage < newState.totalPages;
    newState.hasPreviousPage = newState.currentPage > 1;
    
    this._pagination.set(newState);
  }
}
