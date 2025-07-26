import { Component } from "@angular/core";
import { MENU_ITEMS_PROMOTOR } from './promotor-menu';

@Component({
  selector: 'ngx-admin-promotor',
  styleUrls: ['admin-promotor.component.scss'],
  template: `
    <ngx-one-column-layout>
      <nb-menu [items]="menu"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
  `,
})
export class AdminPromotorComponent {
  menu = MENU_ITEMS_PROMOTOR
}
