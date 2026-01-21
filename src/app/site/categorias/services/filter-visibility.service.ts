import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { Categoria, CurrentStep } from '../models/category-state.model';

/**
 * Configuración de visibilidad de filtros por categoría
 */
export interface FilterVisibilityConfig {
  /** Debe mostrar carta de nivel */
  showNivelCard: boolean;
  
  /** Debe mostrar carta de materia */
  showMateriaCard: boolean;
  
  /** Debe mostrar carta de grado */
  showGradoCard: boolean;
  
  /** Requiere selección de nivel */
  requiresNivel: boolean;
  
  /** Requiere selección de materia */
  requiresMateria: boolean;
  
  /** Requiere selección de grado */
  requiresGrado: boolean;
}

/**
 * Estado calculado de visibilidad de filtros
 */
export interface FilterVisibilityState {
  /** Debe mostrar carta de nivel (considerando URL) */
  shouldShowNivelCard: boolean;
  
  /** Debe mostrar carta de materia (considerando URL) */
  shouldShowMateriaCard: boolean;
  
  /** Debe mostrar carta de grado (considerando URL) */
  shouldShowGradoCard: boolean;
  
  /** Paso inicial basado en configuración y URL */
  initialStep: CurrentStep;
  
  /** Nivel pre-seleccionado desde URL */
  preselectedNivel?: string;
  
  /** Materia pre-seleccionada desde URL */
  preselectedMateria?: string;
  
  /** Grado pre-seleccionado desde URL */
  preselectedGrado?: string;
}

/**
 * Servicio para gestionar la visibilidad de filtros según la categoría y parámetros URL.
 * 
 * Reglas de visibilidad:
 * 
 * Grupo 1 (KITS, REFORZAMIENTO, PLAN_LECTOR, EVALUACION):
 * - Sin URL params: Mostrar carta de nivel
 * - Con nivel en URL: Mostrar carta de materia
 * - Con nivel + materia en URL: Mostrar documentos directamente
 * 
 * Grupo 2 (ESTRATEGIAS, RECURSOS):
 * - Sin URL params: Mostrar carta de nivel
 * - Con nivel en URL: Mostrar documentos directamente
 * 
 * Grupo 3 (EBOOKS, TALLERES, MATERIAL_GRATIS):
 * - Siempre mostrar documentos directamente (sin cartas)
 */
@Injectable({
  providedIn: 'root'
})
export class FilterVisibilityService {

  /** Configuraciones base por categoría */
  private readonly categoryConfigs: Map<Categoria, FilterVisibilityConfig>;

  constructor() {
    this.categoryConfigs = this.initializeConfigs();
  }

  /**
   * Inicializa las configuraciones de todas las categorías
   */
  private initializeConfigs(): Map<Categoria, FilterVisibilityConfig> {
    const configs = new Map<Categoria, FilterVisibilityConfig>();

    // Grupo 1: Filtros en carta - Nivel y Materia
    const group1Config: FilterVisibilityConfig = {
      showNivelCard: true,
      showMateriaCard: true,
      showGradoCard: false,
      requiresNivel: true,
      requiresMateria: true,
      requiresGrado: false
    };

    configs.set('KITS', group1Config);
    configs.set('REFORZAMIENTO', group1Config);
    configs.set('PLAN_LECTOR', group1Config);
    configs.set('EVALUACION', group1Config);

    // Grupo 2: Filtro en carta - Solo Nivel
    const group2Config: FilterVisibilityConfig = {
      showNivelCard: true,
      showMateriaCard: false,
      showGradoCard: false,
      requiresNivel: true,
      requiresMateria: false,
      requiresGrado: false
    };

    configs.set('ESTRATEGIAS', group2Config);
    configs.set('RECURSOS', group2Config);

    // Grupo 3: Sin filtros en carta
    const group3Config: FilterVisibilityConfig = {
      showNivelCard: false,
      showMateriaCard: false,
      showGradoCard: false,
      requiresNivel: false,
      requiresMateria: false,
      requiresGrado: false
    };

    configs.set('EBOOKS', group3Config);
    configs.set('TALLERES', group3Config);
    configs.set('MATERIAL_GRATIS', group3Config);

    // Categorías adicionales (comportamiento como grupo 1)
    configs.set('PLANIFICACION', group1Config);
    configs.set('CONCURSOS', group1Config);

    return configs;
  }

  /**
   * Calcula el estado de visibilidad de filtros según categoría y parámetros URL
   */
  calculateVisibility(categoria: Categoria, urlParams: Params): FilterVisibilityState {
    const config = this.categoryConfigs.get(categoria);
    
    if (!config) {
      throw new Error(`No configuration found for category: ${categoria}`);
    }

    const hasNivel = !!urlParams['nivel'];
    const hasMateria = !!urlParams['materia'];
    const hasGrado = !!urlParams['grado'];

    // Extraer valores pre-seleccionados
    const preselectedNivel = urlParams['nivel'];
    const preselectedMateria = urlParams['materia'];
    const preselectedGrado = urlParams['grado'];

    // Aplicar reglas según grupo
    return this.applyVisibilityRules(
      config,
      hasNivel,
      hasMateria,
      hasGrado,
      preselectedNivel,
      preselectedMateria,
      preselectedGrado
    );
  }

  /**
   * Aplica las reglas de visibilidad según la configuración y parámetros URL
   */
  private applyVisibilityRules(
    config: FilterVisibilityConfig,
    hasNivel: boolean,
    hasMateria: boolean,
    hasGrado: boolean,
    preselectedNivel?: string,
    preselectedMateria?: string,
    preselectedGrado?: string
  ): FilterVisibilityState {
    
    // Grupo 3: Sin cartas - siempre documentos
    if (!config.showNivelCard && !config.showMateriaCard) {
      return {
        shouldShowNivelCard: false,
        shouldShowMateriaCard: false,
        shouldShowGradoCard: false,
        initialStep: 'documentos',
        preselectedNivel,
        preselectedMateria,
        preselectedGrado
      };
    }

    // Grupo 1: Nivel + Materia en cartas
    if (config.showNivelCard && config.showMateriaCard) {
      // Regla 1: Nivel + Materia en URL → Documentos (sin cartas)
      if (hasNivel && hasMateria) {
        return {
          shouldShowNivelCard: false,
          shouldShowMateriaCard: false,
          shouldShowGradoCard: false,
          initialStep: 'documentos',
          preselectedNivel,
          preselectedMateria,
          preselectedGrado
        };
      }

      // Regla 2: Solo Nivel en URL → Carta de Materia
      if (hasNivel && !hasMateria) {
        return {
          shouldShowNivelCard: false,
          shouldShowMateriaCard: true,
          shouldShowGradoCard: false,
          initialStep: 'materias',
          preselectedNivel,
          preselectedMateria,
          preselectedGrado
        };
      }

      // Regla 3: Sin parámetros → Carta de Nivel
      return {
        shouldShowNivelCard: true,
        shouldShowMateriaCard: false,
        shouldShowGradoCard: false,
        initialStep: 'niveles',
        preselectedNivel,
        preselectedMateria,
        preselectedGrado
      };
    }

    // Grupo 2: Solo Nivel en carta
    if (config.showNivelCard && !config.showMateriaCard) {
      // Regla 1: Nivel en URL → Documentos (sin carta)
      if (hasNivel) {
        return {
          shouldShowNivelCard: false,
          shouldShowMateriaCard: false,
          shouldShowGradoCard: false,
          initialStep: 'documentos',
          preselectedNivel,
          preselectedMateria,
          preselectedGrado
        };
      }

      // Regla 2: Sin nivel → Carta de Nivel
      return {
        shouldShowNivelCard: true,
        shouldShowMateriaCard: false,
        shouldShowGradoCard: false,
        initialStep: 'niveles',
        preselectedNivel,
        preselectedMateria,
        preselectedGrado
      };
    }

    // Fallback: Documentos
    return {
      shouldShowNivelCard: false,
      shouldShowMateriaCard: false,
      shouldShowGradoCard: false,
      initialStep: 'documentos',
      preselectedNivel,
      preselectedMateria,
      preselectedGrado
    };
  }

  /**
   * Verifica si la categoría debe mostrar cartas de filtros
   */
  shouldShowCards(categoria: Categoria): boolean {
    const config = this.categoryConfigs.get(categoria);
    return config ? (config.showNivelCard || config.showMateriaCard) : false;
  }

  /**
   * Obtiene la configuración de una categoría
   */
  getConfig(categoria: Categoria): FilterVisibilityConfig | undefined {
    return this.categoryConfigs.get(categoria);
  }

  /**
   * Verifica si la categoría requiere nivel
   */
  requiresNivel(categoria: Categoria): boolean {
    const config = this.categoryConfigs.get(categoria);
    return config ? config.requiresNivel : false;
  }

  /**
   * Verifica si la categoría requiere materia
   */
  requiresMateria(categoria: Categoria): boolean {
    const config = this.categoryConfigs.get(categoria);
    return config ? config.requiresMateria : false;
  }

  /**
   * Verifica si la categoría requiere grado
   */
  requiresGrado(categoria: Categoria): boolean {
    const config = this.categoryConfigs.get(categoria);
    return config ? config.requiresGrado : false;
  }
}
