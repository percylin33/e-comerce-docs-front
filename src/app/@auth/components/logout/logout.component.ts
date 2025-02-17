import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NbAuthResult, NbAuthService } from '@nebular/auth';
import { SharedService } from '../shared.service';
import { AuthGoogleService } from '../auth-google.service';
import { TokenService } from '../token.service';

@Component({
  selector: 'ngx-logout',
  template: '',
})
export class LogoutComponent implements OnInit {

  constructor(private authService: NbAuthService,
     private router: Router,
      private sharedService: SharedService,
      private authGoogleService: AuthGoogleService,
      private tokenService: TokenService) {}

      ngOnInit(): void {

        this.authService.logout('email').subscribe((result: NbAuthResult) => {


          if (result.isSuccess()) {


            this.tokenService.clearTokens();
            this.sharedService.setAuthenticated(false);
            this.authGoogleService.logout();
            this.sharedService.setUser(null);
            //this.userStorageService.clearUser();
            window.location.href = '/';
          } else {
            console.error('Logout failed', result.getErrors());


          }
        });
      }


}
