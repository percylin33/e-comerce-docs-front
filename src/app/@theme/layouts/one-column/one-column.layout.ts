import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { MENU_ITEMS } from '../../../site/pages-menu';
import { MENU_ITEMS_ADMIN } from '../../../pages-admin/pages-menu';
import { MENU_ITEMS_PROMOTOR } from '../../../admin-promotor/promotor-menu';
import { MENU_ITEMS_CUENTA } from '../../../cuenta-usuario/cuenta-menu';
import { NbSidebarService } from '@nebular/theme';

@Component({
  selector: 'ngx-one-column-layout',
  styleUrls: ['./one-column.layout.scss'],
  template: `
    <nb-layout windowMode>
      <nb-layout-header [fixed]="!isStaticHeaderRoute">
        <ngx-header></ngx-header>
      </nb-layout-header>

      <nb-sidebar
        #miSidebar
        [ngClass]="isInSiteModule ? 'menu-sidebar fixed left' : 'sidebar-toggle'"
        [state]="'collapsed'"
        [responsive]="false"
        [compacted]="false"
        tag="menu-sidebar">
        <nb-menu [items]="menuItems" (itemClick)="onMenuItemClick($event)"></nb-menu>
      </nb-sidebar>

      <nb-sidebar
        #miSidebarAdmin
        [ngClass]="isInPagesAdminModule ? 'menu-sidebar-admin fixed left' : 'sidebar-toggle'"
        [state]="'collapsed'"
        [responsive]="false"
        [compacted]="true"
        tag="menu-sidebar-admin">
        <nb-menu [items]="menuItemsAdmin"></nb-menu>
      </nb-sidebar>

      <nb-sidebar
        #miSidebarPromotor
        [ngClass]="isInPromotorModule ? 'menu-sidebar-promotor fixed left' : 'sidebar-toggle'"
        [state]="'collapsed'"
        [responsive]="false"
        [compacted]="true"
        tag="menu-sidebar-promotor">
        <nb-menu [items]="menuItemsPromotor"></nb-menu>
      </nb-sidebar>

      <nb-sidebar
        #miSidebarPerfil
        [ngClass]="isInCuentaModule ? 'menu-sidebar-perfil fixed left' : 'sidebar-toggle'"
        
        [responsive]="false"
        [compacted]="true"
        tag="menu-sidebar-perfil">
        <nb-menu [items]="menuItemsCuenta"></nb-menu>
      </nb-sidebar>

      <nb-layout-column class="main-layout">
        <ngx-main-section *ngIf="isInHomeRoute || isInRoot"></ngx-main-section>

        <ngx-categories-section *ngIf="!isCheckoutOrAdmin && !inInComplaintBookRoute && !isInPromotorModule  && !isMembresiaRoute && !isInCategoriasRoute && !isInCuentaModule"></ngx-categories-section>

        <ng-content select="router-outlet"></ng-content>
      </nb-layout-column>

      <nb-layout-footer fixed>
        <ngx-footer *ngIf="!isInPagesAdminModule && !isInPromotorModule"></ngx-footer>
      </nb-layout-footer>
    </nb-layout>
  `,
})
export class OneColumnLayoutComponent implements AfterViewInit, OnDestroy {
  @ViewChild('miSidebar', { static: false, read: ElementRef }) miSidebar!: ElementRef;

  private destroy$ = new Subject<void>();
  private staticHeaderPaths = ['/site/legales', '/site/ayuda', '/site/acercade'];

  isInSiteModule: boolean;
  isInPagesAdminModule: boolean;
  isInPromotorModule: boolean; // Nueva variable
  isCheckoutOrAdmin: boolean;
  isInCategoriasRoute: boolean;
  inInComplaintBookRoute: boolean;
  isStaticHeaderRoute: boolean; // Nueva variable
  isInDetailRoute: boolean;
  isInHomeRoute: boolean;
  isMembresiaRoute: boolean;
  isInRoot: boolean;
  isInCuentaModule: boolean;

  menuItems = MENU_ITEMS; // Importa y asigna los items del menú para /site
  menuItemsAdmin = MENU_ITEMS_ADMIN; // Importa y asigna los items del menú para /pages-admin
  menuItemsPromotor = MENU_ITEMS_PROMOTOR;
  menuItemsCuenta = MENU_ITEMS_CUENTA;

  constructor(private router: Router, private sidebarService: NbSidebarService) {
    this.updateFlags(this.router.url);

    // Subscribe to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.updateFlags(event.url);

       if (this.isInCuentaModule) {
        this.sidebarService.expand('menu-sidebar-perfil');
      } else {
        this.sidebarService.collapse('menu-sidebar-perfil');
      }
    });
  }

  ngAfterViewInit(): void {

    if (this.miSidebar?.nativeElement) {
      this.ocultarSidebar();
    }
  }

  onMenuItemClick(event: { item: any }): void {
    const link = event.item.link; // Obtiene el enlace del elemento seleccionado
    let queryParams = event.item.queryParams || {}; // Obtiene los parámetros de consulta, si existen

  
    if (queryParams.category === 'SESIONES') {
      
      queryParams = { ...queryParams, category: 'PLANIFICACION' };
    }
    if (link) {
      this.router.navigate([link], { queryParams }); // Navega a la ruta especificada con los parámetros de consulta
    }
  }

  private updateFlags(url: string): void {
    // Remove hash fragment from URL
    const cleanUrl = url.split('#')[0];

    this.isInSiteModule = cleanUrl.startsWith('/site');
    this.isInPagesAdminModule = cleanUrl.startsWith('/pages-admin');
    this.isInPromotorModule = cleanUrl.startsWith('/promotor');
    this.isCheckoutOrAdmin = this.isInPagesAdminModule || cleanUrl === '/site/checkout';
    this.isInCategoriasRoute = cleanUrl.includes('/site/categorias/'); // Nueva validación
    this.inInComplaintBookRoute = cleanUrl.includes('/site/reclamaciones'); // Nueva validación
    this.isStaticHeaderRoute = this.staticHeaderPaths.some(path => cleanUrl === path); // Nueva validación
    this.isInDetailRoute = cleanUrl.includes('/site/detail'); // Nueva validación
    this.isInHomeRoute = cleanUrl === '/site/home';
    this.isInRoot = cleanUrl === '/';
    this.isMembresiaRoute = cleanUrl.includes('/site/membresia'); // Nueva validación
    this.isInCuentaModule = cleanUrl.startsWith('/cuenta-usuario');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ocultarSidebar() {
    if (this.isInSiteModule) {
      const sidebar = this.miSidebar.nativeElement;
      if (sidebar.classList.contains('fixed')) {
        sidebar.classList.remove('fixed');
      }

    }
  }
}
