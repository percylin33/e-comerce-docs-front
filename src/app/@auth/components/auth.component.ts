import { Component, OnDestroy, inject } from '@angular/core';
import { Location } from '@angular/common';

import { NbAuthService, NbAuthModule } from '@nebular/auth';
import { takeWhile } from 'rxjs/operators';
import { NbLayoutModule, NbCardModule, NbIconModule } from '@nebular/theme';
import { RouterOutlet } from '@angular/router';


@Component({
    selector: 'ngx-auth',
    styleUrls: ['./auth.component.scss'],
    template: `
    <nb-layout>
      <nb-layout-column>
        <nb-card>
          <nb-card-header>
            <nav class="navigation">
              <a href="#" (click)="back()" class="link back-link" aria-label="Back">
                <nb-icon icon="arrow-back"></nb-icon>
              </a>
            </nav>
          </nb-card-header>
          <nb-card-body>
            <nb-auth-block>
              <router-outlet></router-outlet>
            </nb-auth-block>
          </nb-card-body>
        </nb-card>
      </nb-layout-column>
    </nb-layout>
  `,
    standalone: true,
    imports: [
        NbLayoutModule,
        NbCardModule,
        NbIconModule,
        NbAuthModule,
        RouterOutlet,
    ],
})
export class NgxAuthComponent implements OnDestroy {
  protected auth = inject(NbAuthService);
  protected location = inject(Location);


  private alive = true;

  subscription: any;

  authenticated: boolean = false;
  token: string = '';

  // showcase of how to use the onAuthenticationChange method
  constructor() {
    const auth = this.auth;


    this.subscription = auth.onAuthenticationChange()
      .pipe(takeWhile(() => this.alive))
      .subscribe((authenticated: boolean) => {
        this.authenticated = authenticated;
      });
  }

  back() {
    this.location.back()
    return false;
  }

  ngOnDestroy(): void {
    this.alive = false;
  }
}

