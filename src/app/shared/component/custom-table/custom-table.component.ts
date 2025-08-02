import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'ngx-custom-table',
  templateUrl: './custom-table.component.html',
  styleUrls: ['./custom-table.component.scss']
})
export class CustomTableComponent implements OnInit, OnChanges {
  @Input() structTable: any[] = [];
  @Input() content: any[] = [];
  @Input() padre: string;
  @Output() checkboxChange = new EventEmitter<{ id: number; checked: boolean }>();
  @Output() editClick = new EventEmitter<number>();

  dataSource: MatTableDataSource<any>;
  displayedColumns: string[];
  selectedRows: Set<number> = new Set();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor() { }

  ngOnInit(): void {
    if (this.padre === 'users-management') {
      this.displayedColumns = [...this.structTable.map(col => col.column)];
    } else {
      this.displayedColumns = [...this.structTable.map(col => col.column), 'actions'];
    }

    this.dataSource = new MatTableDataSource(this.content);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.content && this.dataSource) {
      this.dataSource.data = this.content;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  // =============================================================================
  // MÉTODOS DE UX/UI MEJORADOS
  // =============================================================================

  /**
   * Verifica si una fila está seleccionada
   */
  isRowSelected(id: number): boolean {
    return this.selectedRows.has(id);
  }

  /**
   * Maneja el cambio de checkbox con mejor UX
   */
  onCheckboxChange(id: number, checked: boolean): void {
    if (checked) {
      this.selectedRows.add(id);
    } else {
      this.selectedRows.delete(id);
    }
    this.checkboxChange.emit({ id, checked });
  }

  /**
   * Maneja el click de editar con feedback visual
   */
  onEditClick(id: number): void {
    // Agregar clase de animación temporalmente
    const button = document.querySelector(`[title*="Editar"]`) as HTMLElement;
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 150);
    }
    this.editClick.emit(id);
  }

  /**
   * Obtiene el título principal para las cards móviles
   */
  getMainTitle(row: any): string {
    return row.name || row.title || row.documento || row.nombre || `Item ${row.id}`;
  }

  /**
   * Obtiene el subtítulo para las cards móviles
   */
  getSubtitle(row: any): string {
    return row.email || row.description || row.categoria || row.tipo || row.format || '';
  }

  /**
   * Determina si un campo debe mostrarse en la vista móvil
   */
  shouldShowField(columnName: string): boolean {
    const excludedFields = ['name', 'email', 'id', 'title', 'documento', 'nombre'];
    return !excludedFields.includes(columnName);
  }

  /**
   * Verifica si un campo es especial (requiere formato específico)
   */
  isSpecialField(columnName: string): boolean {
    const specialFields = ['paymentDate', 'roles', 'amount', 'status'];
    return specialFields.includes(columnName);
  }

  /**
   * Obtiene la clase CSS para diferentes tipos de roles
   */
  getRoleClass(roleName: string): string {
    const roleClasses = {
      'SUPADMIN': 'role-admin',
      'ADMIN': 'role-admin',
      'PROMOTOR': 'role-promotor',
      'EMBAJADOR': 'role-promotor',
      'USER': 'role-user',
      'PREMIUM': 'role-premium'
    };
    return roleClasses[roleName] || 'role-default';
  }

  /**
   * Obtiene la clase CSS para diferentes estados
   */
  getStatusClass(status: string): string {
    if (!status) return 'status-default';
    
    const statusLower = status.toLowerCase();
    const statusClasses = {
      'active': 'status-success',
      'activo': 'status-success',
      'approved': 'status-success',
      'aprobado': 'status-success',
      'completed': 'status-success',
      'completado': 'status-success',
      'pending': 'status-warning',
      'pendiente': 'status-warning',
      'processing': 'status-warning',
      'procesando': 'status-warning',
      'inactive': 'status-danger',
      'inactivo': 'status-danger',
      'rejected': 'status-danger',
      'rechazado': 'status-danger',
      'cancelled': 'status-danger',
      'cancelado': 'status-danger'
    };
    
    return statusClasses[statusLower] || 'status-default';
  }

  /**
   * TrackBy function para mejorar el rendimiento de las listas
   */
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  // =============================================================================
  // MÉTODOS EXISTENTES MEJORADOS
  // =============================================================================

  isAdminUser(row: any): boolean {
    return row.roles && row.roles.some(role => role.name === 'SUPADMIN');
  }

  getRoleDisplayName(roleName: string): string {
    const roleNames = {
      'PROMOTOR': 'EMBAJADOR',
      'SUPADMIN': 'SUPER ADMIN',
      'ADMIN': 'ADMINISTRADOR',
      'USER': 'USUARIO',
      'PREMIUM': 'PREMIUM'
    };
    return roleNames[roleName] || roleName;
  }

  getFilteredRoles(roles: any[]): any[] {
    if (!roles || roles.length === 0) return [];
    
    // Si solo tiene el rol USER, lo mostramos
    if (roles.length === 1 && roles[0].name === 'USER') {
      return roles;
    }
    
    // Si tiene múltiples roles, filtramos USER
    return roles.filter(role => role.name !== 'USER');
  }

  /**
   * Selecciona/deselecciona todas las filas
   */
  toggleAllRows(): void {
    const allSelected = this.dataSource.data.every(row => this.selectedRows.has(row.id));
    
    if (allSelected) {
      // Deseleccionar todas
      this.selectedRows.clear();
      this.dataSource.data.forEach(row => {
        this.checkboxChange.emit({ id: row.id, checked: false });
      });
    } else {
      // Seleccionar todas
      this.dataSource.data.forEach(row => {
        if (!this.isAdminUser(row)) {
          this.selectedRows.add(row.id);
          this.checkboxChange.emit({ id: row.id, checked: true });
        }
      });
    }
  }

  /**
   * Obtiene el número de filas seleccionadas
   */
  getSelectedCount(): number {
    return this.selectedRows.size;
  }

  /**
   * Limpia todas las selecciones
   */
  clearSelection(): void {
    this.selectedRows.clear();
  }
}
