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

  describe('downloadWithProgress (Fase 4 UX)', () => {
    function mockFetch(body: string, contentLength: number | null, contentDisposition: string | null) {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(body);
      const headers: Record<string, string> = { 'Content-Type': 'application/pdf' };
      if (contentLength !== null) headers['Content-Length'] = String(contentLength);
      if (contentDisposition !== null) headers['Content-Disposition'] = contentDisposition;

      let i = 0;
      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          if (i >= bytes.length) { controller.close(); return; }
          const chunkSize = Math.min(8, bytes.length - i);
          controller.enqueue(bytes.slice(i, i + chunkSize));
          i += chunkSize;
        }
      });

      return Promise.resolve({
        ok: true,
        body: stream,
        headers: {
          get: (k: string) => headers[k] ?? null,
        },
        blob: () => Promise.resolve(new Blob([bytes], { type: 'application/pdf' })),
        status: 200,
        statusText: 'OK',
      } as unknown as Response);
    }

    it('reporta progreso loaded/total y dispara la descarga via anchor', async () => {
      spyOn(window, 'fetch').and.callFake(() =>
        mockFetch('hello world payload de prueba', 27, "attachment; filename=\"doc.pdf\"")
      );
      // Evitamos navegacion real
      const clickSpy = jasmine.createSpy('click');
      const realCreate = document.createElement.bind(document);
      spyOn(document, 'createElement').and.callFake((tag: any) => {
        const el: any = realCreate(tag);
        if (tag === 'a') el.click = clickSpy;
        return el;
      });
      const progress: Array<[number, number]> = [];
      await service.downloadWithProgress(
        `${environment.apiUrl}/api/v1/downloads/x/file`,
        'fallback.pdf',
        (loaded, total) => progress.push([loaded, total]),
      );

      // Al menos un tick reportado y siempre con total=27
      expect(progress.length).toBeGreaterThan(0);
      expect(progress[progress.length - 1][0]).toBe(27);
      expect(progress[progress.length - 1][1]).toBe(27);
      expect(clickSpy).toHaveBeenCalled();
    });

    it('cuando no hay Content-Length reporta total=-1 durante el streaming', async () => {
      spyOn(window, 'fetch').and.callFake(() => mockFetch('abcdef', null, null));
      const realCreate = document.createElement.bind(document);
      spyOn(document, 'createElement').and.callFake((tag: any) => {
        const el: any = realCreate(tag);
        if (tag === 'a') el.click = () => {};
        return el;
      });
      const progress: Array<[number, number]> = [];
      await service.downloadWithProgress(
        `${environment.apiUrl}/api/v1/downloads/x/file`,
        'fallback.pdf',
        (loaded, total) => progress.push([loaded, total]),
      );
      // El primer tick debe tener total=-1; el ultimo tick (post stream) usa loaded como total
      expect(progress[0][1]).toBe(-1);
      expect(progress[progress.length - 1][1]).toBe(6);
    });

    it('respeta nombre RFC 5987 del header filename*=UTF-8\'\'...', async () => {
      spyOn(window, 'fetch').and.callFake(() =>
        mockFetch('payload', 7, "attachment; filename=\"fallback.pdf\"; filename*=UTF-8''Documento%20Espa%C3%B1ol.pdf")
      );
      let downloadedAs: string | null = null;
      const realCreate = document.createElement.bind(document);
      spyOn(document, 'createElement').and.callFake((tag: any) => {
        const el: any = realCreate(tag);
        if (tag === 'a') {
          Object.defineProperty(el, 'download', {
            set: (v: string) => { downloadedAs = v; },
            get: () => downloadedAs,
          });
          el.click = () => {};
        }
        return el;
      });
      await service.downloadWithProgress(
        `${environment.apiUrl}/api/v1/downloads/x/file`,
        'fallback.pdf',
        () => {},
      );
      expect(downloadedAs).toBe('Documento Español.pdf');
    });
  });
});
