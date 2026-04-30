import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationState } from '../../../site/categorias/models/pagination-state.model';

@Component({
  selector: 'ngx-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  private cdr = inject(ChangeDetectorRef);

  /** Estado de paginación (puede venir del servicio o de estado local) */
  @Input() pagination: PaginationState | null = null;

  /** Alineación de la paginación: 'start' | 'center' | 'end' */
  @Input() align: 'start' | 'center' | 'end' = 'center';

  /** Mostrar texto informativo "Página X de Y | Total: Z items" */
  @Input() showInfo: boolean = true;

  /** Clases CSS adicionales para el contenedor */
  @Input() containerClass: string = '';

  /** Evento emitido cuando el usuario cambia de página */
  @Output() pageChange = new EventEmitter<number>();

  /** Calcula el rango de páginas a mostrar (máximo 5 páginas centradas) */
  getPageRange(): number[] {
    if (!this.pagination) return [];

    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.currentPage;
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    const range: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }

    return range;
  }

  /** Navega a la página especificada */
  goToPage(page: number): void {
    if (this.pagination && page >= 1 && page <= this.pagination.totalPages && page !== this.pagination.currentPage) {
      this.pageChange.emit(page);
    }
  }

  /** Navega a la página anterior */
  previousPage(): void {
    if (this.pagination && this.pagination.hasPreviousPage) {
      this.goToPage(this.pagination.currentPage - 1);
    }
  }

  /** Navega a la página siguiente */
  nextPage(): void {
    if (this.pagination && this.pagination.hasNextPage) {
      this.goToPage(this.pagination.currentPage + 1);
    }
  }

  /** Navega a la primera página */
  goToFirstPage(): void {
    this.goToPage(1);
  }

  /** Navega a la última página */
  goToLastPage(): void {
    if (this.pagination) {
      this.goToPage(this.pagination.totalPages);
    }
  }
}
