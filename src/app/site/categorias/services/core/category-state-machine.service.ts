import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import {
  Categoria,
  CategoryState,
  CurrentStep,
  FilterState,
  CategoryFlowDefinition,
  FlowRule,
  TransitionValidation,
  StateChangeEvent
} from '../../models/category-state.model';

/**
 * Servicio de State Machine para gestionar el flujo de estados de categorías
 * 
 * Responsabilidades:
 * - Mantener el estado actual de la categoría
 * - Gestionar transiciones de estado validadas
 * - Determinar qué paso mostrar según filtros y categoría
 * - Proveer observables para cambios de estado
 * - Definir flujos para cada categoría
 * 
 * @example
 * ```typescript
 * constructor(private stateMachine: CategoryStateMachineService) {
 *   this.stateMachine.state$.subscribe(state => {
 *     console.log(`Paso actual: ${state.currentStep}`);
 *   });
 * }
 * 
 * // Cambiar categoría
 * this.stateMachine.setCategoria('KITS');
 * 
 * // Actualizar filtros
 * this.stateMachine.updateFilters({ nivel: 'PRIMARIA' });
 * 
 * // Transicionar a paso específico
 * this.stateMachine.transitionTo('documentos');
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryStateMachineService {
  
  // Estado interno
  private stateSubject = new BehaviorSubject<CategoryState>(this.createInitialState());
  
  // Historial de cambios (para debugging)
  private history: StateChangeEvent[] = [];
  private readonly MAX_HISTORY_SIZE = 20;
  
  // Definiciones de flujos por categoría
  private flowDefinitions: Map<Categoria, CategoryFlowDefinition> = new Map();
  
  /**
   * Observable del estado completo de la categoría
   */
  public state$: Observable<CategoryState> = this.stateSubject.asObservable();
  
  /**
   * Observable solo del paso actual
   */
  public currentStep$: Observable<CurrentStep> = this.state$.pipe(
    map(state => state.currentStep),
    distinctUntilChanged()
  );
  
  /**
   * Observable solo de los filtros
   */
  public filters$: Observable<FilterState> = this.state$.pipe(
    map(state => state.filters),
    distinctUntilChanged()
  );
  
  /**
   * Observable de eventos de cambio de estado
   */
  private stateChangeSubject = new BehaviorSubject<StateChangeEvent | null>(null);
  public stateChange$ = this.stateChangeSubject.asObservable();

  constructor() {
    this.initializeFlowDefinitions();
  }

  // ============ MÉTODOS PÚBLICOS - GESTIÓN DE ESTADO ============

  /**
   * Obtiene el estado actual de forma síncrona
   */
  getCurrentState(): CategoryState {
    return this.stateSubject.value;
  }

  /**
   * Establece la categoría actual y recalcula el estado
   */
  setCategoria(categoria: Categoria, comingFromFilter: boolean = false): void {
    const currentState = this.stateSubject.value;
    
    const flow = this.getFlowDefinition(categoria);
    const newStep = this.determineStepForCategory(categoria, currentState.filters, comingFromFilter);
    
    const newState: CategoryState = {
      ...currentState,
      categoria,
      currentStep: newStep,
      comingFromFilter,
      ...this.calculateStateFlags(categoria, newStep, currentState.filters)
    };
    
    this.emitState(newState, `Categoría cambiada a ${categoria}`);
  }

  /**
   * Actualiza los filtros y recalcula el estado
   */
  updateFilters(partialFilters: Partial<FilterState>): void {
    const currentState = this.stateSubject.value;
    const newFilters = { ...currentState.filters, ...partialFilters };
    
    // Recalcular el paso según los nuevos filtros
    const newStep = this.determineStepForCategory(
      currentState.categoria,
      newFilters,
      currentState.comingFromFilter
    );
    
    const newState: CategoryState = {
      ...currentState,
      filters: newFilters,
      currentStep: newStep,
      ...this.calculateStateFlags(currentState.categoria, newStep, newFilters)
    };
    
    this.emitState(newState, `Filtros actualizados: ${JSON.stringify(partialFilters)}`);
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    const currentState = this.stateSubject.value;
    const flow = this.getFlowDefinition(currentState.categoria);
    
    const newState: CategoryState = {
      ...currentState,
      filters: {},
      currentStep: flow.initialStep,
      comingFromFilter: false,
      ...this.calculateStateFlags(currentState.categoria, flow.initialStep, {})
    };
    
    this.emitState(newState, 'Filtros limpiados');
  }

  /**
   * Marca que ya no viene de filtro (después de primera carga)
   */
  clearComingFromFilter(): void {
    const currentState = this.stateSubject.value;
    if (currentState.comingFromFilter) {
      this.emitState({
        ...currentState,
        comingFromFilter: false
      }, 'ComingFromFilter limpiado');
    }
  }

  /**
   * Intenta transicionar a un paso específico
   * Valida que la transición sea válida
   */
  transitionTo(step: CurrentStep): TransitionValidation {
    const currentState = this.stateSubject.value;
    
    // Validar transición
    const validation = this.validateTransition(currentState, step);
    
    if (!validation.isValid) {
      console.warn(`[StateMachine] Transición inválida a ${step}: ${validation.error}`);
      return validation;
    }
    
    // Realizar transición
    const newState: CategoryState = {
      ...currentState,
      currentStep: step,
      ...this.calculateStateFlags(currentState.categoria, step, currentState.filters)
    };
    
    this.emitState(newState, `Transición manual a ${step}`);
    return { isValid: true };
  }

  /**
   * Resetea completamente el estado a inicial
   */
  reset(): void {
    const initialState = this.createInitialState();
    this.emitState(initialState, 'Estado reseteado');
    this.history = [];
  }

  // ============ MÉTODOS PÚBLICOS - QUERIES ============

  /**
   * Verifica si se puede transicionar a un paso
   */
  canTransitionTo(step: CurrentStep): boolean {
    const currentState = this.stateSubject.value;
    return currentState.canTransitionTo.includes(step);
  }

  /**
   * Obtiene los campos requeridos para el paso actual
   */
  getRequiredFields(): Array<keyof FilterState> {
    return this.stateSubject.value.requiredFields;
  }

  /**
   * Verifica si todos los campos requeridos están presentes
   */
  hasRequiredFields(): boolean {
    const state = this.stateSubject.value;
    return state.requiredFields.every(field => !!state.filters[field]);
  }

  /**
   * Obtiene el historial de cambios de estado
   */
  getHistory(): StateChangeEvent[] {
    return [...this.history];
  }

  /**
   * Obtiene la definición de flujo para la categoría actual
   */
  getCurrentFlowDefinition(): CategoryFlowDefinition {
    return this.getFlowDefinition(this.stateSubject.value.categoria);
  }

  // ============ MÉTODOS PRIVADOS - INICIALIZACIÓN ============

  /**
   * Crea el estado inicial
   */
  private createInitialState(): CategoryState {
    return {
      categoria: 'PLANIFICACION',
      currentStep: 'niveles',
      filters: {},
      comingFromFilter: false,
      canTransitionTo: ['materias', 'documentos'],
      requiredFields: [],
      shouldShowDocuments: false,
      shouldShowNiveles: true,
      shouldShowMaterias: false,
      shouldShowGrados: false,
      shouldShowSituaciones: false
    };
  }

  /**
   * Inicializa las definiciones de flujo para cada categoría
   */
  private initializeFlowDefinitions(): void {
    // KITS - Flujo más complejo
    this.flowDefinitions.set('KITS', {
      categoria: 'KITS',
      steps: ['niveles', 'materias', 'situaciones', 'documentos'],
      initialStep: 'niveles',
      requiresNivel: true,
      requiresMateria: true,
      requiresGrado: false,
      hasSituaciones: true,
      rules: [
        {
          condition: (filters, fromFilter) => 
            filters.nivel === 'SECUNDARIA' && !filters.materia,
          step: 'materias',
          description: 'SECUNDARIA sin materia -> mostrar materias',
          priority: 100
        },
        {
          condition: (filters, fromFilter) => 
            !!filters.situacion || (fromFilter && !!filters.nivel && !!filters.materia),
          step: 'documentos',
          description: 'Con situación o desde filtro con nivel+materia -> documentos',
          // Prioridad por encima de la regla 90 (nivel+materia sin situación)
          // para que un comingFromFilter con nivel+materia vaya directo a documentos.
          priority: 95
        },
        {
          condition: (filters, fromFilter) => 
            !!filters.nivel && !!filters.materia && !filters.situacion,
          step: 'situaciones',
          description: 'Nivel y materia pero sin situación -> mostrar situaciones',
          priority: 90
        },
        {
          condition: (filters) => !!filters.nivel && filters.nivel !== 'SECUNDARIA',
          step: 'situaciones',
          description: 'PRIMARIA/INICIAL con nivel -> situaciones',
          priority: 70
        },
        {
          condition: () => true,
          step: 'niveles',
          description: 'Default -> niveles',
          priority: 0
        }
      ]
    });

    // PLANIFICACION - Flujo estándar
    this.flowDefinitions.set('PLANIFICACION', {
      categoria: 'PLANIFICACION',
      steps: ['niveles', 'materias', 'grados', 'documentos'],
      initialStep: 'niveles',
      requiresNivel: true,
      requiresMateria: true,
      requiresGrado: false,
      hasSituaciones: false,
      rules: [
        {
          condition: (filters, fromFilter) => 
            fromFilter && !!filters.nivel && !!filters.materia,
          step: 'documentos',
          description: 'Desde filtro con nivel+materia -> documentos',
          priority: 100
        },
        {
          condition: (filters) => !!filters.materia,
          step: 'documentos',
          description: 'Con materia seleccionada -> documentos',
          priority: 90
        },
        {
          condition: (filters) => !!filters.nivel,
          step: 'materias',
          description: 'Con nivel seleccionado -> materias',
          priority: 80
        },
        {
          condition: () => true,
          step: 'niveles',
          description: 'Default -> niveles',
          priority: 0
        }
      ]
    });

    // MATERIAL_GRATIS - Directo a documentos
    this.flowDefinitions.set('MATERIAL_GRATIS', {
      categoria: 'MATERIAL_GRATIS',
      steps: ['documentos'],
      initialStep: 'documentos',
      requiresNivel: false,
      requiresMateria: false,
      requiresGrado: false,
      hasSituaciones: false,
      rules: [
        {
          condition: () => true,
          step: 'documentos',
          description: 'Siempre documentos',
          priority: 100
        }
      ]
    });

    // EBOOKS - Directo a documentos
    this.flowDefinitions.set('EBOOKS', {
      categoria: 'EBOOKS',
      steps: ['documentos'],
      initialStep: 'documentos',
      requiresNivel: false,
      requiresMateria: false,
      requiresGrado: false,
      hasSituaciones: false,
      rules: [
        {
          condition: () => true,
          step: 'documentos',
          description: 'Siempre documentos',
          priority: 100
        }
      ]
    });

    // TALLERES - Directo a documentos
    this.flowDefinitions.set('TALLERES', {
      categoria: 'TALLERES',
      steps: ['documentos'],
      initialStep: 'documentos',
      requiresNivel: false,
      requiresMateria: false,
      requiresGrado: false,
      hasSituaciones: false,
      rules: [
        {
          condition: () => true,
          step: 'documentos',
          description: 'Siempre documentos',
          priority: 100
        }
      ]
    });

    // Copiar flujo de PLANIFICACION para otras categorías similares
    const planificacionFlow = this.flowDefinitions.get('PLANIFICACION')!;
    ['EVALUACION', 'ESTRATEGIAS', 'RECURSOS', 'CONCURSOS', 'PLAN_LECTOR', 'REFORZAMIENTO'].forEach(cat => {
      this.flowDefinitions.set(cat as Categoria, {
        ...planificacionFlow,
        categoria: cat as Categoria
      });
    });
  }

  // ============ MÉTODOS PRIVADOS - LÓGICA DE ESTADO ============

  /**
   * Determina el paso actual para una categoría dados los filtros
   */
  private determineStepForCategory(
    categoria: Categoria,
    filters: FilterState,
    comingFromFilter: boolean
  ): CurrentStep {
    const flow = this.getFlowDefinition(categoria);
    
    // Ordenar reglas por prioridad (mayor primero)
    const sortedRules = [...flow.rules].sort((a, b) => b.priority - a.priority);
    
    // Evaluar reglas en orden de prioridad
    for (const rule of sortedRules) {
      if (rule.condition(filters, comingFromFilter)) {
        
        return rule.step;
      }
    }
    
    // Fallback (no debería llegar aquí si hay una regla default)
    return flow.initialStep;
  }

  /**
   * Calcula los flags de estado (shouldShow*, canTransitionTo, etc.)
   */
  private calculateStateFlags(
    categoria: Categoria,
    currentStep: CurrentStep,
    filters: FilterState
  ): Partial<CategoryState> {
    const flow = this.getFlowDefinition(categoria);
    
    return {
      canTransitionTo: this.calculatePossibleTransitions(flow, currentStep, filters),
      requiredFields: this.calculateRequiredFields(flow, currentStep),
      shouldShowDocuments: currentStep === 'documentos',
      shouldShowNiveles: currentStep === 'niveles',
      shouldShowMaterias: currentStep === 'materias' || (currentStep === 'documentos' && flow.requiresMateria),
      shouldShowGrados: currentStep === 'grados' || (flow.requiresGrado && !!filters.materia),
      shouldShowSituaciones: currentStep === 'situaciones' || (flow.hasSituaciones && !!filters.nivel)
    };
  }

  /**
   * Calcula las transiciones posibles desde el paso actual
   */
  private calculatePossibleTransitions(
    flow: CategoryFlowDefinition,
    currentStep: CurrentStep,
    filters: FilterState
  ): CurrentStep[] {
    const currentIndex = flow.steps.indexOf(currentStep);
    
    if (currentIndex === -1) {
      return [];
    }
    
    // Puede ir a pasos posteriores si tiene los campos requeridos
    const possibleSteps: CurrentStep[] = [];
    
    // Siempre puede volver a pasos anteriores
    for (let i = 0; i < currentIndex; i++) {
      possibleSteps.push(flow.steps[i]);
    }
    
    // El paso actual también se considera "alcanzable" (útil para guards UI)
    possibleSteps.push(currentStep);
    
    // Puede avanzar si cumple requisitos
    if (currentIndex < flow.steps.length - 1) {
      const nextStep = flow.steps[currentIndex + 1];
      const requiredFields = this.calculateRequiredFields(flow, nextStep);
      
      if (requiredFields.every(field => !!filters[field])) {
        possibleSteps.push(nextStep);
      }
    }
    
    return possibleSteps;
  }

  /**
   * Calcula los campos requeridos para estar en un paso
   */
  private calculateRequiredFields(
    flow: CategoryFlowDefinition,
    step: CurrentStep
  ): Array<keyof FilterState> {
    const required: Array<keyof FilterState> = [];
    
    const stepIndex = flow.steps.indexOf(step);
    
    // Los campos se requieren según el orden de pasos
    if (flow.requiresNivel && stepIndex > 0) {
      required.push('nivel');
    }
    
    if (flow.requiresMateria && stepIndex > 1) {
      required.push('materia');
    }
    
    if (flow.requiresGrado && stepIndex > 2) {
      required.push('grado');
    }
    
    if (flow.hasSituaciones && step === 'documentos') {
      required.push('situacion');
    }
    
    return required;
  }

  /**
   * Valida si una transición es posible
   */
  private validateTransition(
    currentState: CategoryState,
    targetStep: CurrentStep
  ): TransitionValidation {
    const flow = this.getFlowDefinition(currentState.categoria);
    
    // Verificar que el paso existe en el flujo
    if (!flow.steps.includes(targetStep)) {
      return {
        isValid: false,
        error: `El paso '${targetStep}' no es válido para la categoría ${currentState.categoria}`
      };
    }
    
    // Verificar campos requeridos
    const requiredFields = this.calculateRequiredFields(flow, targetStep);
    const missingFields = requiredFields.filter(field => !currentState.filters[field]);
    
    if (missingFields.length > 0) {
      return {
        isValid: false,
        error: `Faltan campos requeridos: ${missingFields.join(', ')}`,
        missingFields
      };
    }
    
    return { isValid: true };
  }

  /**
   * Obtiene la definición de flujo para una categoría
   */
  private getFlowDefinition(categoria: Categoria): CategoryFlowDefinition {
    const flow = this.flowDefinitions.get(categoria);
    
    if (!flow) {
      console.warn(`[StateMachine] No hay flujo definido para ${categoria}, usando PLANIFICACION por defecto`);
      return this.flowDefinitions.get('PLANIFICACION')!;
    }
    
    return flow;
  }

  /**
   * Emite un nuevo estado y registra el cambio en el historial
   */
  private emitState(newState: CategoryState, reason: string): void {
    const previousState = this.stateSubject.value;
    
    // Actualizar estado
    this.stateSubject.next(newState);
    
    // Registrar cambio en historial
    const changeEvent: StateChangeEvent = {
      previousState,
      newState,
      timestamp: new Date(),
      reason
    };
    
    this.history.push(changeEvent);
    
    // Limitar tamaño del historial
    if (this.history.length > this.MAX_HISTORY_SIZE) {
      this.history.shift();
    }
    
    // Emitir evento de cambio
    this.stateChangeSubject.next(changeEvent);
    
    
  }
}
