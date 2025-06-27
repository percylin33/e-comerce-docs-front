import { ExtraOptions, RouterModule, Routes } from '@angular/router';
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



export const routes: Routes = [
  
  {
    path: 'site',
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
    loadChildren: () => import('./pages-admin/pages-admin.module')
      .then(m => m.PagesAdminModule),
  },
  {
    path: 'auth',
    loadChildren: () => import('./@auth/auth.module')
      .then(m => m.AuthModule),
  },
  {
    path: 'promotor',
    loadChildren: () => import('./admin-promotor/admin-promotor.module')
      .then(m => m.AdminPromotorModule),
  },
  {
    path: 'cuenta-usuario',
    loadChildren: () => import('./cuenta-usuario/cuenta-usuario.module')
      .then(m => m.CuentaUsuarioModule),
  },
  // Elimina esta línea
  { path: '', redirectTo: 'site/home', pathMatch: 'full' },
  { path: '**', redirectTo: 'site/home' },
];

const config: ExtraOptions = {
  useHash: false,
};

@NgModule({
  imports: [RouterModule.forRoot(routes, { anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
