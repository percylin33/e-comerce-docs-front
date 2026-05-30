import { TestBed } from '@angular/core/testing';
import { FilterVisibilityService } from './filter-visibility.service';

describe('FilterVisibilityService', () => {
  let service: FilterVisibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FilterVisibilityService]
    });
    service = TestBed.inject(FilterVisibilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Grupo 1: KITS, REFORZAMIENTO, PLAN_LECTOR, EVALUACION', () => {
    
    describe('KITS', () => {
      it('debe mostrar carta de nivel cuando URL sin parámetros', () => {
        const visibility = service.calculateVisibility('KITS', {});
        
        expect(visibility.shouldShowNivelCard).toBe(true);
        expect(visibility.shouldShowMateriaCard).toBe(false);
        expect(visibility.shouldShowGradoCard).toBe(false);
        expect(visibility.initialStep).toBe('niveles');
      });

      it('debe mostrar carta de materia cuando URL trae solo nivel', () => {
        const visibility = service.calculateVisibility('KITS', { nivel: 'PRIMARIA' });
        
        expect(visibility.shouldShowNivelCard).toBe(false);
        expect(visibility.shouldShowMateriaCard).toBe(true);
        expect(visibility.shouldShowGradoCard).toBe(false);
        expect(visibility.initialStep).toBe('materias');
        expect(visibility.preselectedNivel).toBe('PRIMARIA');
      });

      it('debe ocultar todas las cartas cuando URL trae nivel + materia', () => {
        const visibility = service.calculateVisibility('KITS', { 
          nivel: 'PRIMARIA', 
          materia: 'MATEMATICA' 
        });
        
        expect(visibility.shouldShowNivelCard).toBe(false);
        expect(visibility.shouldShowMateriaCard).toBe(false);
        expect(visibility.shouldShowGradoCard).toBe(false);
        expect(visibility.initialStep).toBe('documentos');
        expect(visibility.preselectedNivel).toBe('PRIMARIA');
        expect(visibility.preselectedMateria).toBe('MATEMATICA');
      });

      it('debe preservar grado cuando viene en URL', () => {
        const visibility = service.calculateVisibility('KITS', { 
          nivel: 'PRIMARIA', 
          materia: 'MATEMATICA',
          grado: '3'
        });
        
        expect(visibility.preselectedGrado).toBe('3');
        expect(visibility.initialStep).toBe('documentos');
      });
    });

    describe('REFORZAMIENTO', () => {
      it('debe mostrar carta de nivel cuando URL sin parámetros', () => {
        const visibility = service.calculateVisibility('REFORZAMIENTO', {});
        
        expect(visibility.shouldShowNivelCard).toBe(true);
        expect(visibility.shouldShowMateriaCard).toBe(false);
        expect(visibility.initialStep).toBe('niveles');
      });

      it('debe mostrar carta de materia cuando URL trae nivel', () => {
        const visibility = service.calculateVisibility('REFORZAMIENTO', { nivel: 'SECUNDARIA' });
        
        expect(visibility.shouldShowNivelCard).toBe(false);
        expect(visibility.shouldShowMateriaCard).toBe(true);
        expect(visibility.initialStep).toBe('materias');
      });

      it('debe ir a documentos cuando URL trae nivel + materia', () => {
        const visibility = service.calculateVisibility('REFORZAMIENTO', { 
          nivel: 'SECUNDARIA', 
          materia: 'COMUNICACION' 
        });
        
        expect(visibility.shouldShowNivelCard).toBe(false);
        expect(visibility.shouldShowMateriaCard).toBe(false);
        expect(visibility.initialStep).toBe('documentos');
      });
    });

    describe('PLAN_LECTOR', () => {
      it('debe seguir mismas reglas que grupo 1', () => {
        const emptyUrl = service.calculateVisibility('PLAN_LECTOR', {});
        const withNivel = service.calculateVisibility('PLAN_LECTOR', { nivel: 'PRIMARIA' });
        const withBoth = service.calculateVisibility('PLAN_LECTOR', { 
          nivel: 'PRIMARIA', 
          materia: 'COMUNICACION' 
        });
        
        expect(emptyUrl.initialStep).toBe('niveles');
        expect(withNivel.initialStep).toBe('materias');
        expect(withBoth.initialStep).toBe('documentos');
      });
    });

    describe('EVALUACION', () => {
      it('debe seguir mismas reglas que grupo 1', () => {
        const emptyUrl = service.calculateVisibility('EVALUACION', {});
        const withNivel = service.calculateVisibility('EVALUACION', { nivel: 'PRIMARIA' });
        const withBoth = service.calculateVisibility('EVALUACION', { 
          nivel: 'PRIMARIA', 
          materia: 'MATEMATICA' 
        });
        
        expect(emptyUrl.shouldShowNivelCard).toBe(true);
        expect(withNivel.shouldShowMateriaCard).toBe(true);
        expect(withBoth.shouldShowNivelCard).toBe(false);
        expect(withBoth.shouldShowMateriaCard).toBe(false);
      });
    });
  });

  describe('Grupo 2: ESTRATEGIAS, RECURSOS', () => {
    
    describe('ESTRATEGIAS', () => {
      it('debe mostrar solo carta de nivel cuando URL sin parámetros', () => {
        const visibility = service.calculateVisibility('ESTRATEGIAS', {});
        
        expect(visibility.shouldShowNivelCard).toBe(true);
        expect(visibility.shouldShowMateriaCard).toBe(false);
        expect(visibility.shouldShowGradoCard).toBe(false);
        expect(visibility.initialStep).toBe('niveles');
      });

      it('debe ocultar carta e ir a documentos cuando URL trae nivel', () => {
        const visibility = service.calculateVisibility('ESTRATEGIAS', { nivel: 'PRIMARIA' });
        
        expect(visibility.shouldShowNivelCard).toBe(false);
        expect(visibility.shouldShowMateriaCard).toBe(false);
        expect(visibility.initialStep).toBe('documentos');
        expect(visibility.preselectedNivel).toBe('PRIMARIA');
      });

      it('debe ir a documentos cuando URL trae nivel + materia', () => {
        const visibility = service.calculateVisibility('ESTRATEGIAS', { 
          nivel: 'PRIMARIA', 
          materia: 'MATEMATICA' 
        });
        
        expect(visibility.shouldShowNivelCard).toBe(false);
        expect(visibility.shouldShowMateriaCard).toBe(false);
        expect(visibility.initialStep).toBe('documentos');
      });
    });

    describe('RECURSOS', () => {
      it('debe mostrar solo carta de nivel cuando URL sin parámetros', () => {
        const visibility = service.calculateVisibility('RECURSOS', {});
        
        expect(visibility.shouldShowNivelCard).toBe(true);
        expect(visibility.shouldShowMateriaCard).toBe(false);
        expect(visibility.initialStep).toBe('niveles');
      });

      it('debe ocultar carta cuando URL trae nivel', () => {
        const visibility = service.calculateVisibility('RECURSOS', { nivel: 'SECUNDARIA' });
        
        expect(visibility.shouldShowNivelCard).toBe(false);
        expect(visibility.initialStep).toBe('documentos');
      });
    });
  });

  describe('Grupo 3: EBOOKS, TALLERES, MATERIAL_GRATIS', () => {
    
    describe('EBOOKS', () => {
      it('nunca debe mostrar cartas', () => {
        const visibility = service.calculateVisibility('EBOOKS', {});
        
        expect(visibility.shouldShowNivelCard).toBe(false);
        expect(visibility.shouldShowMateriaCard).toBe(false);
        expect(visibility.shouldShowGradoCard).toBe(false);
      });

      it('siempre debe ir directo a documentos', () => {
        const emptyUrl = service.calculateVisibility('EBOOKS', {});
        const withNivel = service.calculateVisibility('EBOOKS', { nivel: 'PRIMARIA' });
        const withBoth = service.calculateVisibility('EBOOKS', { 
          nivel: 'PRIMARIA', 
          materia: 'MATEMATICA' 
        });
        
        expect(emptyUrl.initialStep).toBe('documentos');
        expect(withNivel.initialStep).toBe('documentos');
        expect(withBoth.initialStep).toBe('documentos');
      });

      it('debe preservar parámetros URL aunque no muestre cartas', () => {
        const visibility = service.calculateVisibility('EBOOKS', { 
          nivel: 'PRIMARIA', 
          materia: 'MATEMATICA',
          grado: '5'
        });
        
        expect(visibility.preselectedNivel).toBe('PRIMARIA');
        expect(visibility.preselectedMateria).toBe('MATEMATICA');
        expect(visibility.preselectedGrado).toBe('5');
      });
    });

    describe('TALLERES', () => {
      it('nunca debe mostrar cartas', () => {
        const visibility = service.calculateVisibility('TALLERES', {});
        
        expect(visibility.shouldShowNivelCard).toBe(false);
        expect(visibility.shouldShowMateriaCard).toBe(false);
      });

      it('siempre debe ir a documentos', () => {
        const visibility = service.calculateVisibility('TALLERES', { nivel: 'SECUNDARIA' });
        expect(visibility.initialStep).toBe('documentos');
      });
    });

    describe('MATERIAL_GRATIS', () => {
      it('nunca debe mostrar cartas', () => {
        const visibility = service.calculateVisibility('MATERIAL_GRATIS', {});
        
        expect(visibility.shouldShowNivelCard).toBe(false);
        expect(visibility.shouldShowMateriaCard).toBe(false);
      });

      it('siempre debe ir a documentos', () => {
        const visibility = service.calculateVisibility('MATERIAL_GRATIS', {});
        expect(visibility.initialStep).toBe('documentos');
      });
    });
  });

  describe('shouldShowCards', () => {
    it('debe retornar true para categorías con cartas (Grupo 1)', () => {
      expect(service.shouldShowCards('KITS')).toBe(true);
      expect(service.shouldShowCards('REFORZAMIENTO')).toBe(true);
      expect(service.shouldShowCards('PLAN_LECTOR')).toBe(true);
      expect(service.shouldShowCards('EVALUACION')).toBe(true);
    });

    it('debe retornar true para categorías con carta de nivel (Grupo 2)', () => {
      expect(service.shouldShowCards('ESTRATEGIAS')).toBe(true);
      expect(service.shouldShowCards('RECURSOS')).toBe(true);
    });

    it('debe retornar false para categorías sin cartas (Grupo 3)', () => {
      expect(service.shouldShowCards('EBOOKS')).toBe(false);
      expect(service.shouldShowCards('TALLERES')).toBe(false);
      expect(service.shouldShowCards('MATERIAL_GRATIS')).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('debe retornar configuración válida para todas las categorías', () => {
      const categories: Array<any> = [
        'KITS', 'REFORZAMIENTO', 'PLAN_LECTOR', 'EVALUACION',
        'ESTRATEGIAS', 'RECURSOS',
        'EBOOKS', 'TALLERES', 'MATERIAL_GRATIS'
      ];

      categories.forEach(cat => {
        const config = service.getConfig(cat);
        expect(config).toBeDefined();
        expect(config?.showNivelCard).toBeDefined();
        expect(config?.showMateriaCard).toBeDefined();
      });
    });
  });

  describe('requiresNivel', () => {
    it('debe retornar true para Grupo 1 y 2', () => {
      expect(service.requiresNivel('KITS')).toBe(true);
      expect(service.requiresNivel('ESTRATEGIAS')).toBe(true);
    });

    it('debe retornar false para Grupo 3', () => {
      expect(service.requiresNivel('EBOOKS')).toBe(false);
      expect(service.requiresNivel('MATERIAL_GRATIS')).toBe(false);
    });
  });

  describe('requiresMateria', () => {
    it('debe retornar true solo para Grupo 1', () => {
      expect(service.requiresMateria('KITS')).toBe(true);
      expect(service.requiresMateria('REFORZAMIENTO')).toBe(true);
    });

    it('debe retornar false para Grupo 2 y 3', () => {
      expect(service.requiresMateria('ESTRATEGIAS')).toBe(false);
      expect(service.requiresMateria('EBOOKS')).toBe(false);
    });
  });

  describe('requiresGrado', () => {
    it('debe retornar false para todas las categorías por defecto', () => {
      expect(service.requiresGrado('KITS')).toBe(false);
      expect(service.requiresGrado('ESTRATEGIAS')).toBe(false);
      expect(service.requiresGrado('EBOOKS')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('debe manejar parámetros URL vacíos como strings', () => {
      const visibility = service.calculateVisibility('KITS', { 
        nivel: '', 
        materia: '' 
      });
      
      // Valores vacíos no cuentan como "tiene parámetro"
      expect(visibility.shouldShowNivelCard).toBe(true);
      expect(visibility.initialStep).toBe('niveles');
    });

    it('debe manejar múltiples parámetros URL irrelevantes', () => {
      const visibility = service.calculateVisibility('EBOOKS', { 
        nivel: 'PRIMARIA',
        materia: 'MATEMATICA',
        otroParam: 'valor',
        page: '2'
      });
      
      expect(visibility.initialStep).toBe('documentos');
      expect(visibility.preselectedNivel).toBe('PRIMARIA');
    });
  });
});
