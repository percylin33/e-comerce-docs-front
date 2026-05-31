import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { commonTestProviders } from '../../testing/test-providers';
import { DocumentsListComponent } from './documents-list.component';
import { DownloadSessionService } from '../../@core/services/download-session.service';

describe('DocumentsListComponent', () => {
  let component: DocumentsListComponent;
  let fixture: ComponentFixture<DocumentsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [DocumentsListComponent],
      providers: [...commonTestProviders()]
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentsListComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('flattens nested documents and paginates', () => {
    component.pageSize = 2;
    component.documents = {
      'Unidad 1': {
        'Materia A': { 'Grado I': [ { title: 'Doc1', fileUrlPublic: 'url1' }, { title: 'Doc2', fileUrlPublic: 'url2' } ] },
        'Materia B': { 'Grado I': [ { title: 'Doc3', fileUrlPublic: 'url3' } ] }
      },
      'Unidad 2': {
        'Materia C': { 'Grado II': [ { title: 'Doc4', fileUrlPublic: 'url4' } ] }
      }
    };

    component.ngOnChanges();
    // Component auto-selects the first unit/subject/grade; in this dataset
    // that resolves to Unidad 1 -> Materia A -> Grado I (2 docs)
    expect(component.filteredDocs.length).toBe(2);
    expect(component.totalPages).toBe(1);
    expect(component.paged.length).toBe(2);
    // nextPage should not advance when there's only one page
    component.nextPage();
    expect(component.currentPage).toBe(1);
    expect(component.paged.length).toBe(2);
  });

  // ---------------------------------------------------------------
  // downloadDocument: flujo unificado por sesiones (POST /sessions -> /file).
  //
  // Tras eliminar el flujo legacy V1 (getDownloadUrl + confirmDownload) en
  // el back y el feature flag en el front, este es el unico camino.
  // ---------------------------------------------------------------
  describe('downloadDocument (sesiones unificadas)', () => {
    let sessionsService: jasmine.SpyObj<DownloadSessionService>;
    let anchorClickSpy: jasmine.Spy;

    beforeEach(() => {
      sessionsService = jasmine.createSpyObj<DownloadSessionService>('DownloadSessionService', ['createSession']);
      (component as any).sessionsService = sessionsService;
      component.filteredDocs = [{ id: 42, title: 'Mi doc' } as any];

      // Espia el click del anchor que el componente crea dinamicamente.
      const realCreate = document.createElement.bind(document);
      spyOn(document, 'createElement').and.callFake((tag: string) => {
        const el = realCreate(tag);
        if (tag === 'a') {
          anchorClickSpy = spyOn(el as HTMLAnchorElement, 'click').and.stub();
        }
        return el;
      });
    });

    it('en happy path crea sesion y dispara downloadUrl en anchor (sin confirmDownload aparte)', fakeAsync(() => {
      sessionsService.createSession.and.returnValue(of({
        sessionId: 'abc',
        fileName: 'doc.pdf',
        fileSize: 100,
        mimeType: 'application/pdf',
        downloadUrl: 'http://localhost:8080/api/v1/downloads/abc/file',
        expiresAt: '2025-01-01T00:00:00Z',
        intent: 'DOWNLOAD',
      } as any));

      component.downloadDocument(42);
      tick();

      expect(sessionsService.createSession).toHaveBeenCalledWith({ documentId: 42, intent: 'DOWNLOAD' });
      expect(anchorClickSpy).toHaveBeenCalled();

      const doc = component.filteredDocs.find(d => d.id === 42) as any;
      expect(doc._downloaded).toBe(true);
    }));

    it('status 403 muestra mensaje "Sin acceso" y no permite retry', fakeAsync(() => {
      sessionsService.createSession.and.returnValue(throwError(() => ({ status: 403 })));

      component.downloadDocument(42);
      tick();

      const doc = component.filteredDocs.find(d => d.id === 42) as any;
      expect(doc._downloadError).toContain('No tienes acceso');
      expect(doc._retryAvailable).toBeFalsy();
      tick(8001);
    }));

    it('status 410 ofrece retry', fakeAsync(() => {
      sessionsService.createSession.and.returnValue(throwError(() => ({ status: 410 })));

      component.downloadDocument(42);
      tick();

      const doc = component.filteredDocs.find(d => d.id === 42) as any;
      expect(doc._retryAvailable).toBe(true);
      expect(doc._downloadError).toContain('expir');
      tick(8001);
    }));

    it('status 429 muestra "Demasiadas descargas" y permite retry', fakeAsync(() => {
      sessionsService.createSession.and.returnValue(throwError(() => ({ status: 429 })));

      component.downloadDocument(42);
      tick();

      const doc = component.filteredDocs.find(d => d.id === 42) as any;
      expect(doc._retryAvailable).toBe(true);
      expect(doc._downloadError).toContain('Demasiadas');
      tick(8001);
    }));

    it('timeout marca _timeout y permite retry', fakeAsync(() => {
      sessionsService.createSession.and.returnValue(throwError(() => ({ status: 0, _timeout: true })));

      component.downloadDocument(42);
      tick();

      const doc = component.filteredDocs.find(d => d.id === 42) as any;
      expect(doc._retryAvailable).toBe(true);
      expect(doc._downloadError).toContain('tard');
      tick(8001);
    }));

    it('no permite descargas concurrentes del mismo documento (idempotencia local)', () => {
      // Observable que no completa, para que el lock interno permanezca activo.
      sessionsService.createSession.and.returnValue(({ pipe: () => ({ subscribe: () => {} }) } as any));

      component.downloadDocument(42);
      component.downloadDocument(42);
      component.downloadDocument(42);

      // createSession solo debe llamarse una vez mientras el primero esta en curso.
      expect(sessionsService.createSession.calls.count()).toBeLessThanOrEqual(1);
    });
  });
});
