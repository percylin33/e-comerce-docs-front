 import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GradeEquivalenceService, MateriaOption, OpcionOption, GradeOption, SubjectOption } from '../../services/grade-equivalence.service';
import { GradeEquivalence } from '../../models/grade-equivalence.model';
import { LevelCode } from '../../models/grade-equivalence.model';

interface NivelOption {
  code: string;
  nombre: string;
}

@Component({
  selector: 'ngx-grade-equivalences-form',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
],
  templateUrl: './grade-equivalences-form.component.html',
  styleUrls: ['./grade-equivalences-form.component.scss']
})
export class GradeEquivalencesFormComponent implements OnInit, OnDestroy {
    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private service = inject(GradeEquivalenceService);
    private snackBar = inject(MatSnackBar);

    // Flag para pausar valueChanges durante patchValue inicial
    private suspendValueChanges = false;
  form!: FormGroup;
  loading = false;
  saving = false;
  isEditMode = false;
  equivalenceId: number | null = null;
  
  // Options
  niveles: NivelOption[] = [
    { code: 'INICIAL', nombre: 'Inicial' },
    { code: 'PRIMARIA', nombre: 'Primaria' },
    { code: 'SECUNDARIA', nombre: 'Secundaria' }
  ];
  
  materias: MateriaOption[] = [];
  opciones: OpcionOption[] = [];
  subjects: SubjectOption[] = [];
  grades: GradeOption[] = [];
  
  // Loading states for dependent fields
  loadingMaterias = false;
  loadingOpciones = false;
  loadingSubjects = false;
  loadingGrades = false;
  
  // Error and success messages
  error: string | null = null;
  successMessage: string | null = null;

  // To manage subscriptions
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initForm();
    
    // Check if editing
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.equivalenceId = +id;
      this.loadEquivalence(+id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      levelCode: ['', Validators.required],
      materiaId: [null, Validators.required],
      opcionId: [null],
      subjectId: [null, Validators.required],
      gradeId: [null, Validators.required]
    });

    // Suscribirse a cambios SOLO si no está suspendido
    this.form.get('levelCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((levelCode: string | null) => {
        
        if (this.suspendValueChanges) return;
        if (levelCode) {
          this.loadMaterias(levelCode);
          this.loadSubjects(levelCode);
        }
      });

    this.form.get('materiaId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((materiaId: number | null) => {
        
        if (this.suspendValueChanges) return;
        if (materiaId) {
          this.loadOpciones(materiaId);
        }
      });

    this.form.get('subjectId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((subjectId: number | null) => {
        
        if (this.suspendValueChanges) return;
        if (subjectId) {
          this.loadGradesForSubject(subjectId);
        }
      });
  }

  loadEquivalence(id: number): void {
    this.loading = true;
    this.error = null;
    this.suspendValueChanges = true;
    
    this.service.getEquivalence(id).subscribe({
      next: (eq: any) => {
        
        const data = eq.data;
        const levelCode = data.levelCode as LevelCode;
        const materiaId = data.materiaId;
        const subjectId = data.subjectId;

        forkJoin({
          materias: levelCode ? this.service.getMateriasForLevel(levelCode) : of([]),
          subjects: levelCode ? this.service.getSubjectsForLevel(levelCode) : of([]),
          opciones: materiaId ? this.service.getOpcionesForMateria(materiaId) : of([]),
          grades: subjectId ? this.service.getGradesForSubject(subjectId) : of([]),
        }).subscribe({
          next: (results) => {
            
            this.materias = results.materias || [];
            this.subjects = results.subjects || [];
            this.opciones = results.opciones || [];
            this.grades = results.grades || [];

            // Ahora sí, setea los valores del formulario
            this.form.patchValue({
              levelCode: data.levelCode,
              materiaId: data.materiaId,
              opcionId: data.opcionId || null,
              subjectId: data.subjectId || null,
              gradeId: data.gradeId
            }, { emitEvent: false });
            

            this.suspendValueChanges = false;
            this.loading = false;
          },
          error: (err) => {
            console.error('[loadEquivalence] Error loading dependent data:', err);
            this.error = 'Error al cargar datos dependientes';
            this.suspendValueChanges = false;
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('[loadEquivalence] Error loading equivalence:', err);
        this.error = 'Error al conectar con el servidor';
        this.suspendValueChanges = false;
        this.loading = false;
      }
    });
  }

  loadMaterias(levelCode: string): void {
    this.loadingMaterias = true;
    this.materias = [];
    this.form.patchValue({ materiaId: null, opcionId: null }, { emitEvent: false });
    
    this.service.getMateriasForLevel(levelCode as any).subscribe({
      next: (materias: any) => {
        
        this.materias = materias || [];
        this.loadingMaterias = false;
      },
      error: (err) => {
        console.error('[loadMaterias] Error loading materias:', err);
        this.loadingMaterias = false;
      }
    });
  }

  loadOpciones(materiaId: number): void {
    this.loadingOpciones = true;
    this.opciones = [];
    this.form.patchValue({ opcionId: null }, { emitEvent: false });
    
    this.service.getOpcionesForMateria(materiaId).subscribe({
      next: (opciones: any) => {
        
        this.opciones = opciones || [];
        this.loadingOpciones = false;
      },
      error: (err) => {
        console.error('[loadOpciones] Error loading opciones:', err);
        this.loadingOpciones = false;
      }
    });
  }

  loadSubjects(levelCode: string): void {
    this.loadingSubjects = true;
    this.subjects = [];
    this.form.patchValue({ subjectId: null, gradeId: null }, { emitEvent: false });
    
    this.service.getSubjectsForLevel(levelCode as any).subscribe({
      next: (subjects: any) => {
        
        this.subjects = subjects || [];
        this.loadingSubjects = false;
      },
      error: (err) => {
        console.error('[loadSubjects] Error loading subjects:', err);
        this.loadingSubjects = false;
      }
    });
  }

  loadGradesForSubject(subjectId: number): void {
    this.loadingGrades = true;
    this.grades = [];
    this.form.patchValue({ gradeId: null }, { emitEvent: false });
    
    this.service.getGradesForSubject(subjectId).subscribe({
      next: (grades: any) => {
        
        this.grades = grades || [];
        this.loadingGrades = false;
      },
      error: (err) => {
        console.error('[loadGradesForSubject] Error loading grades:', err);
        this.loadingGrades = false;
      }
    });
  }

  onLevelChange(): void {
    const levelCode = this.form.get('levelCode')?.value;
    if (levelCode) {
      this.loadMaterias(levelCode);
      this.loadSubjects(levelCode);
    }
  }

  onSubjectChange(): void {
    const subjectId = this.form.get('subjectId')?.value;
    if (subjectId) {
      this.loadGradesForSubject(subjectId);
    }
  }

  onMateriaChange(): void {
    const materiaId = this.form.get('materiaId')?.value;
    if (materiaId) {
      this.loadOpciones(materiaId);
    }
  }

  checkDuplicate(): void {
    const levelCode = this.form.get('levelCode')?.value;
    const materiaId = this.form.get('materiaId')?.value;
    const opcionId = this.form.get('opcionId')?.value;

    if (levelCode && materiaId) {
      this.service.checkDuplicate(levelCode as any, materiaId, opcionId || 0).subscribe({
        next: (response) => {
          if (response.exists) {
            this.error = response.message;
          } else {
            this.error = null;
          }
        },
        error: (err) => {
          console.error('Error checking duplicate:', err);
        }
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.snackBar.open('Complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.saving = true;
    this.error = null;
    this.successMessage = null;

    const data = {
      levelCode: this.form.value.levelCode,
      materiaId: this.form.value.materiaId,
      opcionId: this.form.value.opcionId || null,
      subjectId: this.form.value.subjectId,
      gradeId: this.form.value.gradeId
    };

    const request = this.isEditMode && this.equivalenceId
      ? this.service.updateEquivalence(this.equivalenceId, data)
      : this.service.createEquivalence(data);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = this.isEditMode ? 'Equivalencia actualizada correctamente' : 'Equivalencia creada correctamente';
        this.snackBar.open(this.successMessage, 'Cerrar', { duration: 3000 });
        this.router.navigate(['/pages-admin/grade-equivalences']);
      },
      error: (err) => {
        console.error('Error saving equivalence:', err);
        this.saving = false;
        this.error = 'Error al guardar la equivalencia';
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/pages-admin/grade-equivalences']);
  }

  goBack(): void {
    this.router.navigate(['/pages-admin/grade-equivalences']);
  }

  // Helper methods for template
  getMateriaNombre(): string {
    if (!this.form || !this.form.value || !this.materias) return 'No seleccionado';
    const id = this.form.value.materiaId;
    const found = this.materias.find(m => m.id === Number(id));
    
    return found && found.nombre ? found.nombre : (id ? String(id) : 'No seleccionado');
  }

  getOpcionNombre(): string {
    if (!this.form || !this.form.value || !this.opciones) return 'Sin opción';
    const id = this.form.value.opcionId;
    if (!id) return 'Sin opción';
    const found = this.opciones.find(o => o.id === Number(id));
    
    return found && found.nombre ? found.nombre : String(id);
  }

  getSubjectNombre(): string {
    if (!this.form || !this.form.value || !this.subjects) return 'No seleccionado';
    const id = this.form.value.subjectId;
    const found = this.subjects.find(s => s.id === Number(id));
    
    return found && (found.name || found.nombre) ? (found.name || found.nombre) : (id ? String(id) : 'No seleccionado');
  }

  getGradeNombre(): string {
    if (!this.form || !this.form.value || !this.grades) return 'No seleccionado';
    const id = this.form.value.gradeId;
    const found = this.grades.find(g => g.id === Number(id));
    
    return found && found.nombre ? found.nombre : (id ? String(id) : 'No seleccionado');
  }

   getNivelNombre(): string {
    if (!this.form || !this.form.value || !this.niveles) return 'No seleccionado';
    const code = this.form.value.levelCode;
    const found = this.niveles.find(n => n.code === code);
    return found && found.nombre ? found.nombre : (code ? String(code) : 'No seleccionado');
  }
}
