import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GradeHierarchyData, HierarchyItem } from '../../interfaces/grade-hierarchy';
import { GradeHierarchyApi } from '../api/grade-hierarchy.api';

@Injectable({
  providedIn: 'root'
})
export class GradeHierarchyService extends GradeHierarchyData {
  private api = inject(GradeHierarchyApi);


  getCategories(): Observable<HierarchyItem[]> {
    return this.api.getCategories();
  }

  getLevels(categoryId: number): Observable<HierarchyItem[]> {
    return this.api.getLevels(categoryId);
  }

  getSubjects(levelId: number): Observable<HierarchyItem[]> {
    return this.api.getSubjects(levelId);
  }

  getGrades(subjectId: number): Observable<HierarchyItem[]> {
    return this.api.getGrades(subjectId);
  }

  /**
   * Lista grados directamente por nivel, sin pasar por materia (Mejora M7).
   * Util cuando el doc del creador no tiene subjectCode pero si levelCode
   * (ej. INICIAL, donde no se asigna materia diferenciada).
   */
  getGradesByLevel(levelId: number): Observable<HierarchyItem[]> {
    return this.api.getGradesByLevel(levelId);
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

  // CRUD para Materias (Subjects)
  createSubject(data: any): Observable<any> {
    return this.api.createSubject(data);
  }

  updateSubject(id: number, data: any): Observable<any> {
    return this.api.updateSubject(id, data);
  }

  deleteSubject(id: number): Observable<any> {
    return this.api.deleteSubject(id);
  }

  // CRUD para Grados
  createGrade(data: any): Observable<any> {
    return this.api.createGrade(data);
  }

  updateGrade(id: number, data: any): Observable<any> {
    return this.api.updateGrade(id, data);
  }

  deleteGrade(id: number): Observable<any> {
    return this.api.deleteGrade(id);
  }
}
