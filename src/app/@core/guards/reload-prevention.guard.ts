import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ReloadPreventionGuard implements CanActivate {
  private lastNavigationTime = 0;
  private navigationCount = 0;
  private readonly MAX_NAVIGATIONS_PER_SECOND = 3;
  private readonly TIME_WINDOW = 1000; // 1 segundo

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentTime = Date.now();
    
    // Reset counter if more than TIME_WINDOW has passed
    if (currentTime - this.lastNavigationTime > this.TIME_WINDOW) {
      this.navigationCount = 0;
    }
    
    this.navigationCount++;
    this.lastNavigationTime = currentTime;
    
    // If too many navigations in short time, prevent navigation
    if (this.navigationCount > this.MAX_NAVIGATIONS_PER_SECOND) {
      console.warn('🚨 Possible infinite reload loop detected. Navigation blocked.', {
        url: state.url,
        navigationCount: this.navigationCount,
        timeWindow: this.TIME_WINDOW
      });
      
      // Reset counter and allow navigation after a delay
      setTimeout(() => {
        this.navigationCount = 0;
      }, this.TIME_WINDOW);
      
      return false;
    }
    
    return true;
  }
}
