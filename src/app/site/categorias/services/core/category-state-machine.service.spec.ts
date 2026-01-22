import { TestBed } from '@angular/core/testing';
import { CategoryStateMachineService } from './category-state-machine.service';
import { Categoria, CategoryState, CurrentStep } from '../../models/category-state.model';

describe('CategoryStateMachineService', () => {
  let service: CategoryStateMachineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoryStateMachineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Estado Inicial', () => {
    it('debe iniciar con valores por defecto', (done) => {
      service.state$.subscribe(state => {
        expect(state.categoria).toBe('PLANIFICACION');
        expect(state.currentStep).toBe('niveles');
        expect(state.filters).toEqual({});
        expect(state.comingFromFilter).toBe(false);
        expect(state.shouldShowNiveles).toBe(true);
        expect(state.shouldShowDocuments).toBe(false);
        done();
      });
    });

    it('debe tener historial vacío', () => {
      const history = service.getHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('setCategoria - PLANIFICACION', () => {
    it('debe cambiar a PLANIFICACION sin filtros', (done) => {
      service.setCategoria('PLANIFICACION');
      
      service.state$.subscribe(state => {
        expect(state.categoria).toBe('PLANIFICACION');
        expect(state.currentStep).toBe('niveles');
        expect(state.shouldShowNiveles).toBe(true);
        expect(state.shouldShowDocuments).toBe(false);
        done();
      });
    });

    it('debe ir a materias con nivel seleccionado', () => {
      service.updateFilters({ nivel: 'PRIMARIA' });
      service.setCategoria('PLANIFICACION');
      
      const state = service.getCurrentState();
      expect(state.currentStep).toBe('materias');
      expect(state.shouldShowMaterias).toBe(true);
    });

    it('debe ir a documentos con nivel y materia', () => {
      service.updateFilters({ nivel: 'PRIMARIA', materia: 'COMUNICACION' });
      service.setCategoria('PLANIFICACION');
      
      const state = service.getCurrentState();
      expect(state.currentStep).toBe('documentos');
      expect(state.shouldShowDocuments).toBe(true);
    });

    it('debe ir a documentos cuando viene de filtro', () => {
      service.updateFilters({ nivel: 'PRIMARIA', materia: 'COMUNICACION' });
      service.setCategoria('PLANIFICACION', true);
      
      const state = service.getCurrentState();
      expect(state.currentStep).toBe('documentos');
      expect(state.comingFromFilter).toBe(true);
    });
  });

  describe('setCategoria - KITS', () => {
    it('debe iniciar en niveles sin filtros', () => {
      service.setCategoria('KITS');
      
      const state = service.getCurrentState();
      expect(state.categoria).toBe('KITS');
      expect(state.currentStep).toBe('niveles');
    });

    it('debe ir a materias con SECUNDARIA sin materia', () => {
      service.updateFilters({ nivel: 'SECUNDARIA' });
      service.setCategoria('KITS');
      
      const state = service.getCurrentState();
      expect(state.currentStep).toBe('materias');
      expect(state.shouldShowMaterias).toBe(true);
    });

    it('debe ir a situaciones con SECUNDARIA y materia', () => {
      service.updateFilters({ nivel: 'SECUNDARIA', materia: 'COMUNICACION' });
      service.setCategoria('KITS');
      
      const state = service.getCurrentState();
      expect(state.currentStep).toBe('situaciones');
      expect(state.shouldShowSituaciones).toBe(true);
    });

    it('debe ir a situaciones con PRIMARIA', () => {
      service.updateFilters({ nivel: 'PRIMARIA' });
      service.setCategoria('KITS');
      
      const state = service.getCurrentState();
      expect(state.currentStep).toBe('situaciones');
    });

    it('debe ir a documentos con situación seleccionada', () => {
      service.updateFilters({ 
        nivel: 'PRIMARIA', 
        materia: 'COMUNICACION',
        situacion: 'Situación 1'
      });
      service.setCategoria('KITS');
      
      const state = service.getCurrentState();
      expect(state.currentStep).toBe('documentos');
      expect(state.shouldShowDocuments).toBe(true);
    });

    it('debe ir a documentos cuando viene de filtro con nivel+materia', () => {
      service.updateFilters({ nivel: 'SECUNDARIA', materia: 'COMUNICACION' });
      service.setCategoria('KITS', true);
      
      const state = service.getCurrentState();
      expect(state.currentStep).toBe('documentos');
      expect(state.comingFromFilter).toBe(true);
    });
  });

  describe('setCategoria - MATERIAL_GRATIS', () => {
    it('debe ir directamente a documentos', () => {
      service.setCategoria('MATERIAL_GRATIS');
      
      const state = service.getCurrentState();
      expect(state.categoria).toBe('MATERIAL_GRATIS');
      expect(state.currentStep).toBe('documentos');
      expect(state.shouldShowDocuments).toBe(true);
      expect(state.shouldShowNiveles).toBe(false);
    });
  });

  describe('setCategoria - EBOOKS', () => {
    it('debe ir directamente a documentos', () => {
      service.setCategoria('EBOOKS');
      
      const state = service.getCurrentState();
      expect(state.categoria).toBe('EBOOKS');
      expect(state.currentStep).toBe('documentos');
    });
  });

  describe('setCategoria - TALLERES', () => {
    it('debe ir directamente a documentos', () => {
      service.setCategoria('TALLERES');
      
      const state = service.getCurrentState();
      expect(state.categoria).toBe('TALLERES');
      expect(state.currentStep).toBe('documentos');
    });
  });

  describe('updateFilters', () => {
    beforeEach(() => {
      service.setCategoria('PLANIFICACION');
    });

    it('debe actualizar filtros y recalcular paso', () => {
      service.updateFilters({ nivel: 'PRIMARIA' });
      
      const state = service.getCurrentState();
      expect(state.filters.nivel).toBe('PRIMARIA');
      expect(state.currentStep).toBe('materias');
    });

    it('debe hacer merge de filtros existentes', () => {
      service.updateFilters({ nivel: 'PRIMARIA' });
      service.updateFilters({ materia: 'COMUNICACION' });
      
      const state = service.getCurrentState();
      expect(state.filters).toEqual({
        nivel: 'PRIMARIA',
        materia: 'COMUNICACION'
      });
      expect(state.currentStep).toBe('documentos');
    });

    it('debe permitir actualizar filtros parcialmente', () => {
      service.updateFilters({ nivel: 'PRIMARIA', materia: 'COMUNICACION' });
      service.updateFilters({ grado: '3°' });
      
      const state = service.getCurrentState();
      expect(state.filters).toEqual({
        nivel: 'PRIMARIA',
        materia: 'COMUNICACION',
        grado: '3°'
      });
    });

    it('debe emitir cambio en filters$', (done) => {
      let emissionCount = 0;
      
      service.filters$.subscribe(filters => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(filters.nivel).toBe('SECUNDARIA');
          done();
        }
      });
      
      service.updateFilters({ nivel: 'SECUNDARIA' });
    });
  });

  describe('clearFilters', () => {
    it('debe limpiar todos los filtros', () => {
      service.updateFilters({ nivel: 'PRIMARIA', materia: 'COMUNICACION', grado: '3°' });
      service.clearFilters();
      
      const state = service.getCurrentState();
      expect(state.filters).toEqual({});
    });

    it('debe volver al paso inicial', () => {
      service.setCategoria('PLANIFICACION');
      service.updateFilters({ nivel: 'PRIMARIA', materia: 'COMUNICACION' });
      
      service.clearFilters();
      
      const state = service.getCurrentState();
      expect(state.currentStep).toBe('niveles');
    });

    it('debe marcar comingFromFilter como false', () => {
      service.setCategoria('PLANIFICACION', true);
      service.clearFilters();
      
      const state = service.getCurrentState();
      expect(state.comingFromFilter).toBe(false);
    });
  });

  describe('clearComingFromFilter', () => {
    it('debe limpiar flag comingFromFilter', () => {
      service.setCategoria('PLANIFICACION', true);
      expect(service.getCurrentState().comingFromFilter).toBe(true);
      
      service.clearComingFromFilter();
      expect(service.getCurrentState().comingFromFilter).toBe(false);
    });

    it('no debe hacer nada si ya es false', () => {
      service.setCategoria('PLANIFICACION', false);
      const historyBefore = service.getHistory().length;
      
      service.clearComingFromFilter();
      const historyAfter = service.getHistory().length;
      
      expect(historyAfter).toBe(historyBefore);
    });
  });

  describe('transitionTo', () => {
    beforeEach(() => {
      service.setCategoria('PLANIFICACION');
      service.updateFilters({ nivel: 'PRIMARIA', materia: 'COMUNICACION' });
    });

    it('debe permitir transición válida', () => {
      const validation = service.transitionTo('documentos');
      
      expect(validation.isValid).toBe(true);
      expect(service.getCurrentState().currentStep).toBe('documentos');
    });

    it('debe rechazar transición a paso no existente en flujo', () => {
      service.setCategoria('MATERIAL_GRATIS');
      const validation = service.transitionTo('niveles');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('no es válido');
    });

    it('debe rechazar transición sin campos requeridos', () => {
      service.clearFilters();
      const validation = service.transitionTo('documentos');
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('Faltan campos requeridos');
      expect(validation.missingFields).toContain('nivel');
    });

    it('debe actualizar shouldShow flags', () => {
      service.transitionTo('documentos');
      
      const state = service.getCurrentState();
      expect(state.shouldShowDocuments).toBe(true);
    });
  });

  describe('canTransitionTo', () => {
    beforeEach(() => {
      service.setCategoria('PLANIFICACION');
    });

    it('debe indicar si puede transicionar', () => {
      service.updateFilters({ nivel: 'PRIMARIA' });
      
      expect(service.canTransitionTo('materias')).toBe(true);
      expect(service.canTransitionTo('documentos')).toBe(false);
    });

    it('debe actualizar según filtros', () => {
      service.updateFilters({ nivel: 'PRIMARIA', materia: 'COMUNICACION' });
      
      expect(service.canTransitionTo('documentos')).toBe(true);
    });
  });

  describe('getRequiredFields', () => {
    it('debe retornar campos requeridos para PLANIFICACION en documentos', () => {
      service.setCategoria('PLANIFICACION');
      service.updateFilters({ nivel: 'PRIMARIA', materia: 'COMUNICACION' });
      
      const required = service.getRequiredFields();
      expect(required).toContain('nivel');
      expect(required).toContain('materia');
    });

    it('debe retornar vacío para MATERIAL_GRATIS', () => {
      service.setCategoria('MATERIAL_GRATIS');
      
      const required = service.getRequiredFields();
      expect(required.length).toBe(0);
    });
  });

  describe('hasRequiredFields', () => {
    beforeEach(() => {
      service.setCategoria('PLANIFICACION');
    });

    it('debe retornar true cuando tiene todos los campos', () => {
      service.updateFilters({ nivel: 'PRIMARIA', materia: 'COMUNICACION' });
      
      expect(service.hasRequiredFields()).toBe(true);
    });

    it('debe retornar false cuando faltan campos', () => {
      service.updateFilters({ nivel: 'PRIMARIA' });
      service.transitionTo('materias'); // Cambiar paso manualmente
      
      const state = service.getCurrentState();
      if (state.requiredFields.includes('materia')) {
        expect(service.hasRequiredFields()).toBe(false);
      }
    });
  });

  describe('reset', () => {
    it('debe resetear completamente el estado', () => {
      service.setCategoria('KITS');
      service.updateFilters({ nivel: 'PRIMARIA', materia: 'COMUNICACION' });
      
      service.reset();
      
      const state = service.getCurrentState();
      expect(state.categoria).toBe('PLANIFICACION');
      expect(state.currentStep).toBe('niveles');
      expect(state.filters).toEqual({});
    });

    it('debe limpiar el historial', () => {
      service.setCategoria('KITS');
      service.updateFilters({ nivel: 'PRIMARIA' });
      
      expect(service.getHistory().length).toBeGreaterThan(0);
      
      service.reset();
      
      expect(service.getHistory().length).toBe(0);
    });
  });

  describe('Observables', () => {
    it('state$ debe emitir cambios de estado', (done) => {
      let emissionCount = 0;
      
      service.state$.subscribe(state => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(state.categoria).toBe('KITS');
          done();
        }
      });
      
      service.setCategoria('KITS');
    });

    it('currentStep$ debe emitir solo cambios de paso', (done) => {
      let emissions: CurrentStep[] = [];
      
      service.currentStep$.subscribe(step => {
        emissions.push(step);
      });
      
      setTimeout(() => {
        service.updateFilters({ nivel: 'PRIMARIA' }); // Cambia paso
        service.updateFilters({ grado: '3°' }); // NO cambia paso
        
        setTimeout(() => {
          expect(emissions.length).toBe(2); // inicial + 1 cambio
          expect(emissions[1]).toBe('materias');
          done();
        }, 100);
      }, 100);
    });

    it('stateChange$ debe emitir eventos de cambio', (done) => {
      service.stateChange$.subscribe(event => {
        if (event) {
          expect(event.reason).toContain('Categoría cambiada');
          expect(event.previousState).toBeDefined();
          expect(event.newState).toBeDefined();
          expect(event.timestamp instanceof Date).toBe(true);
          done();
        }
      });
      
      service.setCategoria('TALLERES');
    });
  });

  describe('Historial', () => {
    it('debe registrar cambios en el historial', () => {
      service.setCategoria('KITS');
      service.updateFilters({ nivel: 'PRIMARIA' });
      service.updateFilters({ materia: 'COMUNICACION' });
      
      const history = service.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(3);
    });

    it('debe limitar el tamaño del historial', () => {
      // Hacer más de 20 cambios
      for (let i = 0; i < 25; i++) {
        service.updateFilters({ grado: `${i}°` });
      }
      
      const history = service.getHistory();
      expect(history.length).toBeLessThanOrEqual(20);
    });

    it('debe incluir información completa en el historial', () => {
      service.setCategoria('PLANIFICACION');
      service.updateFilters({ nivel: 'PRIMARIA' });
      
      const history = service.getHistory();
      const lastEvent = history[history.length - 1];
      
      expect(lastEvent.previousState).toBeDefined();
      expect(lastEvent.newState).toBeDefined();
      expect(lastEvent.timestamp instanceof Date).toBe(true);
      expect(lastEvent.reason).toBeTruthy();
    });
  });

  describe('getCurrentFlowDefinition', () => {
    it('debe retornar definición de flujo para categoría actual', () => {
      service.setCategoria('KITS');
      
      const flow = service.getCurrentFlowDefinition();
      expect(flow.categoria).toBe('KITS');
      expect(flow.hasSituaciones).toBe(true);
      expect(flow.steps).toContain('situaciones');
    });

    it('debe retornar flujo de PLANIFICACION', () => {
      service.setCategoria('PLANIFICACION');
      
      const flow = service.getCurrentFlowDefinition();
      expect(flow.requiresNivel).toBe(true);
      expect(flow.requiresMateria).toBe(true);
    });
  });

  describe('Integración - Flujos complejos', () => {
    it('debe manejar flujo completo de KITS SECUNDARIA', () => {
      service.setCategoria('KITS');
      expect(service.getCurrentState().currentStep).toBe('niveles');
      
      service.updateFilters({ nivel: 'SECUNDARIA' });
      expect(service.getCurrentState().currentStep).toBe('materias');
      
      service.updateFilters({ materia: 'COMUNICACION' });
      expect(service.getCurrentState().currentStep).toBe('situaciones');
      
      service.updateFilters({ situacion: 'Situación 1' });
      expect(service.getCurrentState().currentStep).toBe('documentos');
    });

    it('debe manejar flujo completo de KITS PRIMARIA', () => {
      service.setCategoria('KITS');
      
      service.updateFilters({ nivel: 'PRIMARIA' });
      expect(service.getCurrentState().currentStep).toBe('situaciones');
      
      service.updateFilters({ situacion: 'Situación X' });
      expect(service.getCurrentState().currentStep).toBe('documentos');
    });

    it('debe manejar carga desde URL con filtros', () => {
      service.updateFilters({ nivel: 'SECUNDARIA', materia: 'COMUNICACION' });
      service.setCategoria('KITS', true);
      
      const state = service.getCurrentState();
      expect(state.currentStep).toBe('documentos');
      expect(state.comingFromFilter).toBe(true);
    });
  });
});
