import { Component } from "@angular/core";
import { MENU_ITEMS_CUENTA } from "./cuenta-menu";

@Component({
  selector: 'ngx-admin-promotor',
  styleUrls: ['cuenta-usuario.component.scss'],
  template: `
    <ngx-one-column-layout>
      <nb-menu [items]="menu"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
  `,
})
export class CuentaUsuarioComponent {
  menu = MENU_ITEMS_CUENTA
}