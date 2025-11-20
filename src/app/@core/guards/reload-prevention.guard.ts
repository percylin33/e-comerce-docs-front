import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
// import { UnifiedAntiLoopService } from '../services/unified-anti-loop.service'; // TEMPORALMENTE DESACTIVADO

@Injectable({
  providedIn: 'root'
})
export class ReloadPreventionGuard implements CanActivate {

  constructor(
    private router: Router
    // private antiLoopService: UnifiedAntiLoopService // TEMPORALMENTE DESACTIVADO
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // ANTI-LOOP TEMPORALMENTE DESACTIVADO PARA TESTING;
    
    // // Simplificar: solo verificar si el modo de emergencia está activo
    // if (this.antiLoopService.isEmergencyModeActive()) {
    //   console.warn('🚨 Navegación bloqueada - Modo de emergencia activo');
    //   return false;
    // }

    // // Trackear la navegación en el servicio unificado
    // this.antiLoopService.trackNavigation(state.url, 'router-guard');
    
    return true;
  }
}
