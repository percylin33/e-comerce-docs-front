import { Component, HostListener, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SharedService } from '../../../@auth/components/shared.service';
import { NotificationBellComponent } from '../../../shared/notification-bell/notification-bell.component';

@Component({
    selector: 'ngx-promotor-header-actions',
    templateUrl: './promotor-header-actions.component.html',
    styleUrls: ['./promotor-header-actions.component.scss'],
    standalone: true,
    imports: [NotificationBellComponent, RouterLink]
})
export class PromotorHeaderActionsComponent {
  private router = inject(Router);
  private sharedService = inject(SharedService);

  @Input() userInitials = 'PV';
  @Input() userName = 'Usuario';

  showProfileMenu = false;

  toggleProfileMenu(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.showProfileMenu = !this.showProfileMenu;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // close if click outside
    const target = event.target as HTMLElement;
    const el = document.querySelector('.promotor-profile-dropdown');
    if (!el) { return; }
    if (!el.contains(target)) {
      this.showProfileMenu = false;
    }
  }

  onLogoutClick(event?: MouseEvent) {
    if (event) { event.preventDefault(); }
    
    // Limpiar los mismos datos que limpia el sidebar
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_app_token');
    localStorage.removeItem('auth_app_refresh_token');
    
    // Actualizar el SharedService para que el header se actualice
    this.sharedService.setUser(null);
    this.sharedService.setAuthenticated(false);
    
    // Cerrar el menú
    this.showProfileMenu = false;
    
    // Redirigir a login
    this.router.navigate(['/site/home']);
  }
}
