import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { MENU_ITEMS_PROMOTOR } from '../../../admin-promotor/promotor-menu';
import { PromotorProfileService } from '../../../@core/backend/services/promotor-profile.service';
import { PromotorProfile } from '../../../@core/backend/api/promotor-profile.api';
import { SharedService } from '../../../@auth/components/shared.service';
import { NbIconModule } from '@nebular/theme';
import { NgClass } from '@angular/common';

@Component({
    selector: 'ngx-promotor-sidebar',
    templateUrl: './promotor-sidebar.component.html',
    styleUrls: ['./promotor-sidebar.component.scss'],
    standalone: true,
    imports: [RouterLink, NbIconModule, NgClass]
})
export class PromotorSidebarComponent implements OnInit, OnDestroy {
  @Input() menu: any[] = MENU_ITEMS_PROMOTOR;
  // Optional header config so the same sidebar can be reused in admin pages
  @Input() header?: { title?: string; subtitle?: string; logo?: string; userName?: string; userRole?: string; userInitials?: string };
  @Input() hideBottom = false;
  currentUrl = '';
  
  userProfile: PromotorProfile | null = null;
  userInitials = 'US';
  userName = 'Usuario';
  userImage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private profileService: PromotorProfileService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.currentUrl = this.router.url.split('#')[0];
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((e: NavigationEnd) => {
      this.currentUrl = e.url.split('#')[0];
    });
    
    this.loadUserFromLocalStorage();
   // this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  // loadUserProfile(): void {
  //   const userId = this.getUserId();
  //   if (!userId) return;
    
  //   this.profileService.getProfile(userId).subscribe({
  //     next: (response) => {
  //       if (response.result && response.data) {
  //         this.userProfile = response.data;
  //         this.userName = `${response.data.firstname} ${response.data.lastname}`;
  //         this.userInitials = this.getInitials(response.data.firstname, response.data.lastname);
  //         this.userImage = response.data.image || null;
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Error loading user profile:', err);
  //     }
  //   });
  // }

  getUserId(): number | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  getInitials(firstname: string, lastname: string): string {
    const first = firstname?.charAt(0)?.toUpperCase() || '';
    const last = lastname?.charAt(0)?.toUpperCase() || '';
    return first + last || 'US';
  }

  navigate(link?: string): void {
    if (!link) return;
    this.router.navigate([link]);
  }

  isActive(link?: string): boolean {
    if (!link) return false;
    return this.currentUrl === link || this.currentUrl.startsWith(link + '/');
  }

  logout(): void {
    // Limpiar los mismos datos que limpia el header
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_app_token');
    localStorage.removeItem('auth_app_refresh_token');
    
    // Actualizar el SharedService para que el header se actualice
    this.sharedService.setUser(null);
    this.sharedService.setAuthenticated(false);
    
    // Redirigir a login
    this.router.navigate(['/autenticacion/login']);
  }
}
