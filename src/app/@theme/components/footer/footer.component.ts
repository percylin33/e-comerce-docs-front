import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'ngx-footer',
  styleUrls: ['./footer.component.scss'],
  templateUrl: `./footer.component.html`,
})
export class FooterComponent {
  constructor(private router: Router) { }


  navigateToFragmentAyuda(fragment: string) {
    this.router.navigate(['/site/ayuda'], { fragment }).then(() => {
      setTimeout(() => {
        const element = document.getElementById(fragment);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    });
  }


  navigateToFragment(fragment: string) {
    this.router.navigate(['/site/legales'], { fragment }).then(() => {
      setTimeout(() => {
        const element = document.getElementById(fragment);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200); // Ajusta el tiempo de retraso según sea necesario
    });
  }
  navigateToFragmentAcercade(fragment: string) {
    this.router.navigate(['/site/acercade'], { fragment }).then(() => {
      setTimeout(() => {
        const element = document.getElementById(fragment);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    });
  }
}

