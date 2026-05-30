import { Observable } from "rxjs";

export interface HierarchyItem {
  id: number;
  code: string;
  name: string;
  position?: number;
  active?: boolean;
}

export interface GradeIdResponse {
  gradeId: number | null;
}

export abstract class GradeHierarchyData {
  abstract getCategories(): Observable<HierarchyItem[]>;
  abstract getLevels(categoryId: number): Observable<HierarchyItem[]>;
  abstract getSubjects(levelId: number): Observable<HierarchyItem[]>;
  abstract getGrades(subjectId: number): Observable<HierarchyItem[]>;
  abstract findGradeId(category: string, nivel: string, materia?: string, grado?: string): Observable<number | null>;
}
