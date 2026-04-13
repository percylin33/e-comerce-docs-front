import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Document, DocumentData } from '../../../@core/interfaces/documents';
import { DocumentCacheService } from './document-cache.service';
import { PaginationService } from './core/pagination.service';
import { CategoryConfigService } from './category-config.service';
import { Categoria } from '../models/category-state.model';
import { FilterParams } from '../categorias.component';

/**
 * Service responsible for loading and processing documents across different categories.
 * Handles initial loading, reloading, subcategory loading, and document image processing.
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentLoaderService {

  constructor(
    private documentData: DocumentData,
    private cacheService: DocumentCacheService,
    private paginationService: PaginationService,
    private config: CategoryConfigService
  ) {}

  /**
   * Main method to load documents based on filter parameters
   * Handles both free documents and regular filtered documents with caching
   */
  loadDocuments(
    params: FilterParams,
    categoria: Categoria,
    destroy$: Observable<void>
  ): Observable<any> {
    return new Observable(observer => {
      if (categoria === 'MATERIAL_GRATIS') {
        this.documentData.getDocumentFree(
          this.paginationService.getCurrentPage(), 
          this.paginationService.getPageSize()
        )
          .pipe(takeUntil(destroy$))
          .subscribe({
            next: (response) => observer.next(response),
            error: (error) => observer.error(error),
            complete: () => observer.complete()
          });
      } else {
        const cacheKey = this.cacheService.generateKey('initial-load', { 
          ...params, 
          page: this.paginationService.getCurrentPage().toString() 
        });

        this.cacheService.get(
          cacheKey, 
          this.documentData.filterDocuments(params, this.paginationService.getCurrentPage(), this.paginationService.getPageSize())
        )
          .pipe(takeUntil(destroy$))
          .subscribe({
            next: (response) => observer.next(response),
            error: (error) => observer.error(error),
            complete: () => observer.complete()
          });
      }
    });
  }

  /**
   * Processes the initial documents load response
   * Filters and stores original documents based on category rules
   */
  processInitialLoad(
    response: any,
    categoria: Categoria
  ): Document[] {
    if (categoria === 'MATERIAL_GRATIS') {
      return response.data || [];
    } else if (categoria === 'PLANIFICACION') {
      return response.data.filter((doc: Document) => 
        doc.category === categoria && doc.format !== 'ZIP'
      );
    } else if (categoria === 'KITS') {
      return response.data.filter((doc: Document) => 
        doc.category === 'PLANIFICACION' && doc.format === 'ZIP'
      );
    } else {
      return response.data.filter((doc: Document) =>
        doc.category === categoria
      );
    }
  }

  /**
   * Handles initial load for KITS category
   * Filters documents based on selected service
   */
  processKitsInitialLoad(
    response: any,
    selectedServicio: string
  ): { documents: Document[], totalCount: number } {
    const documents = response.data
      .filter((doc: Document) => {
        if (selectedServicio === 'KITS') {
          return doc.category === 'PLANIFICACION';  
        }
        return doc.category === selectedServicio;
      })
      .map((doc: Document) => this.processDocumentImage(doc));
    
    return {
      documents,
      totalCount: response.pagination?.cantidadDeDocumentos
    };
  }

  /**
   * Handles initial load for regular categories (non-KITS)
   * Applies category-specific filtering rules
   */
  processRegularInitialLoad(
    response: any | undefined,
    categoria: Categoria,
    originalDocuments: Document[]
  ): { documents: Document[], totalCount: number | undefined } {
    const useOriginalDocs = ['MATERIAL_GRATIS', 'EBOOKS'].includes(categoria);
    
    let documents: Document[];
    if (useOriginalDocs) {
      documents = originalDocuments.map(doc => this.processDocumentImage(doc));
    } else {
      documents = response.data
        .filter((doc: Document) => {
          if (categoria === 'EBOOKS') {
            return doc.category === 'EBOOKS';
          }
          // Solo PLANIFICACION excluye ZIP (los kits son ZIP y van por su propia rama)
          if (categoria === 'PLANIFICACION') {
            return doc.category === categoria && doc.format !== 'ZIP';
          }
          // El resto (EVALUACION, ESTRATEGIAS, CONCURSOS, RECURSOS, etc.) muestran todos los formatos
          return doc.category === categoria;
        })
        .map((doc: Document) => this.processDocumentImage(doc));
    }
    
    return {
      documents,
      totalCount: response?.pagination?.cantidadDeDocumentos
    };
  }

  /**
   * Builds initial load parameters based on category and subcategory
   */
  buildInitialLoadParams(
    categoria: Categoria
  ): FilterParams {
    if (categoria === 'MATERIAL_GRATIS') {
      return { documentoLibre: 'true' };
    } else if (categoria === 'TALLERES') {
      return { category: categoria, format: 'ZIP' };
    } else if (categoria === 'EBOOKS') {
      return { category: 'EBOOKS' };
    } else if (categoria === 'KITS') {
      return { category: 'PLANIFICACION', format: 'ZIP' };
    } else if (categoria === 'PLANIFICACION') {
      return { category: 'PLANIFICACION', format: 'DOCX' };
    } else {
      return { category: categoria };
    }
  }

  /**
   * Processes document image URLs
   * Handles pipe-separated URLs and extracts the first one
   */
  processDocumentImage(doc: Document): Document {
    if (doc.imagenUrlPublic && doc.imagenUrlPublic.includes('|')) {
      const urls = doc.imagenUrlPublic.split('|');
      if (urls.length > 0) {
        doc.imagenUrlPublic = urls[0];
      }
    }
    return doc;
  }

  /**
   * Processes multiple documents' images
   */
  processDocumentsImages(documents: Document[]): Document[] {
    return documents.map(doc => this.processDocumentImage(doc));
  }
}
