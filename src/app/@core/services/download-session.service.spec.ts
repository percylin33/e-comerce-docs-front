import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { CreatedSession, DownloadSessionService, SessionManifest } from './download-session.service';

describe('DownloadSessionService (Fase 3b)', () => {
  let service: DownloadSessionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DownloadSessionService],
    });
    service = TestBed.inject(DownloadSessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('createSession envia documentId + intent y emite la sesion creada', () => {
    const expected: CreatedSession = {
      sessionId: 'abc-123',
      fileName: 'doc.pdf',
      fileSize: 12345,
      mimeType: 'application/pdf',
      downloadUrl: `${environment.apiUrl}/api/v1/downloads/abc-123/file`,
      expiresAt: '2025-01-01T00:00:00Z',
      intent: 'DOWNLOAD',
    };

    let received: CreatedSession | undefined;
    service.createSession({ documentId: 42 }).subscribe(s => (received = s));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/downloads/sessions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ documentId: 42, intent: 'DOWNLOAD' });
    req.flush(expected);

    expect(received).toEqual(expected);
  });

  it('createSession respeta intent=PREVIEW', () => {
    service.createSession({ documentId: 7, intent: 'PREVIEW' }).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/downloads/sessions`);
    expect(req.request.body.intent).toBe('PREVIEW');
    req.flush({});
  });

  it('getManifest hace GET al endpoint manifest', () => {
    const exp: SessionManifest = {
      sessionId: 'x',
      fileName: 'a.pdf',
      fileSize: 1,
      mimeType: 'application/pdf',
      expiresAt: '2025-01-01T00:00:00Z',
    };
    let res: SessionManifest | undefined;
    service.getManifest('x').subscribe(m => (res = m));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/downloads/x/manifest`);
    expect(req.request.method).toBe('GET');
    req.flush(exp);
    expect(res).toEqual(exp);
  });

  it('buildFileUrl genera la URL absoluta del backend', () => {
    expect(service.buildFileUrl('s-1')).toBe(`${environment.apiUrl}/api/v1/downloads/s-1/file`);
  });
});
