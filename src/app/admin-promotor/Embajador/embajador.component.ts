import { Component, OnInit, HostListener } from '@angular/core';
import { SharedService } from '../../@auth/components/shared.service';
import { PromotorDashboardService } from '../../@core/services/promotor-dashboard.service';
import { ReportsService } from '../../@core/services/reports.service';
import { PromotorHeaderActionsComponent } from '../../@theme/components/promotor-header-actions/promotor-header-actions.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { RouterLink } from '@angular/router';
import { SimpleFooterComponent } from '../../@theme/components/simple-footer/simple-footer.component';
import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'ngx-embajador',
    templateUrl: './embajador.component.html',
    styleUrls: ['./embajador.component.scss'],
    standalone: true,
    imports: [PromotorHeaderActionsComponent, SkeletonLoaderComponent, RouterLink, SimpleFooterComponent, DecimalPipe]
})
export class EmbajadorComponent implements OnInit {
  couponCode = '';
  copied = false;
  showProfileMenu = false;
  loading = true;
  
  // Estadísticas
  comisionPorVenta = 10;
  totalRecaudado = 0;
  codigosActivos = 0;
  beneficios = 3;
  
  // Info del cupón
  descuentoCupon = 0;
  comisionCupon = 0;
  ventasCupon = 0;
  
  // Datos para gráfico
  salesChartData: Array<{ month: string; salesCount: number }> = [];
  
  // Usuario
  currentUser: any;
  userName = '';
  userInitials = '';
  
  constructor(
    private sharedService: SharedService,
    private dashboardService: PromotorDashboardService,
    private reportsService: ReportsService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.sharedService.getCurrentUser();
    
    if (this.currentUser) {
      // Los campos que llegan son 'name' y 'lastname', no 'nombres' y 'apellidos'
      this.userName = `${this.currentUser.name || ''} ${this.currentUser.lastname || ''}`.trim();
    
      
      this.userInitials = this.getInitials(this.userName);
      this.loadData();
    }
  }
  
  private getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  
  private loadData(): void {
    this.loading = true;
    const userId = this.currentUser.id;
    
    // Usar el nuevo servicio de dashboard agregado (una sola llamada HTTP)
    this.dashboardService.getDashboardData(userId).subscribe({
      next: (response) => {
        
        // Datos del cupón
        if (response && response.cupon) {
          this.couponCode = response.cupon.codigo || '';
          this.descuentoCupon = response.cupon.descuento || 0;
          this.comisionCupon = response.cupon.abono || 0;
          this.codigosActivos = this.couponCode ? 1 : 0;
        
        } else {
          console.warn('No se encontró información del cupón');
        }
        
        // Estadísticas
        if (response && response.estadisticas) {
          this.totalRecaudado = response.estadisticas.totalRecaudado || 0;
          this.ventasCupon = response.estadisticas.ventas || 0;
          
          // Datos para gráfico de ventas
          if (response.estadisticas.dataPayment && response.estadisticas.dataPayment.length > 0) {
            this.salesChartData = response.estadisticas.dataPayment;
            
          } else {
            console.warn('No hay datos de ventas por mes disponibles');
          }
        } else {
          console.warn('No se encontraron estadísticas');
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar dashboard:', err);
        console.error('Detalles del error:', JSON.stringify(err, null, 2));
        this.loading = false;
      }
    });
  }

  async copyCoupon() {
    try {
      if (navigator && 'clipboard' in navigator) {
        await navigator.clipboard.writeText(this.couponCode);
      } else {
        const ta = document.createElement('textarea');
        ta.value = this.couponCode;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    } catch (err) {
      // ignore copy errors silently; we could add a fallback UI
      // eslint-disable-next-line no-console
      console.error('Copy failed', err);
    }
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target || !target.closest) { return; }
    if (!target.closest('.profile-dropdown')) {
      this.showProfileMenu = false;
    }
  }

  exportPDF() {
    if (!this.currentUser || !this.currentUser.id) {
      console.error('Usuario no autenticado');
      return;
    }

    
    // Get last 3 months by default
    const hasta = new Date();
    const desde = new Date();
    desde.setMonth(desde.getMonth() - 3);

    const desdeStr = desde.toISOString().split('T')[0];
    const hastaStr = hasta.toISOString().split('T')[0];


    this.reportsService.getReportData(this.currentUser.id, desdeStr, hastaStr).subscribe({
      next: (reportData) => {
        if (reportData) {
          this.reportsService.printReport(reportData);
        } else {
          console.error('❌ No se recibieron datos del reporte');
        }
      },
      error: (error) => {
        console.error('❌ Error generando reporte:', error);
        console.error('Detalles del error:', JSON.stringify(error, null, 2));
      }
    });
  }
}
