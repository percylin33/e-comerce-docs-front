/**
 * Factory for creating the appropriate FilterParamsStrategy based on category
 */

import { Injectable } from '@angular/core';
import { FilterParamsStrategy } from './filter-params-strategy.interface';
import { Categoria } from '../models/category-state.model';
import {
  PlanificacionStrategy,
  KitsStrategy,
  MaterialGratisStrategy,
  EbooksStrategy,
  TalleresStrategy,
  ReforzamientoStrategy,
  PlanLectorStrategy,
  EvaluacionStrategy,
  ConcursosStrategy,
  RecursosStrategy,
  EstrategiasStrategy
} from './filter-params-strategies';

/**
 * Factory service for obtaining the correct FilterParamsStrategy
 * Implements the Factory Pattern to encapsulate strategy creation
 */
@Injectable({
  providedIn: 'root'
})
export class FilterParamsStrategyFactory {
  private strategies: Map<Categoria, FilterParamsStrategy>;
  
  constructor() {
    this.strategies = this.initializeStrategies();
  }
  
  /**
   * Initialize all strategy instances
   */
  private initializeStrategies(): Map<Categoria, FilterParamsStrategy> {
    const strategies = new Map<Categoria, FilterParamsStrategy>();
    
    // Create instances of each strategy
    const strategyInstances: FilterParamsStrategy[] = [
      new PlanificacionStrategy(),
      new KitsStrategy(),
      new MaterialGratisStrategy(),
      new EbooksStrategy(),
      new TalleresStrategy(),
      new ReforzamientoStrategy(),
      new PlanLectorStrategy(),
      new EvaluacionStrategy(),
      new ConcursosStrategy(),
      new RecursosStrategy(),
      new EstrategiasStrategy()
    ];
    
    // Register each strategy by its category
    strategyInstances.forEach(strategy => {
      strategies.set(strategy.getCategory(), strategy);
    });
    
    return strategies;
  }
  
  /**
   * Get the appropriate strategy for a given category
   * @param categoria The category to get the strategy for
   * @returns The FilterParamsStrategy for the category
   * @throws Error if no strategy is found for the category
   */
  getStrategy(categoria: Categoria): FilterParamsStrategy {
    const strategy = this.strategies.get(categoria);
    
    if (!strategy) {
      throw new Error(`No strategy found for category: ${categoria}`);
    }
    
    return strategy;
  }
  
  /**
   * Check if a strategy exists for a given category
   * @param categoria The category to check
   * @returns true if a strategy exists, false otherwise
   */
  hasStrategy(categoria: Categoria): boolean {
    return this.strategies.has(categoria);
  }
  
  /**
   * Get all registered categories
   * @returns Array of all categories that have strategies
   */
  getRegisteredCategories(): Categoria[] {
    return Array.from(this.strategies.keys());
  }
}
