/**
 * Strategy Pattern for building filter parameters based on category
 * 
 * Each category has its own strategy for constructing the FilterParams object
 * that will be sent to the backend API.
 */

import { FilterParams } from '../categorias.component';
import { Categoria } from '../models/category-state.model';

/**
 * Context object passed to strategies containing the current state
 */
export interface FilterContext {
  categoria: Categoria;
  selectedNivel?: string;
  selectedMateria?: string;
  selectedGrado?: string;
  selectedServicio?: string;
  currentSubCategoria?: 'EBOOKS' | 'TALLERES';
  selectedSituacion?: any; // For KITS category
}

/**
 * Base interface for filter parameter strategies
 * Each strategy is responsible for building FilterParams for a specific category
 */
export interface FilterParamsStrategy {
  /**
   * Builds the FilterParams object for the backend API
   * @param context Current filter state
   * @returns FilterParams object ready for API call
   */
  buildParams(context: FilterContext): FilterParams;
  
  /**
   * Returns the category this strategy handles
   */
  getCategory(): Categoria;
}
