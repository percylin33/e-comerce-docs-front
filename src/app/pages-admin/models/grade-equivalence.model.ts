// =====================================================
// GradeEquivalence Models - PagesAdmin
// =====================================================

export interface GradeEquivalence {
  id: number;
  levelCode: LevelCode;
  materiaId: number;
  materiaNombre?: string;
  opcionId: number;
  opcionNombre?: string;
  subjectId?: number;
  subjectNombre?: string;
  gradeId: number;
  gradeNombre?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GradeEquivalenceRequest {
  levelCode: LevelCode;
  materiaId: number;
  opcionId: number;
  subjectId: number;
  gradeId: number;
}

export interface GradeEquivalenceStats {
  INICIAL: number;
  PRIMARIA: number;
  SECUNDARIA: number;
}

export type LevelCode = 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';

export interface NivelOption {
  code: LevelCode;
  nombre: string;
}

export const NIVELES: NivelOption[] = [
  { code: 'INICIAL', nombre: 'Inicial' },
  { code: 'PRIMARIA', nombre: 'Primaria' },
  { code: 'SECUNDARIA', nombre: 'Secundaria' }
];
