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
  abstract getLevels(categoryCode: string): Observable<HierarchyItem[]>;
  abstract getSubjects(categoryCode: string, levelCode: string): Observable<HierarchyItem[]>;
  abstract getGrades(categoryCode: string, levelCode: string, subjectCode: string): Observable<HierarchyItem[]>;
  abstract findGradeId(category: string, nivel: string, materia?: string, grado?: string): Observable<number | null>;
}
