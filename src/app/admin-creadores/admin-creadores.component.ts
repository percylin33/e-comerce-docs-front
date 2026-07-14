import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { Router, NavigationEnd, RouterOutlet } from "@angular/router";
import { Subject } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";
import { NbLayoutModule } from "@nebular/theme";
import { MENU_ITEMS_ADMIN_CREADOR } from "./menu-admin-creadores";
import { PromotorSidebarComponent } from "../@theme/components/promotor-sidebar/promotor-sidebar.component";

/**
 * Contenedor del panel admin del modulo Creadores.
 * Reutiliza PromotorSidebarComponent con menu customizado.
 */
@Component({
    selector: "ngx-admin-creadores",
    styleUrls: ["./admin-creadores.component.scss"],
    template: `
    <nb-layout windowMode>
      <nb-layout-column class="no-padding-column">
        @if (isVisible) {
          <div class="admin-page">
            <ngx-promotor-sidebar [menu]="menu" [class.open]="sidebarOpen"
              [hideBottom]="true"
              [header]="headerConfig">
            </ngx-promotor-sidebar>

            @if (sidebarOpen) {
              <div class="admin-backdrop" (click)="sidebarOpen = false"></div>
            }

            <div class="admin-content">
              <div class="admin-mobile-header">
                <button class="hamburger" aria-label="Abrir menu" (click)="toggleSidebar()">
                  <span></span><span></span><span></span>
                </button>
              </div>
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
export class AdminCreadoresComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  menu = MENU_ITEMS_ADMIN_CREADOR;
  sidebarOpen = false;
  isVisible = false;
  headerConfig: any;
  private destroy$ = new Subject<void>();

  constructor() {
    this.loadUserData();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => (this.sidebarOpen = false));
  }

  ngOnInit(): void {
    setTimeout(() => (this.isVisible = true), 0);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  loadUserData(): void {
    const userStr = typeof localStorage !== "undefined" ? localStorage.getItem("currentUser") : null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userName = user.name && user.lastname ? `${user.name} ${user.lastname}` : "Administrador";
        const userInitials = this.getInitials(user.name, user.lastname);
        this.headerConfig = {
          title: "Admin Creadores",
          subtitle: "Carpeta Digital",
          logo: "/assets/images/logo-2.webp",
          userName: userName,
          userRole: "Gestion de Creadores",
          userInitials: userInitials,
        };
      } catch {
        this.setDefaultHeader();
      }
    } else {
      this.setDefaultHeader();
    }
  }

  setDefaultHeader(): void {
    this.headerConfig = {
      title: "Admin Creadores",
      subtitle: "Carpeta Digital",
      logo: "/assets/images/logo-2.webp",
      userName: "Administrador",
      userRole: "Gestion de Creadores",
      userInitials: "AD",
    };
  }

  getInitials(firstname?: string, lastname?: string): string {
    const f = firstname?.charAt(0)?.toUpperCase() || "";
    const l = lastname?.charAt(0)?.toUpperCase() || "";
    return f + l || "AD";
  }

  ngOnDestroy(): void {
    this.isVisible = false;
    this.sidebarOpen = false;
    this.destroy$.next();
    this.destroy$.complete();
  }
}