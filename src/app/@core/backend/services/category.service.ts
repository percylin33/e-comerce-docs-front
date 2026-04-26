import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { CategoriesApi, CategoryDto, LevelDto, SubjectDto, GradeDto } from '../api/categories.api';

export { CategoryDto, LevelDto, SubjectDto, GradeDto };

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private api = inject(CategoriesApi);


  /** Cache en memoria: se llama UNA sola vez por sesión */
  private categories$: Observable<CategoryDto[]> = this.api.getActiveCategories().pipe(
    shareReplay(1)
  );

  /** Per-category cache for levels (keyed by categoryId) */
  private levelsCache = new Map<number, Observable<LevelDto[]>>();

  getActiveCategories(): Observable<CategoryDto[]> {
    return this.categories$;
  }

  getLevels(categoryId: number): Observable<LevelDto[]> {
    if (!this.levelsCache.has(categoryId)) {
      this.levelsCache.set(
        categoryId,
        this.api.getLevels(categoryId).pipe(shareReplay(1))
      );
    }
    return this.levelsCache.get(categoryId)!;
  }

  /** Subjects vary per level — no long-term cache needed, fetched on demand */
  getSubjects(levelId: number): Observable<SubjectDto[]> {
    return this.api.getSubjects(levelId);
  }

  /** Grades vary per subject — fetched on demand */
  getGrades(subjectId: number): Observable<GradeDto[]> {
    return this.api.getGrades(subjectId);
  }
}
