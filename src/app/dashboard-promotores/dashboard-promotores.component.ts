import { MENU_ITEMS_DASHBOARD_PROMOTOR } from "./menu-dashboard-promotores";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { NbLayoutModule } from "@nebular/theme";
import { PromotorSidebarComponent } from "../@theme/components/promotor-sidebar/promotor-sidebar.component";

@Component({
    selector: 'ngx-dashboard-promotores',
    styleUrls: ['dashboard-promotores.component.scss'],
    template: `
    <nb-layout windowMode>
      <nb-layout-column class="no-padding-column">
        @if (isVisible) {
          <div class="promotor-page">
            <!-- sidebar: on mobile it is toggled via the hamburger button -->
            <!-- pass the menu so the reusable sidebar shows the correct items for this dashboard -->
            <ngx-promotor-sidebar [menu]="menu" [class.open]="sidebarOpen"
              [hideBottom]="true"
              [header]="headerConfig">
            </ngx-promotor-sidebar>
            <!-- backdrop shown when sidebar is open on small screens -->
            @if (sidebarOpen) {
              <div class="promotor-backdrop" (click)="sidebarOpen = false"></div>
            }
            <div class="promotor-content">
              <!-- small header with hamburger for mobile -->
              <div class="promotor-mobile-header">
                <button class="hamburger" aria-label="Abrir menú" (click)="toggleSidebar()">
                  <span></span>
                  <span></span>
                  <span></span>
                </button>
              </div>
              <!-- keep any projected menus out of the main layout; content is rendered here -->
              <router-outlet></router-outlet>
            </div>
          </div>
        }
      </nb-layout-column>
    </nb-layout>
    `,
    standalone: true,
    imports: [
        NbLayoutModule,
        PromotorSidebarComponent,
        RouterOutlet,
    ],
})
export class DashboardPromotoresComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  menu = MENU_ITEMS_DASHBOARD_PROMOTOR;
  sidebarOpen = false;
  isVisible = false;
  headerConfig: any;
  private destroy$ = new Subject<void>();

  constructor() {
    // Cargar datos del usuario desde localStorage
    this.loadUserData();
    
    // close sidebar on route change (useful for mobile)
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => this.sidebarOpen = false);
  }

  ngOnInit(): void {
    // Small delay to ensure clean mounting
    setTimeout(() => {
      this.isVisible = true;
    }, 0);
  }

  loadUserData(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userName = user.name && user.lastname ? `${user.name} ${user.lastname}` : 'Administrador';
        const userInitials = this.getInitials(user.name, user.lastname);
        
        this.headerConfig = {
          title: 'Admin Panel',
          subtitle: 'Carpeta Digital',
          logo: '/assets/images/logo-2.webp',
          userName: userName,
          userRole: 'Gestión del Programa',
          userInitials: userInitials
        };
      } catch (e) {
        console.error('Error parsing user data:', e);
        this.setDefaultHeader();
      }
    } else {
      this.setDefaultHeader();
    }
  }

  setDefaultHeader(): void {
    this.headerConfig = {
      title: 'Admin Panel',
      subtitle: 'Carpeta Digital',
      logo: '/assets/images/logo-2.webp',
      userName: 'Administrador',
      userRole: 'Gestión del Programa',
      userInitials: 'AD'
    };
  }

  getInitials(firstname: string, lastname: string): string {
    const first = firstname?.charAt(0)?.toUpperCase() || '';
    const last = lastname?.charAt(0)?.toUpperCase() || '';
    return first + last || 'AD';
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
  
  ngOnDestroy(): void {
    this.isVisible = false;
    this.sidebarOpen = false;
    this.destroy$.next();
    this.destroy$.complete();
  }
}