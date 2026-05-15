import { Component, OnInit } from '@angular/core';
import { MENU_ITEMS } from './pages-menu';
import { OneColumnLayoutComponent } from '../@theme/layouts/one-column/one-column.layout';
import { NbMenuModule } from '@nebular/theme';
import { RouterOutlet } from '@angular/router';


@Component({
    selector: 'ngx-site',
    template: `
    <ngx-one-column-layout>
      <nb-menu [items]="menu"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
  `,
    styles: [],
    standalone: true,
    imports: [OneColumnLayoutComponent, NbMenuModule, RouterOutlet]
})
export class SiteComponent  {

  menu = MENU_ITEMS
 
 
}

