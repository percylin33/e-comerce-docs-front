import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'ngx-legales',
    templateUrl: './legales.component.html',
    styleUrls: ['./legales.component.scss'],
    standalone: true
})
export class LegalesComponent implements OnInit {
  private route = inject(ActivatedRoute);

  activeSection: string = '';

  ngOnInit(): void {
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        this.scrollToSection(fragment);
        this.activeSection = fragment;
      }
    });
  }

  scrollToSection(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.activeSection = id;
    }
  }

  
}