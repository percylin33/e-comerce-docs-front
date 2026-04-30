import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'ngx-pagination-material',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule],
  template: `
    <div class="pagination-material-container">
      @if (totalItems > 0) {
        <mat-paginator
          [length]="totalItems"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex"
          [pageSizeOptions]="pageSizeOptions"
          [showFirstLastButtons]="showFirstLastButtons"
          (page)="onPageChange($event)">
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .pagination-material-container {
      display: flex;
      justify-content: center;
      margin: 1.5rem 0;
      padding: 1rem;
      background: #fafafa;
      border-radius: 8px;

      mat-paginator {
        width: 100%;
        max-width: 600px;
        background: #ffffff;
        padding: 0.5rem;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
    }

    /* Personalización de los botones del paginador Material */
    .mat-mdc-paginator {
      background: transparent !important;

      .mat-mdc-paginator-page-size {
        margin-right: 1rem;
        align-items: center;
      }

      .mat-mdc-paginator-range-actions {
        align-items: center;
        gap: 1rem;
      }

      .mat-mdc-paginator-navigation-previous,
      .mat-mdc-paginator-navigation-next {
        border-radius: 6px;

        .mat-mdc-button {
          border-radius: 6px;
          min-width: 32px;
          height: 32px;

          &:hover:not(:disabled) {
            background-color: #007bff15;
          }
        }
      }

      .mat-mdc-paginator-range-label {
        margin: 0 1rem;
        font-weight: 500;
        color: #495057;
      }

      .mat-mdc-select-trigger {
        min-width: 60px;
        border-radius: 6px;
      }
    }
  `]
})
export class PaginationMaterialComponent {
  /** Total de elementos */
  @Input() totalItems: number = 0;

  /** Tamaño de página actual */
  @Input() pageSize: number = 10;

  /** Índice de página actual (base 0) */
  @Input() pageIndex: number = 0;

  /** Opciones de tamaño de página disponibles */
  @Input() pageSizeOptions: number[] = [6, 10, 25, 50];

  /** Mostrar botones de primera y última página */
  @Input() showFirstLastButtons: boolean = true;

  /** Evento emitido cuando cambia la página */
  @Output() pageChange = new EventEmitter<{ pageIndex: number; pageSize: number }>();

  onPageChange(event: any): void {
    this.pageChange.emit(event);
  }
}
