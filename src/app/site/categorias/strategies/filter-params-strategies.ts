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

    // nivel: ID preferido, string como fallback
    if (context.levelId)              params['levelId']   = String(context.levelId);
    else if (context.selectedNivel)   params['nivel']     = context.selectedNivel;

    // materia/subject: ID preferido, string como fallback
    if (context.subjectId)            params['subjectId'] = String(context.subjectId);
    else if (context.selectedMateria) params['materia']   = context.selectedMateria;

    // grado: ID preferido, string como fallback
    if (context.gradeId)              params['gradeId']   = String(context.gradeId);
    else if (context.selectedGrado)   params['grado']     = context.selectedGrado;

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
    if (context.categoryId) {
      params['categoryId'] = String(context.categoryId);
    } else if (context.selectedServicio) {
      params['category'] = context.selectedServicio === 'SESIONES'
        ? 'PLANIFICACION'
        : context.selectedServicio;
    }
    params['format'] = 'DOCX';
  }
}

/**
 * Strategy for KITS category
 * Filters PLANIFICACION documents in ZIP format that are approved kits
 * Prefers targetCategoryId (PLANIFICACION ID) over category string
 */
export class KitsStrategy extends BaseFilterParamsStrategy {
  getCategory(): Categoria {
    return 'KITS';
  }
  
  protected addCategorySpecificParams(params: FilterParams, context: FilterContext): void {
    // Prefer PLANIFICACION categoryId, fallback to category string
    if (context.targetCategoryId) {
      params['categoryId'] = String(context.targetCategoryId);
    } else {
      params['category'] = 'PLANIFICACION';
    }
    params['format'] = 'ZIP';
    params['suscripcion'] = 'false';
    params['esKitPlanificacion'] = 'true';
    params['kitEstado'] = 'APROBADO';

    // Add anio filter if a year is selected
    if (context.selectedAnio) {
      params['anio'] = String(context.selectedAnio);
    }
    
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
 * Always filters by EBOOKS category
 */
export class EbooksStrategy extends BaseFilterParamsStrategy {
  getCategory(): Categoria {
    return 'EBOOKS';
  }

  protected addCategorySpecificParams(params: FilterParams, context: FilterContext): void {
    if (context.categoryId) {
      params['categoryId'] = String(context.categoryId);
    } else {
      params['category'] = 'EBOOKS';
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
    if (context.categoryId) {
      params['categoryId'] = String(context.categoryId);
    } else {
      params['category'] = this.getCategory();
    }
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
    if (context.categoryId) {
      params['categoryId'] = String(context.categoryId);
    } else {
      params['category'] = this.getCategory();
    }
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
    if (context.categoryId) {
      params['categoryId'] = String(context.categoryId);
    } else {
      params['category'] = this.getCategory();
    }
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
    if (context.categoryId) {
      params['categoryId'] = String(context.categoryId);
    } else if (context.selectedServicio) {
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
    if (context.categoryId) {
      params['categoryId'] = String(context.categoryId);
    } else if (context.selectedServicio) {
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
    if (context.categoryId) {
      params['categoryId'] = String(context.categoryId);
    } else if (context.selectedServicio) {
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
    if (context.categoryId) {
      params['categoryId'] = String(context.categoryId);
    } else if (context.selectedServicio) {
      params['category'] = context.selectedServicio === 'SESIONES'
        ? 'PLANIFICACION'
        : context.selectedServicio;
    }
  }
}
