/**
 * Concrete Strategy implementations for each category
 */

import { FilterParams } from '../categorias.component';
import { FilterParamsStrategy, FilterContext } from './filter-params-strategy.interface';
import { Categoria } from '../models/category-state.model';

/**
 * Base strategy with common logic for adding nivel, materia, grado
 */
abstract class BaseFilterParamsStrategy implements FilterParamsStrategy {
  abstract getCategory(): Categoria;
  
  buildParams(context: FilterContext): FilterParams {
    const params: FilterParams = {};
    
    // Add common filters if present
    if (context.selectedMateria) params['materia'] = context.selectedMateria;
    if (context.selectedNivel) params['nivel'] = context.selectedNivel;
    if (context.selectedGrado) params['grado'] = context.selectedGrado;
    
    // Let subclasses add category-specific params
    this.addCategorySpecificParams(params, context);
    
    return params;
  }
  
  /**
   * Subclasses implement this to add category-specific parameters
   */
  protected abstract addCategorySpecificParams(params: FilterParams, context: FilterContext): void;
}

/**
 * Strategy for PLANIFICACION category
 * Uses selectedServicio to determine category and format
 */
export class PlanificacionStrategy extends BaseFilterParamsStrategy {
  getCategory(): Categoria {
    return 'PLANIFICACION';
  }
  
  protected addCategorySpecificParams(params: FilterParams, context: FilterContext): void {
    if (context.selectedServicio) {
      // SESIONES maps to PLANIFICACION category
      params['category'] = context.selectedServicio === 'SESIONES' 
        ? 'PLANIFICACION' 
        : context.selectedServicio;
      
      // PLANIFICACION always uses DOCX format
      params['format'] = 'DOCX';
    }
  }
}

/**
 * Strategy for KITS category
 * Always uses PLANIFICACION category with ZIP format
 * Includes situacionId if a situation is selected
 */
export class KitsStrategy extends BaseFilterParamsStrategy {
  getCategory(): Categoria {
    return 'KITS';
  }
  
  protected addCategorySpecificParams(params: FilterParams, context: FilterContext): void {
    params['category'] = 'PLANIFICACION';
    params['format'] = 'ZIP';
    
    // Add situacionId if a situation is selected
    if (context.selectedSituacion?.id) {
      params['situacionId'] = context.selectedSituacion.id.toString();
    }
  }
}

/**
 * Strategy for MATERIAL_GRATIS category
 * Uses documentoLibre flag instead of category
 */
export class MaterialGratisStrategy extends BaseFilterParamsStrategy {
  getCategory(): Categoria {
    return 'MATERIAL_GRATIS';
  }
  
  protected addCategorySpecificParams(params: FilterParams, context: FilterContext): void {
    params['documentoLibre'] = 'true';
  }
}

/**
 * Strategy for EBOOKS category
 * Uses currentSubCategoria (EBOOKS or TALLERES) and adds format for TALLERES
 */
export class EbooksStrategy extends BaseFilterParamsStrategy {
  getCategory(): Categoria {
    return 'EBOOKS';
  }
  
  protected addCategorySpecificParams(params: FilterParams, context: FilterContext): void {
    // Use currentSubCategoria (defaults to EBOOKS if not set)
    params['category'] = context.currentSubCategoria || 'EBOOKS';
    
    // If subcategory is TALLERES, add ZIP format
    if (context.currentSubCategoria === 'TALLERES') {
      params['format'] = 'ZIP';
    }
  }
}

/**
 * Strategy for TALLERES category
 * Uses TALLERES category with ZIP format
 */
export class TalleresStrategy extends BaseFilterParamsStrategy {
  getCategory(): Categoria {
    return 'TALLERES';
  }
  
  protected addCategorySpecificParams(params: FilterParams, context: FilterContext): void {
    params['category'] = this.getCategory();
    params['format'] = 'ZIP';
  }
}

/**
 * Strategy for REFORZAMIENTO category
 * Allows all formats
 */
export class ReforzamientoStrategy extends BaseFilterParamsStrategy {
  getCategory(): Categoria {
    return 'REFORZAMIENTO';
  }
  
  protected addCategorySpecificParams(params: FilterParams, context: FilterContext): void {
    params['category'] = this.getCategory();
    // No format restriction - allow all formats
  }
}

/**
 * Strategy for PLAN_LECTOR category
 * Allows all formats
 */
export class PlanLectorStrategy extends BaseFilterParamsStrategy {
  getCategory(): Categoria {
    return 'PLAN_LECTOR';
  }
  
  protected addCategorySpecificParams(params: FilterParams, context: FilterContext): void {
    params['category'] = this.getCategory();
    // No format restriction - allow all formats
  }
}

/**
 * Strategy for EVALUACION category
 * Standard strategy using selectedServicio
 */
export class EvaluacionStrategy extends BaseFilterParamsStrategy {
  getCategory(): Categoria {
    return 'EVALUACION';
  }
  
  protected addCategorySpecificParams(params: FilterParams, context: FilterContext): void {
    if (context.selectedServicio) {
      params['category'] = context.selectedServicio === 'SESIONES' 
        ? 'PLANIFICACION' 
        : context.selectedServicio;
    }
  }
}

/**
 * Strategy for CONCURSOS category
 * Standard strategy using selectedServicio
 */
export class ConcursosStrategy extends BaseFilterParamsStrategy {
  getCategory(): Categoria {
    return 'CONCURSOS';
  }
  
  protected addCategorySpecificParams(params: FilterParams, context: FilterContext): void {
    if (context.selectedServicio) {
      params['category'] = context.selectedServicio === 'SESIONES' 
        ? 'PLANIFICACION' 
        : context.selectedServicio;
    }
  }
}

/**
 * Strategy for RECURSOS category
 * Standard strategy using selectedServicio
 */
export class RecursosStrategy extends BaseFilterParamsStrategy {
  getCategory(): Categoria {
    return 'RECURSOS';
  }
  
  protected addCategorySpecificParams(params: FilterParams, context: FilterContext): void {
    if (context.selectedServicio) {
      params['category'] = context.selectedServicio === 'SESIONES' 
        ? 'PLANIFICACION' 
        : context.selectedServicio;
    }
  }
}

/**
 * Strategy for ESTRATEGIAS category
 * Standard strategy using selectedServicio
 */
export class EstrategiasStrategy extends BaseFilterParamsStrategy {
  getCategory(): Categoria {
    return 'ESTRATEGIAS';
  }
  
  protected addCategorySpecificParams(params: FilterParams, context: FilterContext): void {
    if (context.selectedServicio) {
      params['category'] = context.selectedServicio === 'SESIONES' 
        ? 'PLANIFICACION' 
        : context.selectedServicio;
    }
  }
}
