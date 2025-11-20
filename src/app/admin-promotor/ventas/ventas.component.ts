import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../@auth/components/shared.service';
import { VentasService } from '../../@core/services/ventas.service';
import { VentaDetallada } from '../../@core/backend/api/ventas.api';

@Component({
  selector: 'ngx-ventas',
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.scss']
})
export class VentasComponent implements OnInit {
  // Usuario
  currentUser: any;
  userName = '';
  userInitials = '';
  
  // Ventas
  ventas: VentaDetallada[] = [];
  ventasFiltradas: VentaDetallada[] = [];
  loading = true;
  
  // Resumen
  totalVentas = 0;
  totalComisiones = 0;
  totalRecaudado = 0;
  
  // Filtros
  filtros = {
    desde: '',
    hasta: '',
    estado: 'TODAS',
    busqueda: ''
  };

  // Paginación
  page = 1;
  itemsPerPage = 10;
  
  // Estados disponibles
  estados = [
    { value: 'TODAS', label: 'Todas' },
    { value: 'COMPLETED', label: 'Completadas' },
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'REFUNDED', label: 'Reembolsadas' }
  ];

  constructor(
    private sharedService: SharedService,
    private ventasService: VentasService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.sharedService.getCurrentUser();
    if (this.currentUser) {
      this.userName = `${this.currentUser.name || ''} ${this.currentUser.lastname || ''}`.trim();
      this.userInitials = this.getInitials(this.userName);
      this.loadVentas();
    }
  }
  
  private getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  
  loadVentas(): void {
    this.loading = true;
    const promotorId = String(this.currentUser.id);
    
    this.ventasService.getResumen(promotorId, this.filtros).subscribe({
      next: (response) => {
        this.ventas = response.ventas || [];
        this.totalVentas = response.totalVentas || 0;
        this.totalComisiones = response.totalComisiones || 0;
        this.totalRecaudado = response.totalRecaudado || 0;
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar ventas:', err);
        this.loading = false;
      }
    });
  }
  
  aplicarFiltros(): void {
    let resultado = [...this.ventas];
    
    // Filtro de búsqueda
    if (this.filtros.busqueda) {
      const busqueda = this.filtros.busqueda.toLowerCase();
      resultado = resultado.filter(v => 
        v.documentName?.toLowerCase().includes(busqueda) ||
        v.customerName?.toLowerCase().includes(busqueda) ||
        v.customerEmail?.toLowerCase().includes(busqueda) ||
        v.cuponCode?.toLowerCase().includes(busqueda)
      );
    }
    
    this.ventasFiltradas = resultado;
  }
  
  onFiltroChange(): void {
    this.loadVentas();
  }
  
  onBusquedaChange(): void {
    this.aplicarFiltros();
  }
  
  limpiarFiltros(): void {
    this.filtros = {
      desde: '',
      hasta: '',
      estado: 'TODAS',
      busqueda: ''
    };
    this.loadVentas();
  }
  
  get ventasPaginadas(): VentaDetallada[] {
    const inicio = (this.page - 1) * this.itemsPerPage;
    const fin = inicio + this.itemsPerPage;
    return this.ventasFiltradas.slice(inicio, fin);
  }
  
  get totalPaginas(): number {
    return Math.ceil(this.ventasFiltradas.length / this.itemsPerPage);
  }
  
  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.page = nuevaPagina;
    }
  }
  
  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'status-completed';
      case 'PENDING': return 'status-pending';
      case 'REFUNDED': return 'status-refunded';
      default: return 'status-default';
    }
  }
  
  getStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'Completada';
      case 'PENDING': return 'Pendiente';
      case 'REFUNDED': return 'Reembolsada';
      default: return status;
    }
  }
}
