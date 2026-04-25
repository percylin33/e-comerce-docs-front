import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

/**
 * Protege las rutas que requieren perfil completo (phone + country).
 * Si faltan datos → redirige a /autenticacion/completar-perfil.
 * Si no hay token → deja pasar (el AuthGuard/módulo de auth lo maneja).
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileCompletionGuard  {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('auth_app_token');

    if (!token) {
      // Sin token: dejar que los demás guards manejen el flujo de auth
      return true;
    }

    try {
      const decoded: any = jwtDecode(token);

      // Verificar expiración
      if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
        return true; // Token expirado: los guards de auth lo manejarán
      }

      // Si phone o country faltan en el JWT → verificar también currentUser en localStorage
      // (cubre el caso en que el backend generó el token antes de incluir 'country' en los claims)
      const phoneFromJwt = decoded?.phone;
      const countryFromJwt = decoded?.country;

      if (!phoneFromJwt || !countryFromJwt) {
        // Fallback: leer currentUser desde localStorage
        try {
          const stored = localStorage.getItem('currentUser');
          if (stored) {
            const cu = JSON.parse(stored);
            if (cu?.phone && cu?.country) {
              return true; // currentUser completo → dejar pasar
            }
          }
        } catch {}

        this.router.navigate(['/autenticacion/completar-perfil']);
        return false;
      }
    } catch {
      // Token malformado: dejar pasar
    }

    return true;
  }
}
