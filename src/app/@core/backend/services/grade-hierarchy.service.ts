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
}
