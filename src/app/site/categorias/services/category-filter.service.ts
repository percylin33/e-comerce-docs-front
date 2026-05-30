import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FilterState {
  nivel: string;
  materia: string;
  grado: string;
  servicio: string;
  searchTerm: string;
  situacion: any | null;
  subcategoria: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryFilterService {
  private readonly initialState: FilterState = {
    nivel: '',
    materia: '',
    grado: '',
    servicio: '',
    searchTerm: '',
    situacion: null,
    subcategoria: ''
  };

  // BehaviorSubjects para estado reactivo
  private filterState = new BehaviorSubject<FilterState>(this.initialState);
  
  // Observables públicos
  public filterState$ = this.filterState.asObservable();

  constructor() {}

  /**
   * Obtiene el estado actual de los filtros
   */
  getCurrentState(): FilterState {
    return { ...this.filterState.value };
  }

  /**
   * Actualiza el nivel seleccionado
   */
  setNivel(nivel: string): void {
    const currentState = this.filterState.value;
    this.filterState.next({
      ...currentState,
      nivel,
      // Al cambiar nivel, resetear materia y grado
      materia: '',
      grado: ''
    });
  }

  /**
   * Actualiza la materia seleccionada
   */
  setMateria(materia: string): void {
    const currentState = this.filterState.value;
    this.filterState.next({
      ...currentState,
      materia,
      // Al cambiar materia, resetear grado
      grado: ''
    });
  }

  /**
   * Actualiza el grado seleccionado
   */
  setGrado(grado: string): void {
    const currentState = this.filterState.value;
    this.filterState.next({
      ...currentState,
      grado
    });
  }

  /**
   * Actualiza el servicio seleccionado
   */
  setServicio(servicio: string): void {
    const currentState = this.filterState.value;
    this.filterState.next({
      ...currentState,
      servicio
    });
  }

  /**
   * Actualiza el término de búsqueda
   */
  setSearchTerm(searchTerm: string): void {
    const currentState = this.filterState.value;
    this.filterState.next({
      ...currentState,
      searchTerm
    });
  }

  /**
   * Actualiza la situación seleccionada
   */
  setSituacion(situacion: any | null): void {
    const currentState = this.filterState.value;
    this.filterState.next({
      ...currentState,
      situacion
    });
  }

  /**
   * Actualiza la subcategoría seleccionada
   */
  setSubcategoria(subcategoria: string): void {
    const currentState = this.filterState.value;
    this.filterState.next({
      ...currentState,
      subcategoria
    });
  }

  /**
   * Actualiza múltiples filtros a la vez
   */
  updateFilters(filters: Partial<FilterState>): void {
    const currentState = this.filterState.value;
    this.filterState.next({
      ...currentState,
      ...filters
    });
  }

  /**
   * Resetea todos los filtros al estado inicial
   */
  resetFilters(): void {
    this.filterState.next({ ...this.initialState });
  }

  /**
   * Resetea los filtros de nivel, materia y grado manteniendo el resto
   */
  resetSelections(): void {
    const currentState = this.filterState.value;
    this.filterState.next({
      ...currentState,
      nivel: '',
      materia: '',
      grado: ''
    });
  }

  /**
   * Verifica si hay filtros aplicados
   */
  hasActiveFilters(): boolean {
    const state = this.filterState.value;
    return !!(state.nivel || state.materia || state.grado || state.searchTerm || state.situacion || state.subcategoria);
  }

  /**
   * Obtiene un objeto con solo los filtros activos (no vacíos)
   */
  getActiveFilters(): Partial<FilterState> {
    const state = this.filterState.value;
    const activeFilters: Partial<FilterState> = {};

    Object.entries(state).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        activeFilters[key as keyof FilterState] = value;
      }
    });

    return activeFilters;
  }

  /**
   * Verifica si un filtro específico está activo
   */
  isFilterActive(filterName: keyof FilterState): boolean {
    const value = this.filterState.value[filterName];
    return value !== '' && value !== null && value !== undefined;
  }
}
