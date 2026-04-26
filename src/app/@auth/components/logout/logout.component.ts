import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NbAuthResult, NbAuthService } from '@nebular/auth';
import { SharedService } from '../shared.service';
import { AuthGoogleService } from '../auth-google.service';
import { TokenService } from '../token.service';

@Component({
    selector: 'ngx-logout',
    template: '',
    standalone: true,
})
export class LogoutComponent implements OnInit {
  private authService = inject(NbAuthService);
  private router = inject(Router);
  private sharedService = inject(SharedService);
  private authGoogleService = inject(AuthGoogleService);
  private tokenService = inject(TokenService);


  ngOnInit(): void {
    this.authService.logout('email').subscribe((result: NbAuthResult) => {
      if (result.isSuccess()) {
        this.tokenService.clearTokens();
        this.sharedService.setAuthenticated(false);
        this.authGoogleService.logout();
        this.sharedService.setUser(null);
        
        // SOLUCIÓN: Usar router.navigate en lugar de window.location.href
        this.router.navigate(['/site/home'], { replaceUrl: true });
      } else {
        console.error('Logout failed', result.getErrors());
        
        // Fallback en caso de error
        this.router.navigate(['/autenticacion/login'], { replaceUrl: true });
      }
    });
  }
}
