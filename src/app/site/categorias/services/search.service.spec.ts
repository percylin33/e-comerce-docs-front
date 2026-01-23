import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { SearchService, SearchContext } from './search.service';
import { DocumentData, Document } from '../../../@core/interfaces/documents';
import { DocumentLoaderService } from './document-loader.service';
import { PaginationService } from './core/pagination.service';

describe('SearchService', () => {
  let service: SearchService;
  let mockDocumentData: jasmine.SpyObj<DocumentData>;
  let mockDocumentLoader: jasmine.SpyObj<DocumentLoaderService>;
  let mockPaginationService: jasmine.SpyObj<PaginationService>;
  let destroy$: Subject<void>;

  const mockDocument: Document = {
    id: 1,
    title: 'Test Document',
    category: 'PLANIFICACION',
    format: 'DOCX',
    imagenUrlPublic: 'http://example.com/image.jpg',
    documentoLibre: false
  } as Document;

  const baseContext: SearchContext = {
    categoria: 'PLANIFICACION',
    displayCategoria: 'PLANIFICACION',
    currentSubCategoria: 'EBOOKS'
  };

  beforeEach(() => {
    const documentDataSpy = jasmine.createSpyObj('DocumentData', ['getSearch', 'searchDocuments']);
    const documentLoaderSpy = jasmine.createSpyObj('DocumentLoaderService', ['processDocumentImage']);
    const paginationServiceSpy = jasmine.createSpyObj('PaginationService', ['getCurrentPage', 'getPageSize']);

    TestBed.configureTestingModule({
      providers: [
        SearchService,
        { provide: DocumentData, useValue: documentDataSpy },
        { provide: DocumentLoaderService, useValue: documentLoaderSpy },
        { provide: PaginationService, useValue: paginationServiceSpy }
      ]
    });

    service = TestBed.inject(SearchService);
    mockDocumentData = TestBed.inject(DocumentData) as jasmine.SpyObj<DocumentData>;
    mockDocumentLoader = TestBed.inject(DocumentLoaderService) as jasmine.SpyObj<DocumentLoaderService>;
    mockPaginationService = TestBed.inject(PaginationService) as jasmine.SpyObj<PaginationService>;
    
    destroy$ = new Subject<void>();

    // Default setup
    mockPaginationService.getCurrentPage.and.returnValue(1);
    mockPaginationService.getPageSize.and.returnValue(24);
    mockDocumentLoader.processDocumentImage.and.callFake((doc) => doc);
  });

  afterEach(() => {
    destroy$.next();
    destroy$.complete();
  });

  describe('searchWithFilters', () => {
    it('should execute search with filters', (done) => {
      const mockResponse = { 
        result: true, 
        status: 200, 
        data: [mockDocument],
        pagination: { paginaActual: 1, cantidadDePaginas: 1, cantidadDeDocumentos: 1, cantidadElementosPorPagina: 24 }
      };
      mockDocumentData.getSearch.and.returnValue(of(mockResponse));

      service.searchWithFilters('test search', baseContext, destroy$).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(mockDocumentData.getSearch).toHaveBeenCalledWith(
          jasmine.objectContaining({ title: 'test search' }),
          1,
          24
        );
        done();
      });
    });

    it('should include pagination parameters', (done) => {
      mockPaginationService.getCurrentPage.and.returnValue(3);
      mockPaginationService.getPageSize.and.returnValue(48);
      const mockResponse = { result: true, status: 200, data: [], pagination: {} as any };
      mockDocumentData.getSearch.and.returnValue(of(mockResponse));

      service.searchWithFilters('test', baseContext, destroy$).subscribe(() => {
        expect(mockDocumentData.getSearch).toHaveBeenCalledWith(
          jasmine.any(Object),
          3,
          48
        );
        done();
      });
    });
  });

  describe('searchDocuments', () => {
    it('should execute basic document search', (done) => {
      const mockResponse = { result: true, status: 200, data: [mockDocument], pagination: {} as any };
      mockDocumentData.searchDocuments.and.returnValue(of(mockResponse));

      service.searchDocuments('test search', destroy$).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(mockDocumentData.searchDocuments).toHaveBeenCalledWith('title', 'test search');
        done();
      });
    });
  });

  describe('buildSearchParams', () => {
    it('should build basic search params with title', () => {
      const params = service.buildSearchParams('test', baseContext);
      
      expect(params.title).toBe('test');
      expect(params.suscripcion).toBe('false');
    });

    it('should include selected filters', () => {
      const context: SearchContext = {
        ...baseContext,
        selectedNivel: 'PRIMARIA',
        selectedMateria: 'MATEMATICA',
        selectedGrado: '3'
      };

      const params = service.buildSearchParams('test', context);
      
      expect(params.nivel).toBe('PRIMARIA');
      expect(params.area).toBe('MATEMATICA');
      expect(params.grado).toBe('3');
    });

    it('should use documentoLibre for MATERIAL_GRATIS', () => {
      const context: SearchContext = { ...baseContext, categoria: 'MATERIAL_GRATIS' };
      const params = service.buildSearchParams('test', context);
      
      expect(params.documentoLibre).toBe('true');
      expect(params.category).toBeUndefined();
    });

    it('should use PLANIFICACION and ZIP for KITS', () => {
      const context: SearchContext = { ...baseContext, categoria: 'KITS' };
      const params = service.buildSearchParams('test', context);
      
      expect(params.category).toBe('PLANIFICACION');
      expect(params.format).toBe('ZIP');
    });

    it('should use currentSubCategoria for EBOOKS', () => {
      const context: SearchContext = { 
        ...baseContext, 
        categoria: 'EBOOKS',
        currentSubCategoria: 'EBOOKS'
      };
      const params = service.buildSearchParams('test', context);
      
      expect(params.category).toBe('EBOOKS');
      expect(params.format).toBeUndefined();
    });

    it('should use TALLERES format for EBOOKS with TALLERES subcategory', () => {
      const context: SearchContext = { 
        ...baseContext, 
        categoria: 'EBOOKS',
        currentSubCategoria: 'TALLERES'
      };
      const params = service.buildSearchParams('test', context);
      
      expect(params.category).toBe('TALLERES');
      expect(params.format).toBe('ZIP');
    });

    it('should use PLANIFICACION and DOCX for PLANIFICACION', () => {
      const context: SearchContext = { ...baseContext, categoria: 'PLANIFICACION' };
      const params = service.buildSearchParams('test', context);
      
      expect(params.category).toBe('PLANIFICACION');
      expect(params.format).toBe('DOCX');
    });

    it('should use PLANIFICACION and DOCX for SESIONES display category', () => {
      const context: SearchContext = { 
        ...baseContext, 
        categoria: 'KITS',
        displayCategoria: 'SESIONES'
      };
      const params = service.buildSearchParams('test', context);
      
      expect(params.category).toBe('PLANIFICACION');
      expect(params.format).toBe('DOCX');
    });

    it('should not specify format for REFORZAMIENTO', () => {
      const context: SearchContext = { ...baseContext, categoria: 'REFORZAMIENTO' };
      const params = service.buildSearchParams('test', context);
      
      expect(params.category).toBe('REFORZAMIENTO');
      expect(params.format).toBeUndefined();
    });

    it('should not specify format for PLAN_LECTOR', () => {
      const context: SearchContext = { ...baseContext, categoria: 'PLAN_LECTOR' };
      const params = service.buildSearchParams('test', context);
      
      expect(params.category).toBe('PLAN_LECTOR');
      expect(params.format).toBeUndefined();
    });

    it('should not specify format for TALLERES', () => {
      const context: SearchContext = { ...baseContext, categoria: 'TALLERES' };
      const params = service.buildSearchParams('test', context);
      
      expect(params.category).toBe('TALLERES');
      expect(params.format).toBeUndefined();
    });
  });

  describe('filterSearchResults', () => {
    it('should filter by documentoLibre for MATERIAL_GRATIS', () => {
      const freeDoc: Document = { ...mockDocument, documentoLibre: true } as Document;
      const paidDoc: Document = { ...mockDocument, documentoLibre: false } as Document;
      const response = { data: [freeDoc, paidDoc] };
      const context: SearchContext = { ...baseContext, categoria: 'MATERIAL_GRATIS' };

      const result = service.filterSearchResults(response, context);
      
      expect(result.length).toBe(1);
      expect(result[0].documentoLibre).toBe(true);
    });

    it('should filter PLANIFICACION category for KITS', () => {
      const planDoc: Document = { ...mockDocument, category: 'PLANIFICACION' } as Document;
      const otherDoc: Document = { ...mockDocument, category: 'RECURSOS' } as Document;
      const response = { data: [planDoc, otherDoc] };
      const context: SearchContext = { ...baseContext, categoria: 'KITS' };

      const result = service.filterSearchResults(response, context);
      
      expect(result.length).toBe(1);
      expect(result[0].category).toBe('PLANIFICACION');
    });

    it('should filter non-ZIP documents for PLANIFICACION', () => {
      const docxDoc: Document = { ...mockDocument, category: 'PLANIFICACION', format: 'DOCX' } as Document;
      const zipDoc: Document = { ...mockDocument, category: 'PLANIFICACION', format: 'ZIP' } as Document;
      const response = { data: [docxDoc, zipDoc] };
      const context: SearchContext = { ...baseContext, categoria: 'PLANIFICACION' };

      const result = service.filterSearchResults(response, context);
      
      expect(result.length).toBe(1);
      expect(result[0].format).toBe('DOCX');
    });

    it('should filter ZIP documents for KITS', () => {
      const zipDoc: Document = { ...mockDocument, category: 'PLANIFICACION', format: 'ZIP' } as Document;
      const docxDoc: Document = { ...mockDocument, category: 'PLANIFICACION', format: 'DOCX' } as Document;
      const response = { data: [zipDoc, docxDoc] };
      const context: SearchContext = { ...baseContext, categoria: 'KITS' };

      const result = service.filterSearchResults(response, context);
      
      expect(result.length).toBe(1);
      expect(result[0].format).toBe('ZIP');
    });

    it('should allow all formats for TALLERES', () => {
      const zipDoc: Document = { ...mockDocument, category: 'TALLERES', format: 'ZIP' } as Document;
      const pdfDoc: Document = { ...mockDocument, category: 'TALLERES', format: 'PDF' } as Document;
      const response = { data: [zipDoc, pdfDoc] };
      const context: SearchContext = { ...baseContext, categoria: 'TALLERES' };

      const result = service.filterSearchResults(response, context);
      
      expect(result.length).toBe(2);
    });

    it('should filter non-ZIP for other categories', () => {
      const docxDoc: Document = { ...mockDocument, category: 'EVALUACION', format: 'DOCX' } as Document;
      const zipDoc: Document = { ...mockDocument, category: 'EVALUACION', format: 'ZIP' } as Document;
      const response = { data: [docxDoc, zipDoc] };
      const context: SearchContext = { ...baseContext, categoria: 'EVALUACION' };

      const result = service.filterSearchResults(response, context);
      
      expect(result.length).toBe(1);
      expect(result[0].format).toBe('DOCX');
    });
  });

  describe('processSearchResponse', () => {
    it('should process documents and extract suggestions', () => {
      const doc1: Document = { ...mockDocument, id: 1, title: 'Doc 1' } as Document;
      const doc2: Document = { ...mockDocument, id: 2, title: 'Doc 2' } as Document;
      const response = { 
        data: [doc1, doc2],
        pagination: { cantidadDeDocumentos: 2 }
      };

      const result = service.processSearchResponse(response, baseContext);
      
      expect(result.documents.length).toBe(2);
      expect(result.suggestions).toEqual(['Doc 1', 'Doc 2']);
      expect(result.hasResults).toBe(true);
      expect(result.totalCount).toBe(2);
      expect(mockDocumentLoader.processDocumentImage).toHaveBeenCalledTimes(2);
    });

    it('should indicate no results when empty', () => {
      const response = { data: [], pagination: { cantidadDeDocumentos: 0 } };

      const result = service.processSearchResponse(response, baseContext);
      
      expect(result.documents.length).toBe(0);
      expect(result.suggestions.length).toBe(0);
      expect(result.hasResults).toBe(false);
      expect(result.totalCount).toBe(0);
    });

    it('should use data length when pagination is missing', () => {
      const response = { data: [mockDocument, mockDocument, mockDocument] };

      const result = service.processSearchResponse(response, baseContext);
      
      expect(result.totalCount).toBe(3);
    });
  });

  describe('processFilteredSearchResponse', () => {
    it('should filter and process search results', () => {
      const docxDoc: Document = { ...mockDocument, category: 'PLANIFICACION', format: 'DOCX', title: 'DOCX Doc' } as Document;
      const zipDoc: Document = { ...mockDocument, category: 'PLANIFICACION', format: 'ZIP', title: 'ZIP Doc' } as Document;
      const response = { 
        data: [docxDoc, zipDoc],
        pagination: { cantidadDeDocumentos: 2 }
      };
      const context: SearchContext = { ...baseContext, categoria: 'PLANIFICACION' };

      const result = service.processFilteredSearchResponse(response, context);
      
      expect(result.documents.length).toBe(1);
      expect(result.documents[0].format).toBe('DOCX');
      expect(result.suggestions).toEqual(['DOCX Doc']);
      expect(result.hasResults).toBe(true);
    });

    it('should process all documents for categories with no format restriction', () => {
      const doc1: Document = { ...mockDocument, category: 'TALLERES', format: 'ZIP', title: 'Doc 1' } as Document;
      const doc2: Document = { ...mockDocument, category: 'TALLERES', format: 'PDF', title: 'Doc 2' } as Document;
      const response = { 
        data: [doc1, doc2],
        pagination: { cantidadDeDocumentos: 2 }
      };
      const context: SearchContext = { ...baseContext, categoria: 'TALLERES' };

      const result = service.processFilteredSearchResponse(response, context);
      
      expect(result.documents.length).toBe(2);
      expect(result.suggestions.length).toBe(2);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return true when nivel is selected', () => {
      const context: SearchContext = { ...baseContext, selectedNivel: 'PRIMARIA' };
      expect(service.hasActiveFilters(context)).toBe(true);
    });

    it('should return true when materia is selected', () => {
      const context: SearchContext = { ...baseContext, selectedMateria: 'MATEMATICA' };
      expect(service.hasActiveFilters(context)).toBe(true);
    });

    it('should return true when grado is selected', () => {
      const context: SearchContext = { ...baseContext, selectedGrado: '3' };
      expect(service.hasActiveFilters(context)).toBe(true);
    });

    it('should return false when no filters are selected', () => {
      expect(service.hasActiveFilters(baseContext)).toBe(false);
    });

    it('should return true when multiple filters are selected', () => {
      const context: SearchContext = {
        ...baseContext,
        selectedNivel: 'PRIMARIA',
        selectedMateria: 'MATEMATICA',
        selectedGrado: '3'
      };
      expect(service.hasActiveFilters(context)).toBe(true);
    });
  });
});
