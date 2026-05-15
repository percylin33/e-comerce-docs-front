import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { DocumentLoaderService } from './document-loader.service';
import { DocumentData, Document } from '../../../@core/interfaces/documents';
import { DocumentCacheService } from './document-cache.service';
import { PaginationService } from './core/pagination.service';
import { CategoryConfigService } from './category-config.service';
import { FilterParams } from '../categorias.component';

describe('DocumentLoaderService', () => {
  let service: DocumentLoaderService;
  let mockDocumentData: jasmine.SpyObj<DocumentData>;
  let mockCacheService: jasmine.SpyObj<DocumentCacheService>;
  let mockPaginationService: jasmine.SpyObj<PaginationService>;
  let mockConfigService: jasmine.SpyObj<CategoryConfigService>;
  let destroy$: Subject<void>;

  const mockDocument: Document = {
    id: 1,
    title: 'Test Document',
    category: 'PLANIFICACION',
    format: 'DOCX',
    imagenUrlPublic: 'http://example.com/image1.jpg'
  } as Document;

  const mockDocumentWithPipeUrls: Document = {
    id: 2,
    title: 'Test Document 2',
    category: 'EBOOKS',
    format: 'PDF',
    imagenUrlPublic: 'http://example.com/image1.jpg|http://example.com/image2.jpg|http://example.com/image3.jpg'
  } as Document;

  beforeEach(() => {
    const documentDataSpy = jasmine.createSpyObj('DocumentData', ['getDocumentFree', 'filterDocuments']);
    const cacheServiceSpy = jasmine.createSpyObj('DocumentCacheService', ['generateKey', 'get']);
    const paginationServiceSpy = jasmine.createSpyObj('PaginationService', ['getCurrentPage', 'getPageSize']);
    const configServiceSpy = jasmine.createSpyObj('CategoryConfigService', ['getDescription']);

    TestBed.configureTestingModule({
      providers: [
        DocumentLoaderService,
        { provide: DocumentData, useValue: documentDataSpy },
        { provide: DocumentCacheService, useValue: cacheServiceSpy },
        { provide: PaginationService, useValue: paginationServiceSpy },
        { provide: CategoryConfigService, useValue: configServiceSpy }
      ]
    });

    service = TestBed.inject(DocumentLoaderService);
    mockDocumentData = TestBed.inject(DocumentData) as jasmine.SpyObj<DocumentData>;
    mockCacheService = TestBed.inject(DocumentCacheService) as jasmine.SpyObj<DocumentCacheService>;
    mockPaginationService = TestBed.inject(PaginationService) as jasmine.SpyObj<PaginationService>;
    mockConfigService = TestBed.inject(CategoryConfigService) as jasmine.SpyObj<CategoryConfigService>;
    
    destroy$ = new Subject<void>();

    // Default pagination setup
    mockPaginationService.getCurrentPage.and.returnValue(1);
    mockPaginationService.getPageSize.and.returnValue(24);
  });

  afterEach(() => {
    destroy$.next();
    destroy$.complete();
  });

  describe('loadDocuments', () => {
    it('should load free documents for MATERIAL_GRATIS category', (done) => {
      const mockResponse = { 
        result: true, 
        status: 200, 
        data: [mockDocument],
        pagination: { paginaActual: 1, cantidadDePaginas: 1, cantidadDeDocumentos: 1, cantidadElementosPorPagina: 24 }
      };
      mockDocumentData.getDocumentFree.and.returnValue(of(mockResponse));

      service.loadDocuments({}, 'MATERIAL_GRATIS', destroy$).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(mockDocumentData.getDocumentFree).toHaveBeenCalled();
        expect(mockDocumentData.filterDocuments).not.toHaveBeenCalled();
        done();
      });
    });

    it('should load regular documents with caching for other categories', (done) => {
      const params: FilterParams = { category: 'PLANIFICACION', format: 'DOCX' };
      const mockResponse = { 
        result: true, 
        status: 200, 
        data: [mockDocument], 
        pagination: { paginaActual: 1, cantidadDePaginas: 1, cantidadDeDocumentos: 1, cantidadElementosPorPagina: 24 }
      };
      const cacheKey = 'test-cache-key';

      mockCacheService.generateKey.and.returnValue(cacheKey);
      mockDocumentData.filterDocuments.and.returnValue(of(mockResponse));
      mockCacheService.get.and.returnValue(of(mockResponse));

      service.loadDocuments(params, 'PLANIFICACION', destroy$).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(mockCacheService.generateKey).toHaveBeenCalledWith('initial-load', {
          category: 'PLANIFICACION',
          format: 'DOCX',
          page: '1'
        });
        expect(mockCacheService.get).toHaveBeenCalled();
        done();
      });
    });

    it('should handle errors when loading documents', (done) => {
      const error = new Error('Load error');
      mockDocumentData.getDocumentFree.and.returnValue(throwError(() => error));

      service.loadDocuments({}, 'MATERIAL_GRATIS', destroy$).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        }
      });
    });
  });

  describe('processInitialLoad', () => {
    it('should return all documents for MATERIAL_GRATIS', () => {
      const response = { 
        result: true, 
        status: 200, 
        data: [mockDocument, mockDocumentWithPipeUrls],
        pagination: { paginaActual: 1, cantidadDePaginas: 1, cantidadDeDocumentos: 2, cantidadElementosPorPagina: 24 }
      };
      const result = service.processInitialLoad(response, 'MATERIAL_GRATIS', 'EBOOKS');
      
      expect(result.length).toBe(2);
      expect(result).toEqual(response.data);
    });

    it('should filter non-ZIP documents for PLANIFICACION', () => {
      const zipDoc: Document = { ...mockDocument, format: 'ZIP', category: 'PLANIFICACION' } as Document;
      const docxDoc: Document = { ...mockDocument, format: 'DOCX', category: 'PLANIFICACION' } as Document;
      const response = { data: [zipDoc, docxDoc] };
      
      const result = service.processInitialLoad(response, 'PLANIFICACION', 'EBOOKS');
      
      expect(result.length).toBe(1);
      expect(result[0].format).toBe('DOCX');
    });

    it('should filter ZIP PLANIFICACION documents for KITS', () => {
      const zipPlanDoc: Document = { ...mockDocument, format: 'ZIP', category: 'PLANIFICACION' } as Document;
      const docxPlanDoc: Document = { ...mockDocument, format: 'DOCX', category: 'PLANIFICACION' } as Document;
      const ebookDoc: Document = { ...mockDocument, category: 'EBOOKS' } as Document;
      const response = { data: [zipPlanDoc, docxPlanDoc, ebookDoc] };
      
      const result = service.processInitialLoad(response, 'KITS', 'EBOOKS');
      
      expect(result.length).toBe(1);
      expect(result[0].format).toBe('ZIP');
      expect(result[0].category).toBe('PLANIFICACION');
    });

    it('should filter TALLERES documents for EBOOKS with TALLERES subcategory', () => {
      const talleresDoc: Document = { ...mockDocument, category: 'TALLERES' } as Document;
      const ebookDoc: Document = { ...mockDocument, category: 'EBOOKS' } as Document;
      const response = { data: [talleresDoc, ebookDoc] };
      
      const result = service.processInitialLoad(response, 'EBOOKS', 'TALLERES');
      
      expect(result.length).toBe(1);
      expect(result[0].category).toBe('TALLERES');
    });

    it('should filter EBOOKS documents for EBOOKS with EBOOKS subcategory', () => {
      const talleresDoc: Document = { ...mockDocument, category: 'TALLERES' } as Document;
      const ebookDoc: Document = { ...mockDocument, category: 'EBOOKS' } as Document;
      const response = { data: [talleresDoc, ebookDoc] };
      
      const result = service.processInitialLoad(response, 'EBOOKS', 'EBOOKS');
      
      expect(result.length).toBe(1);
      expect(result[0].category).toBe('EBOOKS');
    });

    it('should filter documents by category for other categories', () => {
      const reforzamientoDoc: Document = { ...mockDocument, category: 'REFORZAMIENTO' } as Document;
      const planLectorDoc: Document = { ...mockDocument, category: 'PLAN_LECTOR' } as Document;
      const response = { data: [reforzamientoDoc, planLectorDoc] };
      
      const result = service.processInitialLoad(response, 'REFORZAMIENTO', 'EBOOKS');
      
      expect(result.length).toBe(1);
      expect(result[0].category).toBe('REFORZAMIENTO');
    });
  });

  describe('processKitsInitialLoad', () => {
    it('should filter PLANIFICACION documents when selectedServicio is KITS', () => {
      const planDoc: Document = { ...mockDocument, category: 'PLANIFICACION' } as Document;
      const otherDoc: Document = { ...mockDocument, category: 'RECURSOS' } as Document;
      const response = { 
        data: [planDoc, otherDoc],
        pagination: { cantidadDeDocumentos: 2 }
      };
      
      const result = service.processKitsInitialLoad(response, 'KITS');
      
      expect(result.documents.length).toBe(1);
      expect(result.documents[0].category).toBe('PLANIFICACION');
      expect(result.totalCount).toBe(2);
    });

    it('should filter by selectedServicio when not KITS', () => {
      const planDoc: Document = { ...mockDocument, category: 'PLANIFICACION' } as Document;
      const recursosDoc: Document = { ...mockDocument, category: 'RECURSOS' } as Document;
      const response = { 
        data: [planDoc, recursosDoc],
        pagination: { cantidadDeDocumentos: 2 }
      };
      
      const result = service.processKitsInitialLoad(response, 'RECURSOS');
      
      expect(result.documents.length).toBe(1);
      expect(result.documents[0].category).toBe('RECURSOS');
    });

    it('should process document images', () => {
      const docWithPipeUrl: Document = { ...mockDocumentWithPipeUrls, category: 'PLANIFICACION' } as Document;
      const response = { 
        data: [docWithPipeUrl],
        pagination: { cantidadDeDocumentos: 1 }
      };
      
      const result = service.processKitsInitialLoad(response, 'KITS');
      
      expect(result.documents[0].imagenUrlPublic).toBe('http://example.com/image1.jpg');
    });
  });

  describe('processRegularInitialLoad', () => {
    it('should use original documents for MATERIAL_GRATIS', () => {
      const originalDocs = [mockDocument, mockDocumentWithPipeUrls];
      
      const result = service.processRegularInitialLoad(undefined, 'MATERIAL_GRATIS', 'EBOOKS', originalDocs);
      
      expect(result.documents.length).toBe(2);
      expect(result.totalCount).toBeUndefined();
    });

    it('should use original documents for EBOOKS', () => {
      const originalDocs = [mockDocumentWithPipeUrls];
      
      const result = service.processRegularInitialLoad(undefined, 'EBOOKS', 'EBOOKS', originalDocs);
      
      expect(result.documents.length).toBe(1);
      expect(result.documents[0].imagenUrlPublic).toBe('http://example.com/image1.jpg');
    });

    it('should filter TALLERES documents for EBOOKS with TALLERES subcategory', () => {
      const talleresDoc: Document = { ...mockDocument, category: 'TALLERES' } as Document;
      const ebookDoc: Document = { ...mockDocument, category: 'EBOOKS' } as Document;
      const response = { 
        data: [talleresDoc, ebookDoc],
        pagination: { cantidadDeDocumentos: 2 }
      };
      
      const result = service.processRegularInitialLoad(response, 'EBOOKS', 'TALLERES', []);
      
      expect(result.documents.length).toBe(1);
      expect(result.documents[0].category).toBe('TALLERES');
      expect(result.totalCount).toBe(2);
    });

    it('should filter category documents for TALLERES category', () => {
      const talleresDoc: Document = { ...mockDocument, category: 'TALLERES' } as Document;
      const otherDoc: Document = { ...mockDocument, category: 'PLANIFICACION' } as Document;
      const response = { 
        data: [talleresDoc, otherDoc],
        pagination: { cantidadDeDocumentos: 2 }
      };
      
      const result = service.processRegularInitialLoad(response, 'TALLERES', 'EBOOKS', []);
      
      expect(result.documents.length).toBe(1);
      expect(result.documents[0].category).toBe('TALLERES');
    });

    it('should filter non-ZIP documents for PLANIFICACION', () => {
      const zipDoc: Document = { ...mockDocument, format: 'ZIP', category: 'PLANIFICACION' } as Document;
      const docxDoc: Document = { ...mockDocument, format: 'DOCX', category: 'PLANIFICACION' } as Document;
      const response = { 
        data: [zipDoc, docxDoc],
        pagination: { cantidadDeDocumentos: 2 }
      };
      
      const result = service.processRegularInitialLoad(response, 'PLANIFICACION', 'EBOOKS', []);
      
      expect(result.documents.length).toBe(1);
      expect(result.documents[0].format).toBe('DOCX');
    });
  });

  describe('buildInitialLoadParams', () => {
    it('should build params for MATERIAL_GRATIS', () => {
      const params = service.buildInitialLoadParams('MATERIAL_GRATIS', 'EBOOKS');
      expect(params).toEqual({ documentoLibre: 'true' });
    });

    it('should build params for TALLERES', () => {
      const params = service.buildInitialLoadParams('TALLERES', 'EBOOKS');
      expect(params).toEqual({ category: 'TALLERES', format: 'ZIP' });
    });

    it('should build params for EBOOKS with TALLERES subcategory', () => {
      const params = service.buildInitialLoadParams('EBOOKS', 'TALLERES');
      expect(params.category).toBe('TALLERES');
      expect(params.format).toBe('ZIP');
    });

    it('should build params for EBOOKS with EBOOKS subcategory', () => {
      const params = service.buildInitialLoadParams('EBOOKS', 'EBOOKS');
      expect(params.category).toBe('EBOOKS');
      expect(params.format).toBeUndefined();
    });

    it('should build params for KITS', () => {
      const params = service.buildInitialLoadParams('KITS', 'EBOOKS');
      expect(params).toEqual({ category: 'PLANIFICACION', format: 'ZIP' });
    });

    it('should build params for PLANIFICACION', () => {
      const params = service.buildInitialLoadParams('PLANIFICACION', 'EBOOKS');
      expect(params).toEqual({ category: 'PLANIFICACION', format: 'DOCX' });
    });

    it('should build params for other categories', () => {
      const params = service.buildInitialLoadParams('REFORZAMIENTO', 'EBOOKS');
      expect(params).toEqual({ category: 'REFORZAMIENTO' });
    });
  });

  describe('buildSubCategoryParams', () => {
    it('should build params for TALLERES subcategory', () => {
      const params = service.buildSubCategoryParams('TALLERES');
      expect(params).toEqual({ category: 'TALLERES', format: 'ZIP' });
    });

    it('should build params for EBOOKS subcategory', () => {
      const params = service.buildSubCategoryParams('EBOOKS');
      expect(params).toEqual({ category: 'EBOOKS' });
    });
  });

  describe('processDocumentImage', () => {
    it('should extract first URL from pipe-separated URLs', () => {
      const doc = { ...mockDocumentWithPipeUrls };
      const result = service.processDocumentImage(doc);
      
      expect(result.imagenUrlPublic).toBe('http://example.com/image1.jpg');
    });

    it('should not modify single URL', () => {
      const doc = { ...mockDocument };
      const result = service.processDocumentImage(doc);
      
      expect(result.imagenUrlPublic).toBe('http://example.com/image1.jpg');
    });

    it('should handle documents without image URL', () => {
      const doc: Document = { ...mockDocument, imagenUrlPublic: undefined } as Document;
      const result = service.processDocumentImage(doc);
      
      expect(result.imagenUrlPublic).toBeUndefined();
    });

    it('should handle empty pipe-separated URL', () => {
      const doc: Document = { ...mockDocument, imagenUrlPublic: '||' } as Document;
      const result = service.processDocumentImage(doc);
      
      // First element after split will be empty string
      expect(result.imagenUrlPublic).toBe('');
    });
  });

  describe('processDocumentsImages', () => {
    it('should process multiple documents', () => {
      const docs = [mockDocument, mockDocumentWithPipeUrls];
      const result = service.processDocumentsImages(docs);
      
      expect(result.length).toBe(2);
      expect(result[0].imagenUrlPublic).toBe('http://example.com/image1.jpg');
      expect(result[1].imagenUrlPublic).toBe('http://example.com/image1.jpg');
    });

    it('should handle empty array', () => {
      const result = service.processDocumentsImages([]);
      expect(result.length).toBe(0);
    });
  });
});
