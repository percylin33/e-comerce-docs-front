import { Component } from '@angular/core';

@Component({
  selector: 'ngx-simple-footer',
  templateUrl: './simple-footer.component.html',
  styleUrls: ['./simple-footer.component.scss']
})
export class SimpleFooterComponent {
  year = new Date().getFullYear();
}
