import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SiteComponent } from './site.component';

const routes: Routes = [
  {
    path: '',
    component: SiteComponent,
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'detail/:id',
        loadComponent: () => import('./detail/detail.component').then(m => m.DetailComponent),
      },
      {
        path: 'categorias/:service',
        loadComponent: () => import('./categorias/categorias.component').then(m => m.CategoriasComponent),
      },
      {
        path: 'legales',
        loadComponent: () => import('./legales/legales.component').then(m => m.LegalesComponent),
      },
      {
        path: 'contacto',
        loadComponent: () => import('./contact/contact.component').then(m => m.ContactComponent),
      },
      {
        path: 'nosotros',
        loadComponent: () => import('./nosotros/nosotros.component').then(m => m.NosotrosComponent),
      },
      {
        path: 'ayuda',
        loadComponent: () => import('./ayuda/ayuda.component').then(m => m.AyudaComponent),
      },
      {
        path: 'acercade',
        loadComponent: () => import('./acercade/acercade.component').then(m => m.AcercadeComponent),
      },
      {
        path: 'checkout',
        loadComponent: () => import('./checkout/checkout.component').then(m => m.CheckoutComponent),
      },
      {
        path: 'checkout/resume',
        loadComponent: () => import('./checkout-resume/resume-checkout.component').then(m => m.ResumeCheckoutComponent),
      },
      {
        path: 'reclamaciones',
        loadComponent: () => import('./complaint-book/complaint-book.component').then(m => m.ComplaintBookComponent),
      },
      {
        path: 'membresia',
        loadComponent: () => import('./membresia/membresia.component').then(m => m.MembresiaComponent),
      },
      {
        path: 'materiales',
        loadComponent: () => import('./materiales/materiales.component').then(m => m.MaterialesComponent),
      },
      {
        path: 'membresia-detail/:id',
        loadComponent: () => import('./membresia-detail/membresia-detail.component').then(m => m.MembresiaDetailComponent),
      },
      {
        path: 'descarga/:token',
        loadComponent: () => import('./descarga/descarga-simple.component').then(m => m.DescargaSimpleComponent),
      },
      {
        path: 'descarga-email/:linkToken',
        loadComponent: () => import('./descarga/descarga-email.component').then(m => m.DescargaEmailComponent),
      },
      {
        path: 'purchase-confirmation',
        loadComponent: () => import('./purchase-confirmation/purchase-confirmation.component').then(m => m.PurchaseConfirmationComponent),
      },
      {
        path: 'embajadores',
        loadComponent: () => import('./embajadores/embajadores.component').then(m => m.EmbajadoresComponent),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SiteRoutingModule {}
