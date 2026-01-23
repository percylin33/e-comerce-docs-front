import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DocumentData, Document } from '../../../@core/interfaces/documents';
import { DocumentLoaderService } from './document-loader.service';
import { PaginationService } from './core/pagination.service';
import { Categoria } from '../models/category-state.model';
import { FilterParams } from '../categorias.component';

/**
 * Interface for search context containing all necessary state
 */
export interface SearchContext {
  categoria: Categoria;
  displayCategoria: string;
  currentSubCategoria: string;
  selectedNivel?: string;
  selectedMateria?: string;
  selectedGrado?: string;
}

/**
 * Interface for search result with processed documents and metadata
 */
export interface SearchResult {
  documents: Document[];
  suggestions: string[];
  hasResults: boolean;
  totalCount: number;
}

/**
 * Service responsible for handling all search-related operations.
 * Provides search execution, parameter building, and result processing.
 */
@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor(
    private documentData: DocumentData,
    private documentLoader: DocumentLoaderService,
    private paginationService: PaginationService
  ) {}

  /**
   * Executes search with filters using server-side pagination
   */
  searchWithFilters(
    searchTerm: string,
    context: SearchContext,
    destroy$: Observable<void>
  ): Observable<any> {
    const searchParams = this.buildSearchParams(searchTerm, context);
    
    return this.documentData.getSearch(
      searchParams, 
      this.paginationService.getCurrentPage(), 
      this.paginationService.getPageSize()
    ).pipe(takeUntil(destroy$));
  }

  /**
   * Executes basic document search by title
   */
  searchDocuments(
    searchTerm: string,
    destroy$: Observable<void>
  ): Observable<any> {
    return this.documentData.searchDocuments('title', searchTerm)
      .pipe(takeUntil(destroy$));
  }

  /**
   * Builds search parameters including filters and category-specific logic
   */
  buildSearchParams(searchTerm: string, context: SearchContext): Record<string, string> {
    const params: Record<string, string> = {
      title: searchTerm
    };

    // Add selected filters
    if (context.selectedNivel) params['nivel'] = context.selectedNivel;
    if (context.selectedMateria) params['area'] = context.selectedMateria;
    if (context.selectedGrado) params['grado'] = context.selectedGrado;

    // Category and format logic
    if (context.categoria === 'MATERIAL_GRATIS') {
      params['documentoLibre'] = 'true';
    } else if (context.categoria === 'KITS') {
      params['category'] = 'PLANIFICACION';
      params['format'] = 'ZIP';
    } else if (context.categoria === 'EBOOKS') {
      params['category'] = context.currentSubCategoria;
      if (context.currentSubCategoria === 'TALLERES') {
        params['format'] = 'ZIP';
        params['category'] = 'TALLERES';
      }
    } else if (context.categoria === 'PLANIFICACION' || context.displayCategoria === 'SESIONES') {
      params['category'] = 'PLANIFICACION';
      params['format'] = 'DOCX';
    } else if (['REFORZAMIENTO', 'PLAN_LECTOR', 'TALLERES'].includes(context.categoria)) {
      params['category'] = context.categoria;
    } else {
      params['category'] = context.categoria;
    }
    
    params['suscripcion'] = 'false';
    return params;
  }

  /**
   * Filters search response based on category rules
   */
  filterSearchResults(response: any, context: SearchContext): Document[] {
    return response.data.filter((doc: Document) => {
      // Filter by category
      if (context.categoria === 'MATERIAL_GRATIS') {
        return doc.documentoLibre === true;
      }
      
      const categoryMatch = context.categoria === 'KITS' 
        ? doc.category === 'PLANIFICACION'
        : doc.category === context.categoria;
      
      if (!categoryMatch) return false;
      
      // Filter by format based on current category
      if (context.categoria === 'PLANIFICACION') return doc.format !== 'ZIP';
      if (context.categoria === 'KITS') return doc.format === 'ZIP';
      if (['TALLERES', 'REFORZAMIENTO', 'PLAN_LECTOR'].includes(context.categoria)) return true;
      return doc.format !== 'ZIP';
    });
  }

  /**
   * Processes search response: filters, maps images, generates suggestions
   */
  processSearchResponse(response: any, context: SearchContext): SearchResult {
    const documents = response.data.map((doc: Document) => 
      this.documentLoader.processDocumentImage(doc)
    );
    
    const suggestions = response.data.map((doc: Document) => doc.title);
    
    return {
      documents,
      suggestions,
      hasResults: documents.length > 0,
      totalCount: response.pagination?.cantidadDeDocumentos || response.data.length
    };
  }

  /**
   * Processes filtered search response (applies category filtering first)
   */
  processFilteredSearchResponse(response: any, context: SearchContext): SearchResult {
    const filteredData = this.filterSearchResults(response, context);
    
    const documents = filteredData.map((doc: Document) => 
      this.documentLoader.processDocumentImage(doc)
    );
    
    const suggestions = filteredData.map((doc: Document) => doc.title);
    
    return {
      documents,
      suggestions,
      hasResults: documents.length > 0,
      totalCount: response.pagination?.cantidadDeDocumentos || filteredData.length
    };
  }

  /**
   * Checks if there are active filters
   */
  hasActiveFilters(context: SearchContext): boolean {
    return !!(context.selectedNivel || context.selectedMateria || context.selectedGrado);
  }
}
