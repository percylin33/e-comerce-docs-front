import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { 
  SubscriptionTypesData, 
  SubscriptionType,
  SubscriptionTypeDto,
  NivelEducativo 
} from '../../@core/data/subscription-types';
import { MembresiaFormDialogComponent } from './membresia-form-dialog/membresia-form-dialog.component';
import { MateriasManagerDialogComponent } from './materias-manager-dialog/materias-manager-dialog.component';

@Component({
  selector: 'ngx-membresias-admin',
  templateUrl: './membresias-admin.component.html',
  styleUrls: ['./membresias-admin.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class MembresiasAdminComponent implements OnInit {

  membresias: SubscriptionType[] = [];
  isLoading = false;
  error: string | null = null;
  expandedMembresiaId: number | null = null;
  // Guardar último toggle para evitar toggles dobles accidentales
  private lastToggleAt: number = 0;
  private lastToggledId: number | null = null;

  // Filtros
  filtroNivel: NivelEducativo | 'TODOS' = 'TODOS';
  filtroActivo: 'todos' | 'activos' | 'inactivos' = 'todos';

  displayedColumns: string[] = [
    'expand',
    'posicion',
    'nombre',
    'nivel',
    'precio',
    'descuento',
    'badges',
    'especial',
    'activo',
    'acciones'
  ];

  constructor(
    private subscriptionService: SubscriptionTypesData,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadMembresias();
  }

  loadMembresias(): void {
    this.isLoading = true;
    this.error = null;

    this.subscriptionService.getAll().subscribe({
      next: (data) => {
        this.membresias = this.sortByPosicion(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Error cargando membresías:', err);
        this.error = 'Error al cargar las membresías';
        this.isLoading = false;
      }
    });
  }

  sortByPosicion(data: SubscriptionType[]): SubscriptionType[] {
    return [...data].sort((a, b) => a.posicion - b.posicion);
  }

  getFilteredMembresias(): SubscriptionType[] {
    let filtered = [...this.membresias];

    // Filtrar por nivel
    if (this.filtroNivel !== 'TODOS') {
      filtered = filtered.filter(m => m.nivel === this.filtroNivel);
    }

    // Filtrar por estado activo
    if (this.filtroActivo === 'activos') {
      filtered = filtered.filter(m => m.activo === true);
    } else if (this.filtroActivo === 'inactivos') {
      filtered = filtered.filter(m => m.activo === false);
    }

    return filtered;
  }

  onToggleActivo(membresia: SubscriptionType): void {
    if (!confirm(`¿Seguro que deseas ${membresia.activo ? 'desactivar' : 'activar'} esta membresía?`)) {
      return;
    }

    this.subscriptionService.toggleActivo(membresia.id).subscribe({
      next: () => {
        membresia.activo = !membresia.activo;
      },
      error: (err) => {
        console.error('❌ Error al cambiar estado:', err);
        alert('Error al cambiar el estado de la membresía');
      }
    });
  }

  onEdit(membresia: SubscriptionType): void {
    const dialogRef = this.dialog.open(MembresiaFormDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { membresia, isEdit: true },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: SubscriptionTypeDto) => {
      console.log('📨 Resultado del diálogo de edición:', result);
      if (result) {
        this.isLoading = true;
        this.subscriptionService.update(membresia.id, result).subscribe({
          next: (updated) => {
            // Actualizar en la lista
            const index = this.membresias.findIndex(m => m.id === membresia.id);
            if (index !== -1) {
              this.membresias[index] = updated;
              this.membresias = this.sortByPosicion(this.membresias);
            }
            this.isLoading = false;
          },
          error: (err) => {
            console.error('❌ Error al actualizar:', err);
            alert('Error al actualizar la membresía');
            this.isLoading = false;
          }
        });
      }
    });
  }

  onDelete(membresia: SubscriptionType): void {
    if (!confirm(`¿Estás seguro de eliminar "${membresia.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.subscriptionService.delete(membresia.id).subscribe({
      next: () => {
        this.membresias = this.membresias.filter(m => m.id !== membresia.id);
        
      },
      error: (err) => {
        console.error('❌ Error al eliminar:', err);
        alert('Error al eliminar la membresía');
      }
    });
  }

  onChangePosicion(membresia: SubscriptionType, direccion: 'up' | 'down'): void {
    const currentIndex = this.membresias.findIndex(m => m.id === membresia.id);
    if (currentIndex === -1) return;

    const newIndex = direccion === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= this.membresias.length) return;

    // Intercambiar posiciones
    const targetMembresia = this.membresias[newIndex];
    const tempPosicion = membresia.posicion;
    
    // Actualizar en backend
    this.subscriptionService.updatePosicion(membresia.id, targetMembresia.posicion).subscribe({
      next: () => {
        this.subscriptionService.updatePosicion(targetMembresia.id, tempPosicion).subscribe({
          next: () => {
            membresia.posicion = targetMembresia.posicion;
            targetMembresia.posicion = tempPosicion;
            this.membresias = this.sortByPosicion(this.membresias);
            
          }
        });
      },
      error: (err) => {
        console.error('❌ Error al actualizar posición:', err);
        alert('Error al reordenar');
      }
    });
  }

  onCreate(): void {
    const dialogRef = this.dialog.open(MembresiaFormDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { isEdit: false },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: SubscriptionTypeDto) => {
      console.log('📨 Resultado del diálogo de creación:', result);
      if (result) {
        this.isLoading = true;
        this.subscriptionService.create(result).subscribe({
          next: (created) => {
            this.membresias.push(created);
            this.membresias = this.sortByPosicion(this.membresias);
            this.isLoading = false;
          },
          error: (err) => {
            console.error('❌ Error al crear:', err);
            alert('Error al crear la membresía');
            this.isLoading = false;
          }
        });
      }
    });
  }

  onPreview(membresia: SubscriptionType): void {
    // Abrir vista de membresía en nueva pestaña
    window.open(`/site/membresia-detail/${membresia.id}`, '_blank');
  }

  getBadgesText(membresia: SubscriptionType): string {
    const badges: string[] = [];
    if (membresia.esRecomendada) badges.push('Recomendada');
    if (membresia.esPopular) badges.push('Popular');
    return badges.join(', ') || '-';
  }

  getNivelBadgeClass(nivel: NivelEducativo): string {
    switch (nivel) {
      case 'INICIAL': return 'badge-inicial';
      case 'PRIMARIA': return 'badge-primaria';
      case 'SECUNDARIA': return 'badge-secundaria';
      default: return 'badge-todos';
    }
  }

  toggleMateriasExpansion(membresiaId: number): void {
    const now = Date.now();
    // Ignorar toggles duplicados muy cercanos para el mismo id (evita doble-click accidental)
    const delta = now - this.lastToggleAt;
    if (this.lastToggledId === membresiaId && delta < 300) {
      
      this.lastToggleAt = now;
      return;
    }

    // Debug: mostrar qué id se está alternando
    
    this.expandedMembresiaId = this.expandedMembresiaId === membresiaId ? null : membresiaId;
   

    this.lastToggledId = membresiaId;
    this.lastToggleAt = now;
  }

  isExpanded(membresiaId: number): boolean {
    const expanded = this.expandedMembresiaId === membresiaId;
    
    return expanded;
  }

  shouldRenderMaterias(membresia: SubscriptionType): boolean {
    const result = this.isExpanded(membresia.id);
    
    return result;
  }

  getSubscriptionNameById(id: number): string {
    const m = this.membresias.find(x => x.id === id);
    return m ? m.nombre : '';
  }

  openMateriasModal(membresia: SubscriptionType): void {
    this.dialog.open(MateriasManagerDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      height: '80vh',
      data: { membresia }
    });
  }

  // Predicate used by mat-table to decide when to render the detail row
  isExpansionDetailRow = (index: number, row: SubscriptionType) => {
    const match = row && row.id === this.expandedMembresiaId;
   
    return match;
  }
}
