import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
// import { UnifiedAntiLoopService } from '../services/unified-anti-loop.service'; // TEMPORALMENTE DESACTIVADO

@Injectable({
  providedIn: 'root'
})
export class ReloadPreventionGuard  {

   private lastUrl: string = '';
  private navigationCount: number = 0;
  private readonly MAX_NAVIGATIONS = 5;

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    
    //✅ PREVENIR BUCLES DE NAVEGACIÓN
    if (state.url === this.lastUrl) {
      this.navigationCount++;
      
      if (this.navigationCount > this.MAX_NAVIGATIONS) {
        console.error('🚨 BUCLE DETECTADO - Redirigiendo a página segura');
        this.router.navigate(['/site']);
        return false;
      }
    } else {
      this.navigationCount = 0;
      this.lastUrl = state.url;
    }

    console.log('✅ Navegación permitida:', state.url);
    return true;
  }
}
