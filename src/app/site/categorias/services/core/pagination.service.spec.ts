import { TestBed } from '@angular/core/testing';
import { PaginationService } from './pagination.service';
import { PaginationState } from '../../models/pagination-state.model';

describe('PaginationService', () => {
  let service: PaginationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaginationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Estado Inicial', () => {
    it('debe iniciar con valores por defecto', (done) => {
      service.pagination$.subscribe(state => {
        expect(state.currentPage).toBe(1);
        expect(state.pageSize).toBe(12);
        expect(state.totalItems).toBe(0);
        expect(state.totalPages).toBe(0);
        expect(state.hasNextPage).toBe(false);
        expect(state.hasPreviousPage).toBe(false);
        done();
      });
    });

    it('debe retornar el estado inicial correctamente', () => {
      const state = service.getCurrentState();
      expect(state.currentPage).toBe(1);
      expect(state.pageSize).toBe(12);
    });
  });

  describe('setTotalItems', () => {
    it('debe actualizar total de items y calcular páginas', (done) => {
      service.setTotalItems(96);
      
      service.pagination$.subscribe(state => {
        expect(state.totalItems).toBe(96);
        expect(state.totalPages).toBe(8); // 96 / 12 = 8
        expect(state.hasNextPage).toBe(true);
        done();
      });
    });

    it('debe aceptar información del backend', (done) => {
      service.setTotalItems({
        cantidadDeDocumentos: 96,
        cantidadDePaginas: 8,
        paginaActual: 1,
        cantidadElementosPorPagina: 12
      });
      
      service.pagination$.subscribe(state => {
        expect(state.totalItems).toBe(96);
        expect(state.totalPages).toBe(8);
        done();
      });
    });

    it('debe ajustar página actual si excede el nuevo total', () => {
      service.setTotalItems(96);
      service.goToPage(5);
      
      // Reducir total, debería ajustar página actual
      service.setTotalItems(24); // Solo 2 páginas
      
      const state = service.getCurrentState();
      expect(state.currentPage).toBe(2); // Ajustado a última página
      expect(state.totalPages).toBe(2);
    });

    it('debe manejar 0 items correctamente', () => {
      service.setTotalItems(0);
      
      const state = service.getCurrentState();
      expect(state.totalItems).toBe(0);
      expect(state.totalPages).toBe(0);
      expect(state.currentPage).toBe(1);
    });
  });

  describe('Navegación - goToPage', () => {
    beforeEach(() => {
      service.setTotalItems(96); // 8 páginas
    });

    it('debe navegar a página válida', () => {
      const result = service.goToPage(3);
      
      expect(result).toBe(true);
      expect(service.getCurrentPage()).toBe(3);
    });

    it('no debe navegar a página menor que 1', () => {
      const result = service.goToPage(0);
      
      expect(result).toBe(false);
      expect(service.getCurrentPage()).toBe(1);
    });

    it('no debe navegar a página mayor que totalPages', () => {
      const result = service.goToPage(10);
      
      expect(result).toBe(false);
      expect(service.getCurrentPage()).toBe(1);
    });

    it('no debe navegar si ya está en la página', () => {
      const result = service.goToPage(1);
      
      expect(result).toBe(false);
    });

    it('debe actualizar hasNextPage y hasPreviousPage', () => {
      service.goToPage(5);
      
      const state = service.getCurrentState();
      expect(state.hasNextPage).toBe(true);
      expect(state.hasPreviousPage).toBe(true);
    });

    it('debe marcar hasNextPage como false en última página', () => {
      service.goToPage(8);
      
      const state = service.getCurrentState();
      expect(state.hasNextPage).toBe(false);
      expect(state.hasPreviousPage).toBe(true);
    });
  });

  describe('Navegación - nextPage', () => {
    beforeEach(() => {
      service.setTotalItems(96); // 8 páginas
    });

    it('debe ir a la siguiente página', () => {
      const result = service.nextPage();
      
      expect(result).toBe(true);
      expect(service.getCurrentPage()).toBe(2);
    });

    it('no debe avanzar si está en última página', () => {
      service.goToPage(8);
      const result = service.nextPage();
      
      expect(result).toBe(false);
      expect(service.getCurrentPage()).toBe(8);
    });
  });

  describe('Navegación - previousPage', () => {
    beforeEach(() => {
      service.setTotalItems(96); // 8 páginas
      service.goToPage(3);
    });

    it('debe ir a la página anterior', () => {
      const result = service.previousPage();
      
      expect(result).toBe(true);
      expect(service.getCurrentPage()).toBe(2);
    });

    it('no debe retroceder si está en primera página', () => {
      service.goToPage(1);
      const result = service.previousPage();
      
      expect(result).toBe(false);
      expect(service.getCurrentPage()).toBe(1);
    });
  });

  describe('Navegación - primera y última página', () => {
    beforeEach(() => {
      service.setTotalItems(96); // 8 páginas
      service.goToPage(5);
    });

    it('debe ir a la primera página', () => {
      service.goToFirstPage();
      expect(service.getCurrentPage()).toBe(1);
    });

    it('debe ir a la última página', () => {
      service.goToLastPage();
      expect(service.getCurrentPage()).toBe(8);
    });
  });

  describe('getPageRange', () => {
    it('debe retornar todas las páginas si son pocas', () => {
      service.setTotalItems(36); // 3 páginas
      
      const range = service.getPageRange();
      expect(range).toEqual([1, 2, 3]);
    });

    it('debe retornar máximo 5 páginas centradas', () => {
      service.setTotalItems(240); // 20 páginas
      service.goToPage(10);
      
      const range = service.getPageRange();
      expect(range).toEqual([8, 9, 10, 11, 12]);
      expect(range.length).toBe(5);
    });

    it('debe ajustar rango al inicio', () => {
      service.setTotalItems(240); // 20 páginas
      service.goToPage(2);
      
      const range = service.getPageRange();
      expect(range).toEqual([1, 2, 3, 4, 5]);
    });

    it('debe ajustar rango al final', () => {
      service.setTotalItems(240); // 20 páginas
      service.goToPage(19);
      
      const range = service.getPageRange();
      expect(range).toEqual([16, 17, 18, 19, 20]);
    });

    it('debe manejar 0 páginas', () => {
      service.setTotalItems(0);
      
      const range = service.getPageRange();
      expect(range).toEqual([]);
    });
  });

  describe('getPaginationParams', () => {
    it('debe retornar parámetros para backend', () => {
      service.setTotalItems(96);
      service.goToPage(3);
      
      const params = service.getPaginationParams();
      expect(params).toEqual({
        pagina: 3,
        cantElementos: 12
      });
    });
  });

  describe('Índices de elementos', () => {
    beforeEach(() => {
      service.setTotalItems(96); // 8 páginas de 12 elementos
    });

    it('debe calcular startIndex correctamente', () => {
      service.goToPage(1);
      expect(service.getStartIndex()).toBe(1);
      
      service.goToPage(3);
      expect(service.getStartIndex()).toBe(25); // (3-1)*12 + 1
    });

    it('debe calcular endIndex correctamente', () => {
      service.goToPage(1);
      expect(service.getEndIndex()).toBe(12);
      
      service.goToPage(3);
      expect(service.getEndIndex()).toBe(36); // 3*12
    });

    it('debe ajustar endIndex en última página parcial', () => {
      service.setTotalItems(97); // 8 páginas, última con 1 elemento
      service.goToPage(9);
      
      expect(service.getEndIndex()).toBe(97); // No debe pasar del total
    });
  });

  describe('setPageSize', () => {
    it('debe cambiar el tamaño de página', () => {
      service.setTotalItems(96);
      service.setPageSize(24);
      
      const state = service.getCurrentState();
      expect(state.pageSize).toBe(24);
      expect(state.totalPages).toBe(4); // 96 / 24 = 4
      expect(state.currentPage).toBe(1); // Resetea a página 1
    });

    it('no debe aceptar tamaño menor que 1', () => {
      service.setPageSize(0);
      expect(service.getPageSize()).toBe(12); // Mantiene el valor anterior
    });
  });

  describe('resetPagination', () => {
    it('debe resetear a estado inicial', () => {
      service.setTotalItems(96);
      service.goToPage(5);
      service.setPageSize(24);
      
      service.resetPagination();
      
      const state = service.getCurrentState();
      expect(state.currentPage).toBe(1);
      expect(state.pageSize).toBe(12);
      expect(state.totalItems).toBe(0);
      expect(state.totalPages).toBe(0);
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      service.setTotalItems(96);
      service.goToPage(3);
    });

    it('getCurrentPage debe retornar página actual', () => {
      expect(service.getCurrentPage()).toBe(3);
    });

    it('getPageSize debe retornar tamaño de página', () => {
      expect(service.getPageSize()).toBe(12);
    });

    it('getTotalPages debe retornar total de páginas', () => {
      expect(service.getTotalPages()).toBe(8);
    });

    it('getTotalItems debe retornar total de elementos', () => {
      expect(service.getTotalItems()).toBe(96);
    });

    it('canGoNext debe indicar si puede avanzar', () => {
      expect(service.canGoNext()).toBe(true);
      
      service.goToPage(8);
      expect(service.canGoNext()).toBe(false);
    });

    it('canGoPrevious debe indicar si puede retroceder', () => {
      expect(service.canGoPrevious()).toBe(true);
      
      service.goToPage(1);
      expect(service.canGoPrevious()).toBe(false);
    });
  });

  describe('Integración - Flujo completo', () => {
    it('debe manejar flujo de paginación típico', (done) => {
      const states: PaginationState[] = [];
      
      service.pagination$.subscribe(state => {
        states.push(state);
      });
      
      // Simular respuesta inicial del backend
      service.setTotalItems({ cantidadDeDocumentos: 96 });
      
      // Navegar a página 3
      service.goToPage(3);
      
      // Avanzar una página
      service.nextPage();
      
      setTimeout(() => {
        expect(states.length).toBeGreaterThan(3);
        expect(states[states.length - 1].currentPage).toBe(4);
        expect(states[states.length - 1].totalItems).toBe(96);
        done();
      }, 100);
    });
  });
});
