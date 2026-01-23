import { TestBed } from '@angular/core/testing';
import { CategoryFilterService, FilterState } from './category-filter.service';

describe('CategoryFilterService', () => {
  let service: CategoryFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoryFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty state', () => {
    const state = service.getCurrentState();
    expect(state.nivel).toBe('');
    expect(state.materia).toBe('');
    expect(state.grado).toBe('');
    expect(state.servicio).toBe('');
    expect(state.searchTerm).toBe('');
    expect(state.situacion).toBeNull();
    expect(state.subcategoria).toBe('');
  });

  it('should update nivel and reset materia and grado', (done) => {
    service.setNivel('PRIMARIA');
    
    service.filterState$.subscribe(state => {
      expect(state.nivel).toBe('PRIMARIA');
      expect(state.materia).toBe('');
      expect(state.grado).toBe('');
      done();
    });
  });

  it('should update materia and reset grado', (done) => {
    service.setNivel('PRIMARIA');
    service.setMateria('MATEMATICA');
    
    service.filterState$.subscribe(state => {
      expect(state.nivel).toBe('PRIMARIA');
      expect(state.materia).toBe('MATEMATICA');
      expect(state.grado).toBe('');
      done();
    });
  });

  it('should update grado without resetting other filters', (done) => {
    service.setNivel('PRIMARIA');
    service.setMateria('MATEMATICA');
    service.setGrado('1°');
    
    service.filterState$.subscribe(state => {
      expect(state.nivel).toBe('PRIMARIA');
      expect(state.materia).toBe('MATEMATICA');
      expect(state.grado).toBe('1°');
      done();
    });
  });

  it('should update multiple filters at once', () => {
    service.updateFilters({
      nivel: 'SECUNDARIA',
      materia: 'COMUNICACION',
      grado: '3°'
    });

    const state = service.getCurrentState();
    expect(state.nivel).toBe('SECUNDARIA');
    expect(state.materia).toBe('COMUNICACION');
    expect(state.grado).toBe('3°');
  });

  it('should reset all filters', () => {
    service.updateFilters({
      nivel: 'SECUNDARIA',
      materia: 'COMUNICACION',
      grado: '3°',
      searchTerm: 'test'
    });

    service.resetFilters();
    const state = service.getCurrentState();
    
    expect(state.nivel).toBe('');
    expect(state.materia).toBe('');
    expect(state.grado).toBe('');
    expect(state.searchTerm).toBe('');
  });

  it('should reset only selections', () => {
    service.updateFilters({
      nivel: 'SECUNDARIA',
      materia: 'COMUNICACION',
      grado: '3°',
      searchTerm: 'test'
    });

    service.resetSelections();
    const state = service.getCurrentState();
    
    expect(state.nivel).toBe('');
    expect(state.materia).toBe('');
    expect(state.grado).toBe('');
    expect(state.searchTerm).toBe('test'); // No debería resetearse
  });

  it('should detect active filters', () => {
    expect(service.hasActiveFilters()).toBe(false);

    service.setNivel('PRIMARIA');
    expect(service.hasActiveFilters()).toBe(true);

    service.resetFilters();
    expect(service.hasActiveFilters()).toBe(false);
  });

  it('should get only active filters', () => {
    service.updateFilters({
      nivel: 'SECUNDARIA',
      materia: '',
      grado: '3°'
    });

    const activeFilters = service.getActiveFilters();
    expect(activeFilters.nivel).toBe('SECUNDARIA');
    expect(activeFilters.grado).toBe('3°');
    expect(activeFilters.materia).toBeUndefined();
  });

  it('should check if specific filter is active', () => {
    service.setNivel('PRIMARIA');
    
    expect(service.isFilterActive('nivel')).toBe(true);
    expect(service.isFilterActive('materia')).toBe(false);
    expect(service.isFilterActive('grado')).toBe(false);
  });
});
