import { Component, HostListener, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from '../../../@auth/components/shared.service';

@Component({
    selector: 'ngx-admin-header-actions',
    templateUrl: './admin-header-actions.component.html',
    styleUrls: ['./admin-header-actions.component.scss'],
    standalone: true
})
export class AdminHeaderActionsComponent implements OnInit {
  @Input() userInitials = 'AD';
  @Input() userName = 'Admin';
  userImage: string | null = null;

  profileOpen = false;
  
  constructor(
    private router: Router,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.loadUserFromLocalStorage();
  }

  loadUserFromLocalStorage(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // currentUser has: name, lastname, picture
        if (user.name && user.lastname) {
          this.userName = `${user.name} ${user.lastname}`;
          this.userInitials = this.getInitials(user.name, user.lastname);
        }
        if (user.picture) {
          this.userImage = user.picture;
        }
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
  }

  getInitials(firstname: string, lastname: string): string {
    const first = firstname?.charAt(0)?.toUpperCase() || '';
    const last = lastname?.charAt(0)?.toUpperCase() || '';
    return first + last || 'AD';
  }

  toggleProfile(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.profileOpen = !this.profileOpen;
  }

  closeProfile(): void {
    this.profileOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeProfile();
  }

  onLogoutClick(event?: MouseEvent): void {
    if (event) { 
      event.preventDefault(); 
      event.stopPropagation();
    }
    
    // Limpiar datos de sesión
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_app_token');
    localStorage.removeItem('auth_app_refresh_token');
    
    // Actualizar SharedService
    this.sharedService.setUser(null);
    this.sharedService.setAuthenticated(false);
    
    // Cerrar el menú
    this.closeProfile();
    
    // Redirigir a home
    this.router.navigate(['/site/home']);
  }
}
