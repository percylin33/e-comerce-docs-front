import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { MENU_ITEMS_PROMOTOR } from './promotor-menu';
import { NbLayoutModule } from "@nebular/theme";
import { PromotorSidebarComponent } from "../@theme/components/promotor-sidebar/promotor-sidebar.component";

@Component({
    selector: 'ngx-admin-promotor',
    styleUrls: ['admin-promotor.component.scss'],
    template: `
    <nb-layout windowMode>
      <nb-layout-column class="no-padding-column">
        @if (isVisible) {
          <div class="admin-promotor-page">
            <!-- Sidebar para admin-promotor -->
            <ngx-promotor-sidebar
              [menu]="menu"
              [class.open]="sidebarOpen">
            </ngx-promotor-sidebar>
            <!-- backdrop shown when sidebar is open on small screens -->
            @if (sidebarOpen) {
              <div class="admin-backdrop" (click)="sidebarOpen = false"></div>
            }
            <div class="admin-content">
              <!-- small header with hamburger for mobile -->
              <div class="admin-mobile-header">
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
export class AdminPromotorComponent implements OnInit, OnDestroy {
  menu = MENU_ITEMS_PROMOTOR
  sidebarOpen = false;
  isVisible = false;
  private destroy$ = new Subject<void>();

  constructor(private router: Router) {
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
