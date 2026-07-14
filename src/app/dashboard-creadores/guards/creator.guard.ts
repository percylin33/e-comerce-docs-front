import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Datos minimos del usuario autenticado tal y como se almacena en
 * {@code localStorage.currentUser} por el login del front.
 *
 * <p>Se mantiene simple y desacoplado de los modelos del SharedService
 * para que los guards sean faciles de testear.</p>
 */
export interface CurrentUser {
  id?: number | string;
  email?: string;
  roles?: string[];
}

/**
 * Devuelve el usuario autenticado actual leyendo del localStorage.
 * Devuelve {@code null} si no hay sesion o el JSON esta malformado.
 */
export function getCurrentUser(): CurrentUser | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('currentUser') : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? (parsed as CurrentUser) : null;
  } catch {
    return null;
  }
}

export function hasRole(user: CurrentUser | null, ...allowed: string[]): boolean {
  if (!user || !Array.isArray(user.roles) || user.roles.length === 0) return false;
  return allowed.some(r => user.roles!.includes(r));
}

/**
 * Guard: deja pasar solo a usuarios autenticados con rol CREATOR.
 *
 * <p>Si no hay sesion: redirige a /autenticacion/login (o similar).</p>
 * <p>Si hay sesion pero no es Creador: redirige a /forbidden con un
 * mensaje explicativo.</p>
 *
 * <p>Mejora M6 del modulo Creadores.</p>
 */
export const creatorGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const user = getCurrentUser();

  if (!user) {
    // No autenticado: volver al inicio de sesion.
    return router.createUrlTree(['/autenticacion/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  if (!hasRole(user, 'CREATOR')) {
    // Autenticado pero sin permiso: a una pantalla de forbidden.
    return router.createUrlTree(['/forbidden'], {
      queryParams: { reason: 'creator-required', from: state.url },
    });
  }

  return true;
};

/**
 * Guard: deja pasar solo a usuarios con rol ADMIN o SUPADMIN.
 *
 * <p>Mejora M6 del modulo Creadores.</p>
 */
export const adminGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const user = getCurrentUser();

  if (!user) {
    return router.createUrlTree(['/autenticacion/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  if (!hasRole(user, 'ADMIN', 'SUPADMIN')) {
    return router.createUrlTree(['/forbidden'], {
      queryParams: { reason: 'admin-required', from: state.url },
    });
  }

  return true;
};
