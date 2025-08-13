import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ReloadPreventionGuard implements CanActivate {
  private lastNavigationTime = 0;
  private navigationCount = 0;
  private navigationHistory: string[] = [];
  private readonly MAX_NAVIGATIONS_PER_SECOND = 2; // Reducido a 2
  private readonly TIME_WINDOW = 2000; // Aumentado a 2 segundos
  private readonly MAX_HISTORY_SIZE = 10;

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentTime = Date.now();
    const currentUrl = state.url;
    
    // Reset counter if more than TIME_WINDOW has passed
    if (currentTime - this.lastNavigationTime > this.TIME_WINDOW) {
      this.navigationCount = 0;
      this.navigationHistory = [];
    }
    
    // Check for immediate back-and-forth navigation
    if (this.navigationHistory.length >= 2) {
      const lastTwo = this.navigationHistory.slice(-2);
      if (lastTwo[0] === currentUrl && lastTwo[1] !== currentUrl) {
        console.warn('🚨 Back-and-forth navigation detected. Blocking.', {
          currentUrl,
          history: this.navigationHistory
        });
        return false;
      }
    }
    
    // Add to history
    this.navigationHistory.push(currentUrl);
    if (this.navigationHistory.length > this.MAX_HISTORY_SIZE) {
      this.navigationHistory = this.navigationHistory.slice(-this.MAX_HISTORY_SIZE);
    }
    
    this.navigationCount++;
    this.lastNavigationTime = currentTime;
    
    // If too many navigations in short time, prevent navigation
    if (this.navigationCount > this.MAX_NAVIGATIONS_PER_SECOND) {
      console.warn('🚨 Infinite reload loop detected. Navigation blocked.', {
        url: currentUrl,
        navigationCount: this.navigationCount,
        timeWindow: this.TIME_WINDOW,
        history: this.navigationHistory
      });
      
      // Clear localStorage flags that might be causing loops
      localStorage.removeItem('forcedLogout');
      localStorage.removeItem('forcedLogoutTime');
      
      // Reset counter and allow navigation after a longer delay
      setTimeout(() => {
        this.navigationCount = 0;
        this.navigationHistory = [];
      }, this.TIME_WINDOW * 2);
      
      return false;
    }
    
    return true;
  }
}
