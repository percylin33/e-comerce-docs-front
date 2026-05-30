import { Component } from "@angular/core";
import { MENU_ITEMS_CUENTA } from "./cuenta-menu";
import { OneColumnLayoutComponent } from "../@theme/layouts/one-column/one-column.layout";
import { NbMenuModule } from "@nebular/theme";
import { RouterOutlet } from "@angular/router";

@Component({
    selector: 'ngx-admin-promotor',
    styleUrls: ['cuenta-usuario.component.scss'],
    template: `
    <ngx-one-column-layout>
      <nb-menu [items]="menu"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
  `,
    standalone: true,
    imports: [
        OneColumnLayoutComponent,
        NbMenuModule,
        RouterOutlet,
    ],
})
export class CuentaUsuarioComponent {
  menu = MENU_ITEMS_CUENTA
}