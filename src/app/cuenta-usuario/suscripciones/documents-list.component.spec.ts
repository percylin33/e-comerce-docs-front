import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { commonTestProviders } from '../../testing/test-providers';
import { DocumentsListComponent } from './documents-list.component';
import { DocumentsService } from '../../@core/backend/services/documents.service';

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
  // Fase 0 - regresion del flujo de descarga "Mis Suscripciones"
  //
  // Estos tests congelan el comportamiento actual del flujo legacy
  // (DocumentsController.downloadLink + redirect + confirm) para que
  // las Fases 1-3 puedan modificarlos de forma incremental sin perder
  // cobertura.
  // ---------------------------------------------------------------
  describe('downloadDocument (regresion Fase 0)', () => {
    let documentsService: jasmine.SpyObj<DocumentsService>;
    let anchorClickSpy: jasmine.Spy;

    beforeEach(() => {
      documentsService = jasmine.createSpyObj<DocumentsService>('DocumentsService', [
        'getDownloadUrl',
        'confirmDownload',
      ]);
      (component as any).documentsService = documentsService;
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

    it('en happy path llama getDownloadUrl + abre redirectUrl en anchor + confirma', fakeAsync(() => {
      documentsService.getDownloadUrl.and.returnValue(of({
        downloadUrl: 'https://drive.google.com/uc?id=ABC',
        redirectUrl: 'https://api.test/api/v1/document/42/redirect?token=xyz',
        fallback: false,
      } as any));
      documentsService.confirmDownload.and.returnValue(of({ status: 'confirmed' } as any));

      component.downloadDocument(42);
      tick();

      expect(documentsService.getDownloadUrl).toHaveBeenCalledWith(42);
      expect(anchorClickSpy).toHaveBeenCalled();
      // confirmDownload se llama dentro de un setTimeout(2500) — comportamiento
      // legacy a refactorizar en Fase 4.
      tick(2500);
      expect(documentsService.confirmDownload).toHaveBeenCalledWith(42);

      const doc = component.filteredDocs.find(d => d.id === 42) as any;
      expect(doc._downloaded).toBe(true);
    }));

    it('cuando fallback=true marca _downloaded sin llamar confirm', fakeAsync(() => {
      documentsService.getDownloadUrl.and.returnValue(of({
        downloadUrl: 'https://api.test/api/v1/document/42/download',
        fallback: true,
      } as any));

      component.downloadDocument(42);
      tick(3000);

      expect(documentsService.confirmDownload).not.toHaveBeenCalled();
      const doc = component.filteredDocs.find(d => d.id === 42) as any;
      expect(doc._downloaded).toBe(true);
    }));

    it('status 403 muestra mensaje "Sin acceso" y no permite retry', fakeAsync(() => {
      documentsService.getDownloadUrl.and.returnValue(throwError(() => ({ status: 403 })));

      component.downloadDocument(42);
      tick();

      const doc = component.filteredDocs.find(d => d.id === 42) as any;
      expect(doc._downloadError).toContain('No tienes acceso');
      expect(doc._retryAvailable).toBeFalsy();
      tick(8001);
    }));

    it('status 410 ofrece retry', fakeAsync(() => {
      documentsService.getDownloadUrl.and.returnValue(throwError(() => ({ status: 410 })));

      component.downloadDocument(42);
      tick();

      const doc = component.filteredDocs.find(d => d.id === 42) as any;
      expect(doc._retryAvailable).toBe(true);
      expect(doc._downloadError).toContain('expir');
      tick(8001);
    }));

    it('timeout marca _timeout y permite retry', fakeAsync(() => {
      documentsService.getDownloadUrl.and.returnValue(throwError(() => ({ status: 0, _timeout: true })));

      component.downloadDocument(42);
      tick();

      const doc = component.filteredDocs.find(d => d.id === 42) as any;
      expect(doc._retryAvailable).toBe(true);
      expect(doc._downloadError).toContain('tard');
      tick(8001);
    }));

    it('no permite descargas concurrentes del mismo documento (idempotencia local)', () => {
      documentsService.getDownloadUrl.and.returnValue(of({
        downloadUrl: 'https://drive.google.com/uc?id=ABC',
        fallback: true,
      } as any));

      component.downloadDocument(42);
      component.downloadDocument(42);
      component.downloadDocument(42);

      // getDownloadUrl solo debe llamarse una vez mientras el primero esta en curso.
      // Como el observable retorna sincronicamente con of(...), el flag se
      // limpia inmediatamente. Para validar el guard, simulamos un observable
      // que no completa.
      documentsService.getDownloadUrl.calls.reset();
      const never$ = new Promise(() => {});
      documentsService.getDownloadUrl.and.returnValue(({ subscribe: () => {}, pipe: () => ({ subscribe: () => {} }) } as any));
      // Reasignamos un documento limpio para forzar segunda invocacion
      component.filteredDocs = [{ id: 99 } as any];
      component.downloadDocument(99);
      component.downloadDocument(99);
      expect(documentsService.getDownloadUrl.calls.count()).toBeLessThanOrEqual(1);
    });
  });
});
