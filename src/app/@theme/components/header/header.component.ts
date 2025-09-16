import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NbMediaBreakpointsService, NbMenuService, NbSidebarService, NbThemeService } from '@nebular/theme';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { UserData } from '../../../@core/data/users';
import { LayoutService } from '../../../@core/utils';
import { map, takeUntil, filter } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { jwtDecode } from "jwt-decode";
import { SharedService } from '../../../@auth/components/shared.service';
import { AuthGoogleService } from '../../../@auth/components/auth-google.service';
import { CartService } from '../../../@core/backend/services/cart.service';
import { MatDialog } from '@angular/material/dialog';
import { ShoppingCartComponent } from '../../../shared/component/shopping-cart/shopping-cart.component';
import { SERVICIOS_ITEMS } from '../../../site/servicios-menu';


@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {

  cartItemCount: number = 0;
  private destroy$: Subject<void> = new Subject<void>();
  userPictureOnly: boolean = false;
  user: any;
  isAuthenticated$ = this.sharedService.isAuthenticated$;
  user$ = this.sharedService.user$;
  serviciosMenu = SERVICIOS_ITEMS;
  isDropdownOpen: boolean = false;

  

  themes = [
    { value: 'default', name: 'Light' },
    { value: 'dark', name: 'Dark' },
    { value: 'cosmic', name: 'Cosmic' },
    { value: 'corporate', name: 'Corporate' },
    { value: 'custom', name: 'Custom' },
    { value: 'material-light', name: 'Material Light' },
  ];

  currentTheme = 'default';

  // userMenu = [{ title: 'Profile' }, { title: 'Log out', link: '/auth/logout' }];
  userMenu = [{ title: 'Cerrar sesión', link: '/autenticacion/logout' }];

  // Método para actualizar el menú de usuario basado en los roles
  private updateUserMenu(user: any) {
    // Resetear el menú a solo logout
    this.userMenu = [{ title: 'Cerrar sesión', link: '/autenticacion/logout' }];

    if (user && user.roles) {
      // Agregar opciones según roles en orden inverso para que aparezcan en el orden correcto
      if (user.roles.includes('ADMIN') || user.roles.includes('SUPADMIN')) {
        this.userMenu.unshift({ title: 'Dashboard', link: '/pages-admin' });
      }
      if (user.roles.includes('PROMOTOR')) {
        this.userMenu.unshift({ title: 'Embajador', link: '/promotor' });
      }
      // "Mi cuenta" siempre va primero si el usuario tiene rol USER
      if (user.roles.includes('USER')) {
        this.userMenu.unshift({ title: 'Mi cuenta', link: '/cuenta-usuario' });
      }
    }
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
   // private userStorageService: UserService,
    private sharedService: SharedService,
    private authGoogleService: AuthGoogleService,
    private cartService: CartService,
    private dialogService: MatDialog,
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
      });
    
    // Las variables de módulo ya están inicializadas en el constructor
    // pero las actualizamos aquí también por seguridad
    this.updateModuleFlags(this.router.url);
    
    this.currentTheme = this.themeService.currentTheme;
    this.isInPromotorModule = this.currentUrl.startsWith('/promotor');
    this.isInCuentaModule = this.currentUrl.startsWith('/cuenta-usuario');

    const { xl } = this.breakpointService.getBreakpointsMap();
    this.themeService.onMediaQueryChange()
      .pipe(
        map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
        takeUntil(this.destroy$),
      )
      .subscribe(isLessThanXl => this.userPictureOnly = isLessThanXl);

    this.themeService.onThemeChange()
      .pipe(
        map(({ name }) => name),
        takeUntil(this.destroy$),
      )
      .subscribe(themeName => this.currentTheme = themeName);

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
    this.initializeAuthFromStorage();

    // SEGUNDO: Suscribirse a cambios reactivos (para actualizaciones en tiempo real)
    this.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        this.updateUserMenu(user);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeTheme(themeName: string) {
    this.themeService.changeTheme(themeName);
  }

  toggleSidebar(): boolean {
    let sidebarTag = 'menu-sidebar';
    if (this.isInPagesAdminModule) {
      sidebarTag = 'menu-sidebar-admin';
    } else if (this.isInPromotorModule) { // Nueva condición
      sidebarTag = 'menu-sidebar-promotor';
    } else if (this.isInCuentaModule) { // <-- Agrega esta condición
    sidebarTag = 'menu-sidebar-perfil';
  }
    this.sidebarService.toggle(true, sidebarTag);
    this.layoutService.changeLayoutSize();
    return false;
  }

  collapseSidebar(): void {
    let sidebarTag = 'menu-sidebar';
    if (this.isInPagesAdminModule) {
      sidebarTag = 'menu-sidebar-admin';
    } else if (this.isInPromotorModule) { // Nueva condición
      sidebarTag = 'menu-sidebar-promotor';
    } else if (this.isInCuentaModule) { // <-- Agrega esta condición
      sidebarTag = 'menu-sidebar-perfil';
    }
    this.sidebarService.collapse(sidebarTag);
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

        this.user = null;
        this.sharedService.setUser(null);
        this.sharedService.setAuthenticated(false);
       // this.userStorageService.clearUser();
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

  // Verifica si el clic ocurrió fuera del sidebar y del botón de toggle
  if (
    !target.closest('nb-sidebar') && // Si no es parte del sidebar
    !target.closest('.sidebar-toggle') && // Si no es el botón de toggle
    !target.closest('.sidebar-toggle-admin') && // Si no es el botón de toggle para admin
    !target.closest('.sidebar-toggle-promotor') &&// Si no es el botón de toggle para promotor
    !target.closest('.sidebar-toggle-perfil')
  ) {
    this.collapseSidebar(); // Cierra el sidebar
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
    this.isDropdownOpen = false;
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
   * Método creado para solucionar el problema del menú hamburguesa en móviles
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

  /**
   * Inicializa el estado de autenticación desde localStorage
   * Solo inicializa el SharedService si no hay usuario ya establecido
   */
  private initializeAuthFromStorage(): void {
    // Solo inicializar si el SharedService aún no tiene usuario
    const currentSharedUser = this.sharedService.getCurrentUser();
    if (!currentSharedUser) {
      const currentUser = localStorage.getItem('currentUser');
      const token = localStorage.getItem('auth_app_token');
      
      if (currentUser && token) {
        try {
          // Validar si el token ha expirado
          if (this.isTokenExpired(token)) {
            console.log('🔒 Header: Token expirado, limpiando datos');
            this.clearAuthData();
            return;
          }

          const userData = JSON.parse(currentUser);
          
          // Establecer en SharedService para que se propague a todos los componentes
          this.sharedService.setUser(userData);
          this.sharedService.setAuthenticated(true);
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
          // Limpiar datos corruptos
          this.clearAuthData();
        }
      } else {
        this.sharedService.setUser(null);
        this.sharedService.setAuthenticated(false);
      }
    } else {
      // Usuario ya existe en SharedService
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decodedToken: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decodedToken.exp < currentTime;
    } catch (error) {
      console.error('Error decodificando token en header:', error);
      return true; // Si no se puede decodificar, considerarlo expirado
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_app_token');
    localStorage.removeItem('auth_app_refresh_token');
    this.sharedService.setUser(null);
    this.sharedService.setAuthenticated(false);
  }
  
}
