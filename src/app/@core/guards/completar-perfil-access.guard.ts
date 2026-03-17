import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

/**
 * Guard para la ruta /autenticacion/completar-perfil.
 * - Sin token → redirige a /autenticacion/login
 * - Token con perfil ya completo (phone + country) → redirige a /site/home
 * - Token con perfil incompleto → permite el acceso al formulario
 */
@Injectable({
  providedIn: 'root'
})
export class CompletarPerfilAccessGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('auth_app_token');

    if (!token) {
      this.router.navigate(['/autenticacion/login']);
      return false;
    }

    try {
      const decoded: any = jwtDecode(token);

      // Token expirado → login
      if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
        this.router.navigate(['/autenticacion/login']);
        return false;
      }

      // Perfil ya completo → no necesita estar aquí, ir a home
      // Verificar tanto el JWT como currentUser en localStorage
      const jwtComplete = decoded?.phone && decoded?.country;
      let localComplete = false;
      try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          const cu = JSON.parse(stored);
          localComplete = !!(cu?.phone && cu?.country);
        }
      } catch {}

      if (jwtComplete || localComplete) {
        this.router.navigate(['/site/home'], { replaceUrl: true });
        return false;
      }
    } catch {
      this.router.navigate(['/autenticacion/login']);
      return false;
    }

    return true;
  }
}
