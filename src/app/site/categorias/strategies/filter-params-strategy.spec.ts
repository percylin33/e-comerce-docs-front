/**
 * Unit tests for FilterParamsStrategy implementations and Factory
 */

import { FilterParamsStrategyFactory } from './filter-params-strategy.factory';
import { FilterContext } from './filter-params-strategy.interface';
import {
  PlanificacionStrategy,
  KitsStrategy,
  MaterialGratisStrategy,
  EbooksStrategy,
  TalleresStrategy,
  ReforzamientoStrategy,
  PlanLectorStrategy
} from './filter-params-strategies';

describe('FilterParamsStrategies', () => {
  
  describe('PlanificacionStrategy', () => {
    let strategy: PlanificacionStrategy;
    
    beforeEach(() => {
      strategy = new PlanificacionStrategy();
    });
    
    it('should return PLANIFICACION as category', () => {
      expect(strategy.getCategory()).toBe('PLANIFICACION');
    });
    
    it('should add common filters (nivel, materia, grado)', () => {
      const context: FilterContext = {
        categoria: 'PLANIFICACION',
        selectedNivel: 'PRIMARIA',
        selectedMateria: 'MATEMATICA',
        selectedGrado: '1'
      };
      
      const params = strategy.buildParams(context);
      
      expect(params['nivel']).toBe('PRIMARIA');
      expect(params['materia']).toBe('MATEMATICA');
      expect(params['grado']).toBe('1');
    });
    
    it('should map SESIONES to PLANIFICACION category', () => {
      const context: FilterContext = {
        categoria: 'PLANIFICACION',
        selectedServicio: 'SESIONES'
      };
      
      const params = strategy.buildParams(context);
      
      expect(params['category']).toBe('PLANIFICACION');
      expect(params['format']).toBe('DOCX');
    });
    
    it('should use selectedServicio as category if not SESIONES', () => {
      const context: FilterContext = {
        categoria: 'PLANIFICACION',
        selectedServicio: 'EVALUACION'
      };
      
      const params = strategy.buildParams(context);
      
      expect(params['category']).toBe('EVALUACION');
      expect(params['format']).toBe('DOCX');
    });
    
    it('should always add DOCX format', () => {
      const context: FilterContext = {
        categoria: 'PLANIFICACION',
        selectedServicio: 'RECURSOS'
      };
      
      const params = strategy.buildParams(context);
      
      expect(params['format']).toBe('DOCX');
    });
  });
  
  describe('KitsStrategy', () => {
    let strategy: KitsStrategy;
    
    beforeEach(() => {
      strategy = new KitsStrategy();
    });
    
    it('should return KITS as category', () => {
      expect(strategy.getCategory()).toBe('KITS');
    });
    
    it('should prefer targetCategoryId over category string', () => {
      const context: FilterContext = {
        categoria: 'KITS',
        targetCategoryId: 1,
        selectedNivel: 'SECUNDARIA',
        selectedMateria: 'MATEMATICA'
      };
      
      const params = strategy.buildParams(context);
      
      expect(params['categoryId']).toBe('1');
      expect(params['category']).toBeUndefined();
      expect(params['format']).toBe('ZIP');
      expect(params['suscripcion']).toBe('false');
      expect(params['esKitPlanificacion']).toBe('true');
      expect(params['kitEstado']).toBe('APROBADO');
      expect(params['nivel']).toBe('SECUNDARIA');
      expect(params['materia']).toBe('MATEMATICA');
    });

    it('should fallback to PLANIFICACION category string when no targetCategoryId', () => {
      const context: FilterContext = {
        categoria: 'KITS',
        selectedNivel: 'SECUNDARIA',
        selectedMateria: 'MATEMATICA'
      };
      
      const params = strategy.buildParams(context);
      
      expect(params['category']).toBe('PLANIFICACION');
      expect(params['categoryId']).toBeUndefined();
      expect(params['format']).toBe('ZIP');
      expect(params['suscripcion']).toBe('false');
      expect(params['esKitPlanificacion']).toBe('true');
      expect(params['kitEstado']).toBe('APROBADO');
    });
  });
  
  describe('MaterialGratisStrategy', () => {
    let strategy: MaterialGratisStrategy;
    
    beforeEach(() => {
      strategy = new MaterialGratisStrategy();
    });
    
    it('should return MATERIAL_GRATIS as category', () => {
      expect(strategy.getCategory()).toBe('MATERIAL_GRATIS');
    });
    
    it('should use documentoLibre flag instead of category', () => {
      const context: FilterContext = {
        categoria: 'MATERIAL_GRATIS'
      };
      
      const params = strategy.buildParams(context);
      
      expect(params['documentoLibre']).toBe('true');
      expect(params['category']).toBeUndefined();
    });
    
    it('should still include common filters if present', () => {
      const context: FilterContext = {
        categoria: 'MATERIAL_GRATIS',
        selectedNivel: 'PRIMARIA'
      };
      
      const params = strategy.buildParams(context);
      
      expect(params['documentoLibre']).toBe('true');
      expect(params['nivel']).toBe('PRIMARIA');
    });
  });
  
  describe('EbooksStrategy', () => {
    let strategy: EbooksStrategy;
    
    beforeEach(() => {
      strategy = new EbooksStrategy();
    });
    
    it('should return EBOOKS as category', () => {
      expect(strategy.getCategory()).toBe('EBOOKS');
    });
    
    it('should use EBOOKS as category', () => {
      const context: FilterContext = {
        categoria: 'EBOOKS'
      };
      
      const params = strategy.buildParams(context);
      
      expect(params['category']).toBe('EBOOKS');
      expect(params['format']).toBeUndefined();
    });
    
    it('should default to EBOOKS category', () => {
      const context: FilterContext = {
        categoria: 'EBOOKS'
      };
      
      const params = strategy.buildParams(context);
      
      expect(params['category']).toBe('EBOOKS');
    });
  });
  
  describe('TalleresStrategy', () => {
    let strategy: TalleresStrategy;
    
    beforeEach(() => {
      strategy = new TalleresStrategy();
    });
    
    it('should return TALLERES as category', () => {
      expect(strategy.getCategory()).toBe('TALLERES');
    });
    
    it('should use TALLERES category with ZIP format', () => {
      const context: FilterContext = {
        categoria: 'TALLERES'
      };
      
      const params = strategy.buildParams(context);
      
      expect(params['category']).toBe('TALLERES');
      expect(params['format']).toBe('ZIP');
    });
  });
  
  describe('ReforzamientoStrategy', () => {
    let strategy: ReforzamientoStrategy;
    
    beforeEach(() => {
      strategy = new ReforzamientoStrategy();
    });
    
    it('should return REFORZAMIENTO as category', () => {
      expect(strategy.getCategory()).toBe('REFORZAMIENTO');
    });
    
    it('should use REFORZAMIENTO category without format restriction', () => {
      const context: FilterContext = {
        categoria: 'REFORZAMIENTO',
        selectedNivel: 'PRIMARIA'
      };
      
      const params = strategy.buildParams(context);
      
      expect(params['category']).toBe('REFORZAMIENTO');
      expect(params['format']).toBeUndefined();
      expect(params['nivel']).toBe('PRIMARIA');
    });
  });
  
  describe('PlanLectorStrategy', () => {
    let strategy: PlanLectorStrategy;
    
    beforeEach(() => {
      strategy = new PlanLectorStrategy();
    });
    
    it('should return PLAN_LECTOR as category', () => {
      expect(strategy.getCategory()).toBe('PLAN_LECTOR');
    });
    
    it('should use PLAN_LECTOR category without format restriction', () => {
      const context: FilterContext = {
        categoria: 'PLAN_LECTOR',
        selectedNivel: 'SECUNDARIA',
        selectedGrado: '3'
      };
      
      const params = strategy.buildParams(context);
      
      expect(params['category']).toBe('PLAN_LECTOR');
      expect(params['format']).toBeUndefined();
      expect(params['nivel']).toBe('SECUNDARIA');
      expect(params['grado']).toBe('3');
    });
  });
});

describe('FilterParamsStrategyFactory', () => {
  let factory: FilterParamsStrategyFactory;
  
  beforeEach(() => {
    factory = new FilterParamsStrategyFactory();
  });
  
  it('should create instance', () => {
    expect(factory).toBeTruthy();
  });
  
  it('should return PlanificacionStrategy for PLANIFICACION', () => {
    const strategy = factory.getStrategy('PLANIFICACION');
    expect(strategy instanceof PlanificacionStrategy).toBe(true);
  });
  
  it('should return KitsStrategy for KITS', () => {
    const strategy = factory.getStrategy('KITS');
    expect(strategy instanceof KitsStrategy).toBe(true);
  });
  
  it('should return MaterialGratisStrategy for MATERIAL_GRATIS', () => {
    const strategy = factory.getStrategy('MATERIAL_GRATIS');
    expect(strategy instanceof MaterialGratisStrategy).toBe(true);
  });
  
  it('should return EbooksStrategy for EBOOKS', () => {
    const strategy = factory.getStrategy('EBOOKS');
    expect(strategy instanceof EbooksStrategy).toBe(true);
  });
  
  it('should return TalleresStrategy for TALLERES', () => {
    const strategy = factory.getStrategy('TALLERES');
    expect(strategy instanceof TalleresStrategy).toBe(true);
  });
  
  it('should return ReforzamientoStrategy for REFORZAMIENTO', () => {
    const strategy = factory.getStrategy('REFORZAMIENTO');
    expect(strategy instanceof ReforzamientoStrategy).toBe(true);
  });
  
  it('should return PlanLectorStrategy for PLAN_LECTOR', () => {
    const strategy = factory.getStrategy('PLAN_LECTOR');
    expect(strategy instanceof PlanLectorStrategy).toBe(true);
  });
  
  it('should throw error for unknown category', () => {
    expect(() => factory.getStrategy('UNKNOWN' as any)).toThrowError();
  });
  
  it('should return true for hasStrategy with valid category', () => {
    expect(factory.hasStrategy('PLANIFICACION')).toBe(true);
    expect(factory.hasStrategy('KITS')).toBe(true);
  });
  
  it('should return false for hasStrategy with invalid category', () => {
    expect(factory.hasStrategy('INVALID' as any)).toBe(false);
  });
  
  it('should return all registered categories', () => {
    const categories = factory.getRegisteredCategories();
    
    expect(categories).toContain('PLANIFICACION');
    expect(categories).toContain('KITS');
    expect(categories).toContain('MATERIAL_GRATIS');
    expect(categories).toContain('EBOOKS');
    expect(categories).toContain('TALLERES');
    expect(categories).toContain('REFORZAMIENTO');
    expect(categories).toContain('PLAN_LECTOR');
    expect(categories).toContain('EVALUACION');
    expect(categories).toContain('CONCURSOS');
    expect(categories).toContain('RECURSOS');
    expect(categories).toContain('ESTRATEGIAS');
    
    expect(categories.length).toBe(11);
  });
  
  it('should always return same strategy instance for same category', () => {
    const strategy1 = factory.getStrategy('KITS');
    const strategy2 = factory.getStrategy('KITS');
    
    expect(strategy1).toBe(strategy2);
  });
  
  describe('Integration Tests', () => {
    it('should build correct params for KITS with full context', () => {
      const strategy = factory.getStrategy('KITS');
      const context: FilterContext = {
        categoria: 'KITS',
        targetCategoryId: 1,
        selectedNivel: 'SECUNDARIA',
        selectedMateria: 'CIENCIA Y TECNOLOGIA',
        selectedGrado: '1'
      };
      
      const params = strategy.buildParams(context);
      
      expect(params['nivel']).toBe('SECUNDARIA');
      expect(params['materia']).toBe('CIENCIA Y TECNOLOGIA');
      expect(params['grado']).toBe('1');
      expect(params['categoryId']).toBe('1');
      expect(params['format']).toBe('ZIP');
      expect(params['suscripcion']).toBe('false');
      expect(params['esKitPlanificacion']).toBe('true');
      expect(params['kitEstado']).toBe('APROBADO');
    });
    
    it('should build correct params for EBOOKS', () => {
      const strategy = factory.getStrategy('EBOOKS');
      
      const context: FilterContext = {
        categoria: 'EBOOKS'
      };
      const params = strategy.buildParams(context);
      expect(params['category']).toBe('EBOOKS');
      expect(params['format']).toBeUndefined();
    });
    
    it('should build correct params for PLANIFICACION with SESIONES', () => {
      const strategy = factory.getStrategy('PLANIFICACION');
      const context: FilterContext = {
        categoria: 'PLANIFICACION',
        selectedNivel: 'PRIMARIA',
        selectedMateria: 'MATEMATICA',
        selectedServicio: 'SESIONES'
      };
      
      const params = strategy.buildParams(context);
      
      expect(params['nivel']).toBe('PRIMARIA');
      expect(params['materia']).toBe('MATEMATICA');
      expect(params['category']).toBe('PLANIFICACION');
      expect(params['format']).toBe('DOCX');
    });
  });
});
