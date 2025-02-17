import { Component } from '@angular/core';
import { MENU_ITEMS_ADMIN } from './pages-menu';

@Component({
  selector: 'ngx-pages-admin',
  styleUrls: ['pages-admin.component.scss'],
  template: `
    <ngx-one-column-layout>
      <nb-menu [items]="menu"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
  `,
})
export class PagesAdminComponent {
  menu = MENU_ITEMS_ADMIN
}
