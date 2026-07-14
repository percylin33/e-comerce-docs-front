import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { Router, NavigationEnd, RouterOutlet } from "@angular/router";
import { Subject } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";
import { NbLayoutModule } from "@nebular/theme";
import { MENU_ITEMS_DASHBOARD_CREADOR } from "./menu-dashboard-creadores";
import { PromotorSidebarComponent } from "../@theme/components/promotor-sidebar/promotor-sidebar.component";

/**
 * Contenedor principal del panel del Creador.
 * Reutiliza el sidebar (PromotorSidebarComponent) con el menu
 * customizado del modulo Creadores.
 */
@Component({
    selector: "ngx-dashboard-creadores",
    styleUrls: ["./dashboard-creadores.component.scss"],
    template: `
    <nb-layout windowMode>
      <nb-layout-column class="no-padding-column">
        @if (isVisible) {
          <div class="creador-page">
            <ngx-promotor-sidebar [menu]="menu" [class.open]="sidebarOpen"
              [hideBottom]="true"
              [header]="headerConfig">
            </ngx-promotor-sidebar>

            @if (sidebarOpen) {
              <div class="creador-backdrop" (click)="sidebarOpen = false"></div>
            }

            <div class="creador-content">
              <div class="creador-mobile-header">
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
export class DashboardCreadoresComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  menu = MENU_ITEMS_DASHBOARD_CREADOR;
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
        const userName = user.name && user.lastname ? `${user.name} ${user.lastname}` : "Creador";
        const userInitials = this.getInitials(user.name, user.lastname);
        this.headerConfig = {
          title: "Panel del Creador",
          subtitle: "Carpeta Digital",
          logo: "/assets/images/logo-2.webp",
          userName: userName,
          userRole: "Programa de Creadores",
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
      title: "Panel del Creador",
      subtitle: "Carpeta Digital",
      logo: "/assets/images/logo-2.webp",
      userName: "Creador",
      userRole: "Programa de Creadores",
      userInitials: "CR",
    };
  }

  getInitials(firstname?: string, lastname?: string): string {
    const f = firstname?.charAt(0)?.toUpperCase() || "";
    const l = lastname?.charAt(0)?.toUpperCase() || "";
    return f + l || "CR";
  }

  ngOnDestroy(): void {
    this.isVisible = false;
    this.sidebarOpen = false;
    this.destroy$.next();
    this.destroy$.complete();
  }
}