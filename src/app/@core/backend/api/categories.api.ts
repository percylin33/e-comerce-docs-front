import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';

export interface CategoryDto {
  id: number;
  code: string;
  name: string;
  position: number;
}

export interface LevelDto {
  id: number;
  code: string;
  name: string;
  position: number;
  active: boolean;
}

export interface SubjectDto {
  id: number;
  code: string;
  name: string;
}

export interface GradeDto {
  id: number;
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesApi {

  constructor(private api: HttpService) { }

  getActiveCategories(): Observable<CategoryDto[]> {
    return this.api.get('api/v1/grades/categories');
  }

  getLevels(categoryId: number): Observable<LevelDto[]> {
    return this.api.get(`api/v1/grades/levels?categoryId=${categoryId}`);
  }

  getSubjects(levelId: number): Observable<SubjectDto[]> {
    return this.api.get(`api/v1/grades/subjects?levelId=${levelId}`);
  }

  getGrades(subjectId: number): Observable<GradeDto[]> {
    return this.api.get(`api/v1/grades/grades?subjectId=${subjectId}`);
  }
}
