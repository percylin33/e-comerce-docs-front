import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { GradeIdResponse, HierarchyItem } from '../../interfaces/grade-hierarchy';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GradeHierarchyApi {

  constructor(private api: HttpService) { }

  getCategories(): Observable<HierarchyItem[]> {
    return this.api.get('api/v1/grades/categories');
  }

  getLevels(categoryCode: string): Observable<HierarchyItem[]> {
    return this.api.get(`api/v1/grades/levels?categoryCode=${categoryCode}`);
  }

  getSubjects(categoryCode: string, levelCode: string): Observable<HierarchyItem[]> {
    return this.api.get(`api/v1/grades/subjects?categoryCode=${categoryCode}&levelCode=${levelCode}`);
  }

  getGrades(categoryCode: string, levelCode: string, subjectCode: string): Observable<HierarchyItem[]> {
    return this.api.get(`api/v1/grades/grades?categoryCode=${categoryCode}&levelCode=${levelCode}&subjectCode=${subjectCode}`);
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
}
