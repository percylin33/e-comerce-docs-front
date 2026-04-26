import { ViewportScroller } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'ngx-acercade',
    templateUrl: './acercade.component.html',
    styleUrls: ['./acercade.component.scss'],
    standalone: true
})
export class AcercadeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private viewportScroller = inject(ViewportScroller);

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
