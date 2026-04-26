import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NbMediaBreakpointsService, NbMenuService, NbSidebarService, NbThemeService, NbIconModule, NbButtonModule, NbActionsModule, NbUserModule, NbContextMenuModule } from '@nebular/theme';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { UserData } from '../../../@core/data/users';
import { LayoutService } from '../../../@core/utils';
import { map, takeUntil, filter } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { SharedService } from '../../../@auth/components/shared.service';
import { AuthGoogleService } from '../../../@auth/components/auth-google.service';
import { CartService } from '../../../@core/backend/services/cart.service';
import { MatDialog } from '@angular/material/dialog';
import { ShoppingCartComponent } from '../../../shared/component/shopping-cart/shopping-cart.component';
import { CategoryService } from '../../../@core/backend/services/category.service';
import { NgClass, AsyncPipe } from '@angular/common';


export interface NavItem {
  title: string;
  link: string;
  queryParams: Record<string, string>;
  /** Backend category id — present for dynamic category nav items */
  categoryId?: number;
}

@Component({
    selector: 'ngx-header',
    styleUrls: ['./header.component.scss'],
    templateUrl: './header.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgClass,
        NbIconModule,
        RouterLink,
        RouterLinkActive,
        NbButtonModule,
        NbActionsModule,
        NbUserModule,
        NbContextMenuModule,
        AsyncPipe,
    ],
})
export class HeaderComponent implements OnInit, OnDestroy {

  cartItemCount: number = 0;
  private destroy$: Subject<void> = new Subject<void>();
  userPictureOnly: boolean = false;
  isAuthenticated$ = this.sharedService.isAuthenticated$;
  user$ = this.sharedService.user$;
  isDropdownOpen: boolean = false;
  private sidebarOpen = false;

  /** Menú de servicios: KITS (estático) + dinámicos del back + MATERIAL_GRATIS (estático) */
  navItems$: Observable<NavItem[]>;

  private readonly STATIC_FIRST: NavItem = {
    title: 'KITS DE PLANIFICACIÓN',
    link: '/site/categorias/KITS',
    queryParams: {},
  };
  private readonly STATIC_LAST: NavItem = {
    title: 'MATERIAL GRATIS',
    link: '/site/categorias/MATERIAL_GRATIS',
    queryParams: {},
  };
  /** Membresías va siempre primera — ruta propia, no es una categoría de documentos */
  private readonly MEMBRESIAS_ITEM: NavItem = {
    title: 'MEMBRESÍAS',
    link: '/site/membresia',
    queryParams: {},
  };
  /** Códigos gestionados como estáticos — se excluyen del fetch dinámico */
  private readonly EXCLUDED_CODES = new Set(['KITS', 'MATERIAL_GRATIS']);



  themes = [
    { value: 'default', name: 'Light' },
    { value: 'dark', name: 'Dark' },
    { value: 'cosmic', name: 'Cosmic' },
    { value: 'corporate', name: 'Corporate' },
    { value: 'custom', name: 'Custom' },
    { value: 'material-light', name: 'Material Light' },
  ];

  currentTheme = 'default';

  userMenu: { title: string; link: string }[] = [{ title: 'Cerrar sesión', link: '/autenticacion/logout' }];

  /** Mapa declarativo: orden de aparición en el menú de arriba hacia abajo */
  private readonly ROLE_MENU_ITEMS: { roles: string[]; title: string; link: string }[] = [
    { roles: ['USER'],              title: 'Mi cuenta',           link: '/cuenta-usuario' },
    { roles: ['PROMOTOR'],          title: 'Embajador',           link: '/promotor' },
    { roles: ['ADMIN', 'SUPADMIN'], title: 'Dashboard',           link: '/pages-admin' },
    { roles: ['SUPADMIN'],          title: 'Dashboard Embajador', link: '/dashboard-promotor/dashboard' },
  ];

  private buildUserMenu(user: any): { title: string; link: string }[] {
    const logout = { title: 'Cerrar sesión', link: '/autenticacion/logout' };
    if (!user?.roles) return [logout];
    const items = this.ROLE_MENU_ITEMS
      .filter(entry => entry.roles.some(r => user.roles.includes(r)))
      .map(({ title, link }) => ({ title, link }));
    return [...items, logout];
  }
  currentUrl: string;
  isInSiteModule: boolean;
  isInPagesAdminModule: boolean;
  isInPromotorModule: boolean; // Nueva variable
  isInCuentaModule


  constructor(private sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    private userService: UserData,
    private layoutService: LayoutService,
    private breakpointService: NbMediaBreakpointsService,
    private authService: NbAuthService,
    private router: Router,
    private sharedService: SharedService,
    private authGoogleService: AuthGoogleService,
    private cartService: CartService,
    private dialogService: MatDialog,
    private cdr: ChangeDetectorRef,
    private categoryService: CategoryService,
  ) {
    // Inicializar las variables de módulo inmediatamente en el constructor
    this.updateModuleFlags(this.router.url);

    // También suscribirse a cambios de ruta para actualizaciones futuras
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.updateModuleFlags(event.url);
    });
  }

  ngOnInit() {
    this.cartService.cartItemCount
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.cartItemCount = count;
        this.cdr.markForCheck();
      });

    // Menú dinámico: MEMBRESÍAS → KITS → dinámicos del back → MATERIAL_GRATIS
    this.navItems$ = this.categoryService.getActiveCategories().pipe(
      map(cats => {
        const kitsCat     = cats.find(c => c.code === 'KITS');
        const materialCat = cats.find(c => c.code === 'MATERIAL_GRATIS');

        const kitsItem: NavItem = {
          ...this.STATIC_FIRST,
          queryParams: kitsCat ? { categoryId: String(kitsCat.id) } : {},
        };
        const materialItem: NavItem = {
          ...this.STATIC_LAST,
          queryParams: materialCat ? { categoryId: String(materialCat.id) } : {},
        };

        return [
          this.MEMBRESIAS_ITEM,
          kitsItem,
          ...cats
            .filter(c => !this.EXCLUDED_CODES.has(c.code))
            .map(c => ({
              title:       c.name,
              link:        `/site/categorias/${c.code}`,
              queryParams: { categoryId: String(c.id) },
              categoryId:  c.id,
            })),
          materialItem,
        ];
      })
    );

    this.currentTheme = this.themeService.currentTheme;

    const { xl } = this.breakpointService.getBreakpointsMap();
    this.themeService.onMediaQueryChange()
      .pipe(
        map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
        takeUntil(this.destroy$),
      )
      .subscribe(isLessThanXl => {
        this.userPictureOnly = isLessThanXl;
        this.cdr.markForCheck();
      });

    this.themeService.onThemeChange()
      .pipe(
        map(({ name }) => name),
        takeUntil(this.destroy$),
      )
      .subscribe(themeName => {
        this.currentTheme = themeName;
        this.cdr.markForCheck();
      });

    // Subscribe to menu item clicks
    this.menuService.onItemClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        // Manejar click en "Mi cuenta" para expandir sidebar
        if (event.item.link === '/cuenta-usuario') {
          setTimeout(() => {
            this.sidebarService.expand('menu-sidebar-perfil');
          }, 200);
        }
        this.collapseSidebar();
      });

    // PRIMERO: Inicializar desde localStorage si existe (para persistencia)
    this.sharedService.initializeFromStorage();

    // SEGUNDO: Suscribirse a cambios reactivos (para actualizaciones en tiempo real)
    this.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.userMenu = this.buildUserMenu(user);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeTheme(themeName: string) {
    this.themeService.changeTheme(themeName);
  }

  private getSidebarTag(): string {
    if (this.isInPagesAdminModule) return 'menu-sidebar-admin';
    if (this.isInPromotorModule)   return 'menu-sidebar-promotor';
    if (this.isInCuentaModule)     return 'menu-sidebar-perfil';
    return 'menu-sidebar';
  }

  toggleSidebar(): boolean {
    this.sidebarOpen = !this.sidebarOpen;
    this.sidebarService.toggle(false, this.getSidebarTag());
    this.layoutService.changeLayoutSize();
    return false;
  }

  collapseSidebar(): void {
    if (!this.sidebarOpen) return;
    this.sidebarOpen = false;
    this.sidebarService.collapse(this.getSidebarTag());
  }

  navigateHome() {
    this.menuService.navigateHome();
    return false;
  }

  ruteo(path: string) {
    const routes = {
      'inicio': '/',
      'login': '/autenticacion/login',
      'register': '/autenticacion/register'
    };
    this.router.navigateByUrl(routes[path]);
  }

  logout() {
    this.authService.logout('email').subscribe({
      next: () => {
        this.sharedService.setUser(null);
        this.sharedService.setAuthenticated(false);
        this.router.navigateByUrl('/autenticacion/login');
      },
      error: (err) => {
        console.error('Logout failed', err);
      }
    });
  }

  openCartDialog() {
    if (this.dialogService.openDialogs.length > 0) {
      return;
    }

    const dialogRef = this.dialogService.open(ShoppingCartComponent, {
      width: '80%',
      maxWidth: '90vw',
    });

    // Opcional: También puedes suscribirte al evento afterClosed para realizar acciones cuando se cierre
    dialogRef.afterClosed().subscribe(() => {
      // Aquí puedes realizar acciones después de que se cierre el diálogo si es necesario
    });
  }


  // toggleVisibility() {
  //   this.sharedService.setVisible(false); // Cambiar a false si quieres ocultar
  // }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Solo procesar cierre de sidebar si está abierto (evita trabajo innecesario en cada click)
    if (this.sidebarOpen &&
      !target.closest('nb-sidebar') &&
      !target.closest('.sidebar-toggle') &&
      !target.closest('.sidebar-toggle-admin') &&
      !target.closest('.sidebar-toggle-promotor') &&
      !target.closest('.sidebar-toggle-perfil')
    ) {
      this.collapseSidebar();
    }

    if (!target.closest('.dropdown-container')) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown(event: Event): void {
    event.preventDefault();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }




  onMenuItemClick(event: { item: any }): void {
    const link = event.item.link;
    const queryParams = event.item.queryParams || {};

    if (link) {
      // Si navegamos al perfil, asegurar que el sidebar se expanda
      if (link === '/cuenta-usuario') {
        setTimeout(() => {
          this.sidebarService.expand('menu-sidebar-perfil');
        }, 100);
      }
      this.router.navigate([link], { queryParams });
    }
  }

  openDropdown(): void {
    this.isDropdownOpen = true;
  }

  /**
   * Navega al perfil del usuario y asegura que el sidebar esté abierto
   */
  navigateToProfile(): void {
    this.router.navigate(['/cuenta-usuario']).then(() => {
      // Asegurar que el sidebar del perfil se expanda después de la navegación
      setTimeout(() => {
        this.sidebarService.expand('menu-sidebar-perfil');
      }, 150);
    });
  }

  /**
   * Actualiza las banderas de módulo basándose en la URL actual
   */
  private updateModuleFlags(url: string): void {
    // Limpiar fragmentos de hash de la URL
    const cleanUrl = url.split('#')[0];

    this.currentUrl = cleanUrl;
    this.isInSiteModule = cleanUrl.startsWith('/site');
    this.isInPagesAdminModule = cleanUrl.startsWith('/pages-admin');
    this.isInPromotorModule = cleanUrl.startsWith('/promotor');
    this.isInCuentaModule = cleanUrl.startsWith('/cuenta-usuario');
  }

}
