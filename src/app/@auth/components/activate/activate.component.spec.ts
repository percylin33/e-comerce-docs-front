import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { ActivateComponent } from './activate.component';
import { ActivationService } from './activation.service';
import { TokenService } from '../token.service';
import { SharedService } from '../shared.service';

class FakeActivationService {
  preview = jasmine.createSpy('preview');
  activate = jasmine.createSpy('activate');
  changePassword = jasmine.createSpy('changePassword');
}

class FakeTokenService {
  setToken = jasmine.createSpy('setToken');
  setRefreshToken = jasmine.createSpy('setRefreshToken');
  getTokenString = jasmine.createSpy('getTokenString').and.returnValue('');
}

class FakeSharedService {
  setUser = jasmine.createSpy('setUser');
  setAuthenticated = jasmine.createSpy('setAuthenticated');
}

describe('ActivateComponent', () => {
  let fixture: ComponentFixture<ActivateComponent>;
  let component: ActivateComponent;
  let activationService: FakeActivationService;
  let router: Router;

  function setup(token: string | null = 'tk-1') {
    TestBed.configureTestingModule({
      imports: [ActivateComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: ActivationService, useClass: FakeActivationService },
        { provide: TokenService, useClass: FakeTokenService },
        { provide: SharedService, useClass: FakeSharedService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(token ? { token } : {}),
            },
          },
        },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
      ],
    });
    fixture = TestBed.createComponent(ActivateComponent);
    component = fixture.componentInstance;
    activationService = TestBed.inject(ActivationService) as unknown as FakeActivationService;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
  }

  it('sin token: queda en step invalid', () => {
    setup(null);
    fixture.detectChanges();
    expect(component.step).toBe('invalid');
    expect(component.errorTitle).toContain('invalido');
  });

  it('preview OK: arma formulario con campos faltantes y queda step=form', () => {
    setup('tk-1');
    activationService.preview.and.returnValue(of({
      email_masked: 'ma***@dom.com',
      missing_fields: ['phone', 'documento_tipo', 'documento_numero'],
      expires_at: '2026-12-31',
      first_name: 'Maria',
    }));
    fixture.detectChanges();
    expect(component.step).toBe('form');
    expect(component.preview?.email_masked).toBe('ma***@dom.com');
    expect(component.showField('phone')).toBe(true);
    expect(component.showField('firstname')).toBe(false);
    expect(component.form.get('phone')?.hasValidator).toBeDefined();
  });

  it('preview con token expirado: queda step=expired', () => {
    setup('tk-1');
    const err = new Error('expired') as Error & { code?: string };
    err.code = 'ACTIVATION_TOKEN_EXPIRED';
    activationService.preview.and.returnValue(throwError(() => err));
    fixture.detectChanges();
    expect(component.step).toBe('expired');
    expect(component.errorTitle).toContain('expirado');
  });

  it('preview con error generico: queda step=invalid con el mensaje', () => {
    setup('tk-1');
    const err = new Error('oops') as Error & { code?: string };
    err.code = 'INTERNAL_ERROR';
    activationService.preview.and.returnValue(throwError(() => err));
    fixture.detectChanges();
    expect(component.step).toBe('invalid');
    expect(component.errorMessage).toBe('oops');
  });

  it('submit valido: llama activate y navega a /site/home', fakeAsync(() => {
    setup('tk-1');
    activationService.preview.and.returnValue(of({
      email_masked: 'ma***@dom.com',
      missing_fields: ['phone'],
      expires_at: '2026-12-31',
    }));
    activationService.activate.and.returnValue(of({
      token: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJjQGNkaWcuY29tIn0.', // dummy header.payload.signature
      refreshToken: 'RFR',
      needsProfileCompletion: false,
    }));
    fixture.detectChanges();

    component.form.patchValue({
      newPassword: 'Segura123',
      confirmPassword: 'Segura123',
      phone: '+51999111222',
    });
    component.submit();
    tick();

    expect(activationService.activate).toHaveBeenCalled();
    const arg = activationService.activate.calls.mostRecent().args[0];
    expect(arg.token).toBe('tk-1');
    expect(arg.password).toBe('Segura123');
    expect(arg.profile.phone).toBe('+51999111222');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/site/home', { replaceUrl: true });
  }));

  it('submit con passwords distintas: no llama activate', () => {
    setup('tk-1');
    activationService.preview.and.returnValue(of({
      email_masked: 'm***@d.com',
      missing_fields: [],
      expires_at: '2026-12-31',
    }));
    fixture.detectChanges();
    component.form.patchValue({
      newPassword: 'Segura123',
      confirmPassword: 'OtraDistinta1',
    });
    component.submit();
    expect(activationService.activate).not.toHaveBeenCalled();
  });

  it('submit con password debil: no llama activate', () => {
    setup('tk-1');
    activationService.preview.and.returnValue(of({
      email_masked: 'm***@d.com',
      missing_fields: [],
      expires_at: '2026-12-31',
    }));
    fixture.detectChanges();
    component.form.patchValue({
      newPassword: 'simple',
      confirmPassword: 'simple',
    });
    component.submit();
    expect(activationService.activate).not.toHaveBeenCalled();
    expect(component.form.get('newPassword')?.errors).toBeTruthy();
  });

  it('submit con error PROFILE_INCOMPLETE: muestra missing_fields en submitError', fakeAsync(() => {
    setup('tk-1');
    activationService.preview.and.returnValue(of({
      email_masked: 'm***@d.com',
      missing_fields: ['phone'],
      expires_at: '2026-12-31',
    }));
    fixture.detectChanges();
    component.form.patchValue({
      newPassword: 'Segura123',
      confirmPassword: 'Segura123',
      phone: '+51999111222',
    });
    const err = new Error('Faltan datos') as Error & { code?: string; details?: any };
    err.code = 'PROFILE_INCOMPLETE';
    err.details = { missing_fields: ['lastname', 'phone'] };
    activationService.activate.and.returnValue(throwError(() => err));
    component.submit();
    tick();
    expect(component.submitError).toContain('Faltan datos');
    expect(component.submitError).toContain('lastname, phone');
    expect(component.loadingSubmit).toBe(false);
  }));
});
