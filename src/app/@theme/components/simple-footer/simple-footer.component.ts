import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'ngx-simple-footer',
    templateUrl: './simple-footer.component.html',
    styleUrls: ['./simple-footer.component.scss'],
    standalone: true,
    imports: [RouterLink]
})
export class SimpleFooterComponent {
  year = new Date().getFullYear();
}
