import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ActivationService, ActivationPreview } from './activation.service';
import { environment } from '../../../../environments/environment';

describe('ActivationService', () => {
  let service: ActivationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ActivationService],
    });
    service = TestBed.inject(ActivationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('preview: hace GET con token como query param', () => {
    const dto: ActivationPreview = {
      email_masked: 'ma***@dominio.com',
      missing_fields: ['phone'],
      expires_at: '2026-12-31T00:00:00',
      first_name: 'Maria',
    };
    service.preview('tk-1').subscribe(r => expect(r).toEqual(dto));

    const req = http.expectOne(`${environment.apiUrl}/api/v1/auth/activate/preview?token=tk-1`);
    expect(req.request.method).toBe('GET');
    req.flush(dto);
  });

  it('activate: hace POST con el payload completo', () => {
    service.activate({
      token: 'tk-1',
      password: 'Segura123',
      profile: { phone: '+51999111222' },
    }).subscribe(r => expect(r.token).toBe('JWT-OK'));

    const req = http.expectOne(`${environment.apiUrl}/api/v1/auth/activate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.token).toBe('tk-1');
    expect(req.request.body.password).toBe('Segura123');
    expect(req.request.body.profile.phone).toBe('+51999111222');
    req.flush({
      token: 'JWT-OK',
      refreshToken: 'RFR-OK',
      needsProfileCompletion: false,
    });
  });

  it('changePassword: envia current+new al endpoint', () => {
    service.changePassword('actual', 'Nueva123').subscribe(r => expect(r.status).toBe('ok'));

    const req = http.expectOne(`${environment.apiUrl}/api/v1/auth/change-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      current_password: 'actual',
      new_password: 'Nueva123',
    });
    req.flush({ status: 'ok', message: 'Updated' });
  });

  it('mapea HttpErrorResponse a Error con code/details', (done) => {
    service.activate({
      token: 'tk-x',
      password: 'Segura123',
    }).subscribe({
      next: () => done.fail('should error'),
      error: (err: Error & { code?: string; details?: any }) => {
        expect(err.message).toBe('Token invalido');
        expect(err.code).toBe('ACTIVATION_TOKEN_EXPIRED');
        expect(err.details?.minutes_ago).toBe(120);
        done();
      },
    });

    const req = http.expectOne(`${environment.apiUrl}/api/v1/auth/activate`);
    req.flush(
      { status: 'error', code: 'ACTIVATION_TOKEN_EXPIRED', message: 'Token invalido', details: { minutes_ago: 120 } },
      { status: 410, statusText: 'Gone' },
    );
  });
});
