import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GradeHierarchyData, HierarchyItem } from '../../interfaces/grade-hierarchy';
import { GradeHierarchyApi } from '../api/grade-hierarchy.api';

@Injectable({
  providedIn: 'root'
})
export class GradeHierarchyService extends GradeHierarchyData {

  constructor(private api: GradeHierarchyApi) {
    super();
  }

  getCategories(): Observable<HierarchyItem[]> {
    return this.api.getCategories();
  }

  getLevels(categoryCode: string): Observable<HierarchyItem[]> {
    return this.api.getLevels(categoryCode);
  }

  getSubjects(categoryCode: string, levelCode: string): Observable<HierarchyItem[]> {
    return this.api.getSubjects(categoryCode, levelCode);
  }

  getGrades(categoryCode: string, levelCode: string, subjectCode: string): Observable<HierarchyItem[]> {
    return this.api.getGrades(categoryCode, levelCode, subjectCode);
  }

  findGradeId(category: string, nivel: string, materia?: string, grado?: string): Observable<number | null> {
    return this.api.findGradeId(category, nivel, materia, grado);
  }

  // CRUD para Categorías
  createCategory(data: any): Observable<any> {
    return this.api.createCategory(data);
  }

  updateCategory(id: number, data: any): Observable<any> {
    return this.api.updateCategory(id, data);
  }

  deleteCategory(id: number): Observable<any> {
    return this.api.deleteCategory(id);
  }

  // CRUD para Niveles
  createLevel(data: any): Observable<any> {
    return this.api.createLevel(data);
  }

  updateLevel(id: number, data: any): Observable<any> {
    return this.api.updateLevel(id, data);
  }

  deleteLevel(id: number): Observable<any> {
    return this.api.deleteLevel(id);
  }
}
