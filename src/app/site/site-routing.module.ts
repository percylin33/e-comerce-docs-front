import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SiteComponent } from './site.component';
import { HomeComponent } from './home/home.component';
import { DetailComponent } from './detail/detail.component';
import { CategoriasComponent } from './categorias/categorias.component';
import { LegalesComponent } from './legales/legales.component';
import { ContactComponent } from './contact/contact.component';
import { NosotrosComponent } from './nosotros/nosotros.component';
import { AyudaComponent } from './ayuda/ayuda.component';
import { AcercadeComponent } from './acercade/acercade.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { ComplaintBookComponent } from './complaint-book/complaint-book.component';


const routes: Routes = [
  {
    path: '',
    component: SiteComponent,
    children: [
      {
        path: 'home',
        component: HomeComponent,
      },
      {
        path: 'detail/:id',
        component: DetailComponent,
      },
      {
        path: 'categorias/:service',
        component: CategoriasComponent,
      },
      {
        path: 'legales',
        component: LegalesComponent,
      },
      {
        path: 'contacto',
        component: ContactComponent,
      },
      {
        path: 'nosotros',
        component: NosotrosComponent,
      },
      {
        path: 'ayuda',
        component: AyudaComponent,
      },
      {
        path: 'acercade',
        component: AcercadeComponent,
      },
      {
        path: 'checkout',
        component: CheckoutComponent
      },
      {
        path: 'reclamaciones',
        component: ComplaintBookComponent,
      },
      {
        path: '',
        redirectTo: 'home', // Ruta por defecto
        pathMatch: 'full',
      },
    ]
  },
  { path: '**', redirectTo: 'home' }, // Ruta para páginas no encontradas
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SiteRoutingModule {}
