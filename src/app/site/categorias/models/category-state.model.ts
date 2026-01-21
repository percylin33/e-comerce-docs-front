/**
 * Tipos de categorías soportadas por el sistema
 */
export type Categoria = 
  | 'PLANIFICACION' 
  | 'EVALUACION' 
  | 'ESTRATEGIAS' 
  | 'RECURSOS' 
  | 'CONCURSOS' 
  | 'EBOOKS' 
  | 'TALLERES' 
  | 'PLAN_LECTOR' 
  | 'REFORZAMIENTO' 
  | 'KITS' 
  | 'MATERIAL_GRATIS';

/**
 * Pasos posibles en el flujo de selección
 */
export type CurrentStep = 'niveles' | 'materias' | 'grados' | 'situaciones' | 'documentos';

/**
 * Estado de los filtros seleccionados
 */
export interface FilterState {
  nivel?: string;
  materia?: string;
  grado?: string;
  servicio?: string;
  situacion?: string;
}

/**
 * Estado completo de la categoría actual
 * Incluye la categoría, el paso actual, los filtros y las reglas de navegación
 */
export interface CategoryState {
  /** Categoría actual */
  categoria: Categoria;
  
  /** Paso actual en el flujo */
  currentStep: CurrentStep;
  
  /** Filtros seleccionados */
  filters: FilterState;
  
  /** Si viene desde una navegación con filtros (URL) */
  comingFromFilter: boolean;
  
  /** Pasos a los que se puede transicionar desde el estado actual */
  canTransitionTo: CurrentStep[];
  
  /** Campos requeridos para estar en el paso actual */
  requiredFields: Array<keyof FilterState>;
  
  /** Si debe mostrar documentos en el paso actual */
  shouldShowDocuments: boolean;
  
  /** Si debe mostrar el selector de nivel */
  shouldShowNiveles: boolean;
  
  /** Si debe mostrar el selector de materia */
  shouldShowMaterias: boolean;
  
  /** Si debe mostrar el selector de grado */
  shouldShowGrados: boolean;
  
  /** Si debe mostrar el selector de situaciones (KITS) */
  shouldShowSituaciones: boolean;
}

/**
 * Definición de flujo para una categoría
 * Define qué pasos son posibles y en qué orden
 */
export interface CategoryFlowDefinition {
  /** Nombre de la categoría */
  categoria: Categoria;
  
  /** Pasos posibles en orden */
  steps: CurrentStep[];
  
  /** Paso inicial cuando no hay filtros */
  initialStep: CurrentStep;
  
  /** Reglas para determinar el paso actual basado en filtros */
  rules: FlowRule[];
  
  /** Si la categoría requiere nivel */
  requiresNivel: boolean;
  
  /** Si la categoría requiere materia */
  requiresMateria: boolean;
  
  /** Si la categoría requiere grado */
  requiresGrado: boolean;
  
  /** Si la categoría tiene situaciones (KITS) */
  hasSituaciones: boolean;
}

/**
 * Regla de flujo para determinar el paso actual
 */
export interface FlowRule {
  /** Condición que debe cumplirse */
  condition: (filters: FilterState, comingFromFilter: boolean) => boolean;
  
  /** Paso al que se debe transicionar si la condición es verdadera */
  step: CurrentStep;
  
  /** Descripción de la regla (para debugging) */
  description: string;
  
  /** Prioridad de la regla (mayor = se evalúa primero) */
  priority: number;
}

/**
 * Resultado de una validación de transición
 */
export interface TransitionValidation {
  /** Si la transición es válida */
  isValid: boolean;
  
  /** Mensaje de error si no es válida */
  error?: string;
  
  /** Campos faltantes si los hay */
  missingFields?: Array<keyof FilterState>;
}

/**
 * Evento de cambio de estado
 */
export interface StateChangeEvent {
  /** Estado anterior */
  previousState: CategoryState;
  
  /** Estado nuevo */
  newState: CategoryState;
  
  /** Timestamp del cambio */
  timestamp: Date;
  
  /** Razón del cambio */
  reason: string;
}
