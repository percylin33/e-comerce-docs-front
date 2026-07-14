import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { adminGuard, creatorGuard, getCurrentUser, hasRole } from './creator.guard';

/**
 * Tests unitarios para los guards del modulo Creadores (Mejora M6).
 *
 * <p>Valida los 4 caminos:</p>
 * <ul>
 *   <li>Sin sesion -> redirect a login.</li>
 *   <li>Con rol correcto -> permite pasar.</li>
 *   <li>Con rol incorrecto -> redirect a /forbidden.</li>
 *   <li>JSON malformado en localStorage -> tratado como sin sesion.</li>
 * </ul>
 */
describe('Guards del modulo Creadores', () => {
  let mockRouter: { createUrlTree: jasmine.Spy };

  const fakeRoute = {} as ActivatedRouteSnapshot;
  const fakeState = { url: '/dashboard-creadores/dashboard' } as RouterStateSnapshot;

  beforeEach(() => {
    localStorage.clear();
    mockRouter = { createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({} as UrlTree) };
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  // ============ helpers ============

  function setUser(user: object | null) {
    if (user === null) localStorage.removeItem('currentUser');
    else localStorage.setItem('currentUser', JSON.stringify(user));
  }

  // ============ getCurrentUser / hasRole ============

  it('getCurrentUser devuelve null cuando no hay item en localStorage', () => {
    expect(getCurrentUser()).toBeNull();
  });

  it('getCurrentUser devuelve null cuando JSON esta malformado', () => {
    localStorage.setItem('currentUser', 'no es json');
    expect(getCurrentUser()).toBeNull();
  });

  it('hasRole devuelve true cuando el rol esta en la lista', () => {
    expect(hasRole({ roles: ['CREATOR', 'USER'] }, 'CREATOR')).toBe(true);
    expect(hasRole({ roles: ['ADMIN'] }, 'ADMIN', 'SUPADMIN')).toBe(true);
  });

  it('hasRole devuelve false cuando ningun rol coincide', () => {
    expect(hasRole({ roles: ['USER'] }, 'CREATOR')).toBe(false);
    expect(hasRole(null, 'CREATOR')).toBe(false);
  });

  // ============ creatorGuard ============

  describe('creatorGuard', () => {
    it('sin sesion -> redirige a /autenticacion/login', () => {
      TestBed.runInInjectionContext(() => {
        const result = creatorGuard(fakeRoute, fakeState);
        expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/autenticacion/login'],
          jasmine.objectContaining({ queryParams: jasmine.objectContaining({ returnUrl: fakeState.url }) }));
        expect(result).not.toBe(true);
      });
    });

    it('con rol CREATOR -> permite pasar', () => {
      setUser({ id: 1, roles: ['CREATOR'] });
      TestBed.runInInjectionContext(() => {
        const result = creatorGuard(fakeRoute, fakeState);
        expect(result).toBe(true);
        expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
      });
    });

    it('con rol ADMIN pero no CREATOR -> redirige a /forbidden', () => {
      setUser({ id: 1, roles: ['ADMIN'] });
      TestBed.runInInjectionContext(() => {
        const result = creatorGuard(fakeRoute, fakeState);
        expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/forbidden'],
          jasmine.objectContaining({ queryParams: jasmine.objectContaining({ reason: 'creator-required' }) }));
        expect(result).not.toBe(true);
      });
    });

    it('con roles vacios -> redirige a /forbidden', () => {
      setUser({ id: 1, roles: [] });
      TestBed.runInInjectionContext(() => {
        const result = creatorGuard(fakeRoute, fakeState);
        expect(mockRouter.createUrlTree).toHaveBeenCalled();
        expect(result).not.toBe(true);
      });
    });
  });

  // ============ adminGuard ============

  describe('adminGuard', () => {
    it('sin sesion -> redirige a login', () => {
      TestBed.runInInjectionContext(() => {
        adminGuard(fakeRoute, fakeState);
        expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/autenticacion/login'], jasmine.any(Object));
      });
    });

    it('con rol ADMIN -> permite pasar', () => {
      setUser({ id: 1, roles: ['ADMIN'] });
      TestBed.runInInjectionContext(() => {
        const result = adminGuard(fakeRoute, fakeState);
        expect(result).toBe(true);
      });
    });

    it('con rol SUPADMIN -> permite pasar', () => {
      setUser({ id: 1, roles: ['SUPADMIN'] });
      TestBed.runInInjectionContext(() => {
        const result = adminGuard(fakeRoute, fakeState);
        expect(result).toBe(true);
      });
    });

    it('con rol CREATOR pero no ADMIN -> redirige a /forbidden', () => {
      setUser({ id: 1, roles: ['CREATOR'] });
      TestBed.runInInjectionContext(() => {
        adminGuard(fakeRoute, fakeState);
        expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/forbidden'],
          jasmine.objectContaining({ queryParams: jasmine.objectContaining({ reason: 'admin-required' }) }));
      });
    });

    it('con rol USER basico -> redirige a /forbidden', () => {
      setUser({ id: 1, roles: ['USER'] });
      TestBed.runInInjectionContext(() => {
        adminGuard(fakeRoute, fakeState);
        expect(mockRouter.createUrlTree).toHaveBeenCalled();
      });
    });
  });
});
