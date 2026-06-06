import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Guard que bloquea el acceso a la ruta si no hay usuario autenticado
 * (entrada `currentUser` en localStorage). Usado para `/site/checkout`
 * y rutas relacionadas con cobros: el backend ya rechaza estos endpoints
 * con 401, pero queremos evitar que el usuario llegue al formulario y
 * se gaste el tiempo llenándolo.
 *
 * <p>P3-1 del plan: el checkout deja de aceptar invitados. Cualquier
 * compra DEBE estar asociada a un usuario registrado.</p>
 *
 * <p>La ruta real de login en esta app es {@code /autenticacion/login}
 * (ver {@code app-routing.module.ts}). El AuthInterceptor usa la misma
 * cuando un refresh-token falla, así que esto mantiene la UX consistente.</p>
 */
export const authRequiredGuard: CanActivateFn = (_route, state) => {
    const router = inject(Router);
    const goLogin = (returnUrl?: string) => {
        router.navigate(['/autenticacion/login'], {
            queryParams: returnUrl ? { returnUrl } : undefined,
            replaceUrl: true,
        });
    };
    try {
        const currentUser = typeof window !== 'undefined'
            ? localStorage.getItem('currentUser')
            : null;
        if (!currentUser) {
            goLogin(state.url || '/site/home');
            return false;
        }
        return true;
    } catch (_) {
        goLogin();
        return false;
    }
};
