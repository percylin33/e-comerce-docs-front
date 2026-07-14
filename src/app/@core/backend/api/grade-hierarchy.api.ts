import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { GradeIdResponse, HierarchyItem } from '../../interfaces/grade-hierarchy';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GradeHierarchyApi {
  private api = inject(HttpService);


  getCategories(): Observable<HierarchyItem[]> {
    return this.api.get('api/v1/grades/categories');
  }

  getLevels(categoryId: number): Observable<HierarchyItem[]> {
    return this.api.get(`api/v1/grades/levels?categoryId=${categoryId}`);
  }

  getSubjects(levelId: number): Observable<HierarchyItem[]> {
    return this.api.get(`api/v1/grades/subjects?levelId=${levelId}`);
  }

  getGrades(subjectId: number): Observable<HierarchyItem[]> {
    return this.api.get(`api/v1/grades/grades?subjectId=${subjectId}`);
  }

  /**
   * Lista los grados de un nivel sin pasar por materia (Mejora M7).
   * Util para niveles sin materia asignada (ej. INICIAL) donde el doc
   * no tiene subjectCode pero si levelCode + gradeCode.
   */
  getGradesByLevel(levelId: number): Observable<HierarchyItem[]> {
    return this.api.get(`api/v1/grades/by-level/${levelId}`);
  }

  findGradeId(category: string, nivel: string, materia?: string, grado?: string): Observable<number | null> {
    let url = `api/v1/grades/find?category=${category}&nivel=${nivel}`;
    if (materia) url += `&materia=${materia}`;
    if (grado) url += `&grado=${grado}`;
    
    return this.api.get(url).pipe(
      map((response: GradeIdResponse) => response.gradeId)
    );
  }

  // CRUD para Categorías
  createCategory(data: any): Observable<any> {
    return this.api.post('api/v1/grades/categories', data);
  }

  updateCategory(id: number, data: any): Observable<any> {
    return this.api.put(`api/v1/grades/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<any> {
    return this.api.delete(`api/v1/grades/categories/${id}`);
  }

  // CRUD para Niveles
  createLevel(data: any): Observable<any> {
    return this.api.post('api/v1/grades/levels', data);
  }

  updateLevel(id: number, data: any): Observable<any> {
    return this.api.put(`api/v1/grades/levels/${id}`, data);
  }

  deleteLevel(id: number): Observable<any> {
    return this.api.delete(`api/v1/grades/levels/${id}`);
  }

  // CRUD para Materias (Subjects)
  createSubject(data: any): Observable<any> {
    return this.api.post('api/v1/grades/subjects', data);
  }

  updateSubject(id: number, data: any): Observable<any> {
    return this.api.put(`api/v1/grades/subjects/${id}`, data);
  }

  deleteSubject(id: number): Observable<any> {
    return this.api.delete(`api/v1/grades/subjects/${id}`);
  }

  // CRUD para Grados
  createGrade(data: any): Observable<any> {
    return this.api.post('api/v1/grades/grades', data);
  }

  updateGrade(id: number, data: any): Observable<any> {
    return this.api.put(`api/v1/grades/grades/${id}`, data);
  }

  deleteGrade(id: number): Observable<any> {
    return this.api.delete(`api/v1/grades/grades/${id}`);
  }
}
