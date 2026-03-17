/*import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import {
  NbAuthComponent,
  NbLoginComponent,
  NbLogoutComponent,
  NbRegisterComponent,
  NbRequestPasswordComponent,
  NbResetPasswordComponent,
} from '@nebular/auth';
import { ContactComponent } from './site/contact/contact.component';
import { ReloadPreventionGuard } from './@core/guards/reload-prevention.guard';



export const routes: Routes = [
  
  {
    path: 'site',
    canActivate: [ReloadPreventionGuard],
    loadChildren: () => import('./site/site.module')
      .then(m => m.SiteModule),
  },
  // {
  //   path: 'pages',
  //   loadChildren: () => import('./pages/pages.module')
  //     .then(m => m.PagesModule),
  // },
  {
    path: 'pages-admin',
    canActivate: [ReloadPreventionGuard],
    loadChildren: () => import('./pages-admin/pages-admin.module')
      .then(m => m.PagesAdminModule),
  },
  {
    path: 'autenticacion',
    canActivate: [ReloadPreventionGuard],
    loadChildren: () => import('./@auth/auth.module')
      .then(m => m.AuthModule),
  },
  {
    path: 'promotor',
    canActivate: [ReloadPreventionGuard],
    loadChildren: () => import('./admin-promotor/admin-promotor.module')
      .then(m => m.AdminPromotorModule),
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'dashboard-promotor',
    canActivate: [ReloadPreventionGuard],
    loadChildren: () => import('./dashboard-promotores/dashboard-promotores.module')
      .then(m => m.DashboardPromotoresModule),
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'cuenta-usuario',
    canActivate: [ReloadPreventionGuard],
    loadChildren: () => import('./cuenta-usuario/cuenta-usuario.module')
      .then(m => m.CuentaUsuarioModule),
  },
  // Elimina esta línea
  { path: '', redirectTo: 'site/home', pathMatch: 'full' },
  { path: '**', redirectTo: 'site/home' },
];

const config: ExtraOptions = {
  useHash: false,
  onSameUrlNavigation: 'reload',
};

@NgModule({
  imports: [RouterModule.forRoot(routes, { 
    anchorScrolling: 'enabled', 
    scrollPositionRestoration: 'enabled',
    onSameUrlNavigation: 'reload'
  })],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
*/

import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { ReloadPreventionGuard } from './@core/guards/reload-prevention.guard';
import { ProfileCompletionGuard } from './@core/guards/profile-completion.guard';

export const routes: Routes = [
  {
    path: 'site',
    canActivate: [ReloadPreventionGuard, ProfileCompletionGuard],
    loadChildren: () => import('./site/site.module')
      .then(m => m.SiteModule),
  },
  {
    path: 'pages-admin',
    canActivate: [ReloadPreventionGuard, ProfileCompletionGuard],
    loadChildren: () => import('./pages-admin/pages-admin.module')
      .then(m => m.PagesAdminModule),
  },
  {
    path: 'autenticacion',
    canActivate: [ReloadPreventionGuard],
    loadChildren: () => import('./@auth/auth.module')
      .then(m => m.AuthModule),
  },
  {
    path: 'promotor',
    canActivate: [ReloadPreventionGuard, ProfileCompletionGuard],
    loadChildren: () => import('./admin-promotor/admin-promotor.module')
      .then(m => m.AdminPromotorModule),
  },
  {
    path: 'dashboard-promotor',
    canActivate: [ReloadPreventionGuard, ProfileCompletionGuard],
    loadChildren: () => import('./dashboard-promotores/dashboard-promotores.module')
      .then(m => m.DashboardPromotoresModule),
  },
  {
    path: 'cuenta-usuario',
    canActivate: [ReloadPreventionGuard, ProfileCompletionGuard],
    loadChildren: () => import('./cuenta-usuario/cuenta-usuario.module')
      .then(m => m.CuentaUsuarioModule),
  },
  // ✅ RUTA POR DEFECTO CORREGIDA
  { path: '', redirectTo: 'site', pathMatch: 'full' },
  // ✅ MANEJO DE 404 MEJORADO
  { path: '**', redirectTo: 'site' }
];

// ✅ CONFIGURACIÓN LIMPIA
const config: ExtraOptions = {
  useHash: false, // o true si prefieres hash routing
  // onSameUrlNavigation: 'reload' // ❌ ELIMINADO
};

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    anchorScrolling: 'enabled',
    scrollPositionRestoration: 'enabled',
    // onSameUrlNavigation: 'reload' // ❌ ELIMINADO
  })],
  exports: [RouterModule],
})
export class AppRoutingModule { }