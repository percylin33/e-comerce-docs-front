import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../@auth/components/shared.service';
import { CuponService } from '../../@core/backend/services/cupon.service';
import { PromotorHeaderActionsComponent } from '../../@theme/components/promotor-header-actions/promotor-header-actions.component';
import { SimpleFooterComponent } from '../../@theme/components/simple-footer/simple-footer.component';

@Component({
    selector: 'ngx-cupones',
    templateUrl: './cupones.component.html',
    styleUrls: ['./cupones.component.scss'],
    standalone: true,
    imports: [PromotorHeaderActionsComponent, SimpleFooterComponent]
})
export class CuponesComponent implements OnInit {
  // Usuario
  currentUser: any;
  userName = '';
  userInitials = '';
  
  // Datos del cupón
  couponCode = '';
  discount = 0;
  commission = 0;
  hasCoupon = false;
  loading = true;
  
  // Estadísticas
  totalSales = 0;
  totalCommissions = 0;
  totalRecaudado = 0;
  totalPorCobrar = 0;

  constructor(
    private sharedService: SharedService,
    private cuponService: CuponService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.sharedService.getCurrentUser();
    if (this.currentUser) {
      this.userName = `${this.currentUser.name || ''} ${this.currentUser.lastname || ''}`.trim();
      this.userInitials = this.getInitials(this.userName);
      this.loadCoupon();
      this.loadStatistics();
    }
  }
  
  private getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  
  private loadCoupon(): void {
    this.loading = true;
    const userId = this.currentUser.id;
    
    this.cuponService.getCupont(userId).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.hasCoupon = true;
          this.couponCode = response.data.codigo || '';
          this.discount = response.data.descuento || 0;
          this.commission = response.data.abono || 0;
        } else {
          this.hasCoupon = false;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar cupón:', err);
        this.hasCoupon = false;
        this.loading = false;
      }
    });
  }

  private loadStatistics(): void {
    const promotorId = String(this.currentUser.id);
    
    this.cuponService.getGraficos(promotorId).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.totalRecaudado = response.data.totalRecaudado || 0;
          this.totalPorCobrar = response.data.totalPorCobrar || 0;
          this.totalSales = response.data.ventas || 0;
          this.totalCommissions = response.data.totalPorCobrar || 0; // totalPorCobrar es lo que le toca al promotor
        }
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);
      }
    });
  }
  
  onCreateCoupon(): void {
    if (!this.currentUser) {
      alert('Usuario no identificado');
      return;
    }
    
    if (confirm('¿Deseas crear un nuevo cupón promocional?')) {
      this.loading = true;
      
      this.cuponService.postGenerar(this.currentUser.id).subscribe({
        next: (response) => {
          if (response.result && response.data) {
            alert('Cupón creado exitosamente');
            this.loadCoupon();
          } else {
            alert('Error al crear el cupón');
            this.loading = false;
          }
        },
        error: (err) => {
          console.error('Error al crear cupón:', err);
          alert('Error al crear el cupón. Por favor intenta nuevamente.');
          this.loading = false;
        }
      });
    }
  }

  onCopy(): void {
    navigator.clipboard?.writeText(this.couponCode).then(() => {
      alert('Código copiado al portapapeles');
    }).catch(err => {
      console.error('Error al copiar:', err);
    });
  }

}
