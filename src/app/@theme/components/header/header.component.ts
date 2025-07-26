import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NbMediaBreakpointsService, NbMenuService, NbSidebarService, NbThemeService } from '@nebular/theme';
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { UserData } from '../../../@core/data/users';
import { LayoutService } from '../../../@core/utils';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
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
  userMenu = [{ title: 'Cerrar sesión', link: '/auth/logout' }];

  // Método para actualizar el menú de usuario basado en los roles
  private updateUserMenu(user: any) {
    // Resetear el menú a solo logout
    this.userMenu = [{ title: 'Cerrar sesión', link: '/auth/logout' }];

    if (user && user.roles) {
      // Agregar opciones según roles en orden inverso para que aparezcan en el orden correcto
      if (user.roles.includes('ADMIN')) {
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
  }

  ngOnInit() {
    this.cartService.cartItemCount
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.cartItemCount = count;
      });
    this.currentUrl = this.router.url;
    this.isInSiteModule = this.currentUrl.startsWith('/site');
    this.isInPagesAdminModule = this.currentUrl.startsWith('/pages-admin');
    this.isInPromotorModule = this.currentUrl.startsWith('/promotor');
    this.isInCuentaModule = this.currentUrl.startsWith('/cuenta-usuario');
    this.currentTheme = this.themeService.currentTheme;


    this.authService.onTokenChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe((token: NbAuthJWTToken) => {
        if (token.isValid()) {
          const decodedToken = jwtDecode(token.getValue());

          console.log('Decoded Token:', decodedToken); // Para debugging
          
          this.user = decodedToken;
          this.sharedService.setUser(this.user);
          this.sharedService.setAuthenticated(true);
          
          // Actualizar el menú del usuario basado en roles
          this.updateUserMenu(this.user);
        } else {
          this.user = null;
          this.sharedService.setUser(null);
          this.sharedService.setAuthenticated(false);
          // Resetear el menú cuando no hay usuario autenticado
          this.updateUserMenu(null);
        }
      });



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



    // this.sharedService.isAuthenticated$
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(isAuthenticated => this.isAuthenticated = isAuthenticated);

      const token = localStorage.getItem('auth_app_token');
      if (token) {
        this.user = jwtDecode(token);
        this.sharedService.setUser(this.user);
        this.sharedService.setAuthenticated(true);

        const currentUser = {
          id: this.user.idUser,
          exp: this.user.exp,
          iat: this.user.iat,
          lastname: this.user.lastname,
          name: this.user.name,
          roles: this.user.roles,
          phone: this.user.phone,
          picture: this.user.picture ,
          sub: this.user.sub,
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Actualizar el menú del usuario basado en roles
        this.updateUserMenu(this.user);
        
      } else {
        this.sharedService.setUser(null);
        this.sharedService.setAuthenticated(false);
        localStorage.removeItem('currentUser');
        // Resetear el menú cuando no hay usuario autenticado
        this.updateUserMenu(null);
      }

      // Subscribe to menu item clicks
    this.menuService.onItemClick()
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.collapseSidebar();
    });

    // Suscribirse a cambios en el usuario para actualizar el menú dinámicamente
    this.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.updateUserMenu(user);
      });

    // const data = JSON.stringify(this.authGoogleService.getProfile());

    // if (data !== 'null') {
    //   this.user = data;


    //   this.isAuthenticated = true;
    //   this.sharedService.setAuthenticated(true);
    //   this.userStorageService.saveUser(this.user);
    // }else if (token == null) {
    //   this.isAuthenticated = false;
    //   this.sharedService.setAuthenticated(false);
    //   this.userStorageService.clearUser();
    // }
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
      'login': '/auth/login',
      'register': '/auth/register'
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
        this.router.navigateByUrl('/auth/login');
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
      this.router.navigate([link], { queryParams });
    }
  }

  openDropdown(): void {
    this.isDropdownOpen = false;
  }
  
}
