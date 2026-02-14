import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GradeHierarchyService } from '../../../@core/backend/services/grade-hierarchy.service';
import { NbToastrService } from '@nebular/theme';

export interface HierarchyEditorData {
  type: 'category' | 'level' | 'subject' | 'grade';
  mode: 'create' | 'edit';
  item?: any;
  parentData?: {
    categoryCode?: string;
    levelCode?: string;
    subjectCode?: string;
  };
}

@Component({
  selector: 'ngx-hierarchy-editor-modal',
  templateUrl: './hierarchy-editor-modal.component.html',
  styleUrls: ['./hierarchy-editor-modal.component.scss']
})
export class HierarchyEditorModalComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  items: any[] = [];

  typeLabels = {
    category: 'Categoría',
    level: 'Nivel',
    subject: 'Materia',
    grade: 'Grado'
  };

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<HierarchyEditorModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HierarchyEditorData,
    private hierarchyService: GradeHierarchyService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadItems();
  }

  private initForm(): void {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      position: [0, [Validators.required, Validators.min(0)]],
      active: [true]
    });

    if (this.data.mode === 'edit' && this.data.item) {
      this.form.patchValue({
        code: this.data.item.code,
        name: this.data.item.name,
        position: this.data.item.position || 0,
        active: this.data.item.active !== false
      });
      // En modo edición, el código no debería ser editable
      this.form.get('code')?.disable();
    }
  }

  private loadItems(): void {
    this.isLoading = true;
    
    switch (this.data.type) {
      case 'category':
        this.hierarchyService.getCategories().subscribe({
          next: (items) => {
            this.items = items;
            this.isLoading = false;
          },
          error: () => this.isLoading = false
        });
        break;
      case 'level':
        if (this.data.parentData?.categoryCode) {
          this.hierarchyService.getLevels(this.data.parentData.categoryCode).subscribe({
            next: (items) => {
              this.items = items;
              this.isLoading = false;
            },
            error: () => this.isLoading = false
          });
        } else {
          this.isLoading = false;
        }
        break;
      case 'subject':
        if (this.data.parentData?.categoryCode && this.data.parentData?.levelCode) {
          this.hierarchyService.getSubjects(this.data.parentData.categoryCode, this.data.parentData.levelCode).subscribe({
            next: (items) => {
              this.items = items;
              this.isLoading = false;
            },
            error: () => this.isLoading = false
          });
        } else {
          this.isLoading = false;
        }
        break;
      case 'grade':
        if (this.data.parentData?.categoryCode && this.data.parentData?.levelCode && this.data.parentData?.subjectCode) {
          this.hierarchyService.getGrades(
            this.data.parentData.categoryCode,
            this.data.parentData.levelCode,
            this.data.parentData.subjectCode
          ).subscribe({
            next: (items) => {
              this.items = items;
              this.isLoading = false;
            },
            error: () => this.isLoading = false
          });
        } else {
          this.isLoading = false;
        }
        break;
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.toastr.warning('Por favor, completa todos los campos requeridos', 'Formulario inválido');
      return;
    }

    this.isLoading = true;
    const formValue = this.form.getRawValue();

    const resultData = {
      code: formValue.code,
      name: formValue.name,
      position: formValue.position,
      active: formValue.active,
      ...this.data.parentData
    };

    // Llamar al servicio para crear/actualizar
    if (this.data.type === 'category') {
      if (this.data.mode === 'create') {
        this.hierarchyService.createCategory(resultData).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.toastr.success('Categoría creada exitosamente', 'Éxito');
            this.dialogRef.close({ saved: true, data: response });
          },
          error: (error) => {
            this.isLoading = false;
            this.toastr.danger('Error al crear categoría', 'Error');
            console.error(error);
          }
        });
      } else {
        this.hierarchyService.updateCategory(this.data.item.id, resultData).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.toastr.success('Categoría actualizada exitosamente', 'Éxito');
            this.dialogRef.close({ saved: true, data: response });
          },
          error: (error) => {
            this.isLoading = false;
            this.toastr.danger('Error al actualizar categoría', 'Error');
            console.error(error);
          }
        });
      }
    } else if (this.data.type === 'level') {
      if (this.data.mode === 'create') {
        this.hierarchyService.createLevel(resultData).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.toastr.success('Nivel creado exitosamente', 'Éxito');
            this.dialogRef.close({ saved: true, data: response });
          },
          error: (error) => {
            this.isLoading = false;
            this.toastr.danger('Error al crear nivel', 'Error');
            console.error(error);
          }
        });
      } else {
        this.hierarchyService.updateLevel(this.data.item.id, resultData).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.toastr.success('Nivel actualizado exitosamente', 'Éxito');
            this.dialogRef.close({ saved: true, data: response });
          },
          error: (error) => {
            this.isLoading = false;
            this.toastr.danger('Error al actualizar nivel', 'Error');
            console.error(error);
          }
        });
      }
    } else if (this.data.type === 'subject') {
      if (this.data.mode === 'create') {
        this.hierarchyService.createSubject(resultData).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.toastr.success('Materia creada exitosamente', 'Éxito');
            this.dialogRef.close({ saved: true, data: response });
          },
          error: (error) => {
            this.isLoading = false;
            this.toastr.danger('Error al crear materia', 'Error');
            console.error(error);
          }
        });
      } else {
        this.hierarchyService.updateSubject(this.data.item.id, resultData).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.toastr.success('Materia actualizada exitosamente', 'Éxito');
            this.dialogRef.close({ saved: true, data: response });
          },
          error: (error) => {
            this.isLoading = false;
            this.toastr.danger('Error al actualizar materia', 'Error');
            console.error(error);
          }
        });
      }
    } else if (this.data.type === 'grade') {
      if (this.data.mode === 'create') {
        this.hierarchyService.createGrade(resultData).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.toastr.success('Grado creado exitosamente', 'Éxito');
            this.dialogRef.close({ saved: true, data: response });
          },
          error: (error) => {
            this.isLoading = false;
            this.toastr.danger('Error al crear grado', 'Error');
            console.error(error);
          }
        });
      } else {
        this.hierarchyService.updateGrade(this.data.item.id, resultData).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.toastr.success('Grado actualizado exitosamente', 'Éxito');
            this.dialogRef.close({ saved: true, data: response });
          },
          error: (error) => {
            this.isLoading = false;
            this.toastr.danger('Error al actualizar grado', 'Error');
            console.error(error);
          }
        });
      }
    }
  }

  onDelete(item: any): void {
    if (!confirm(`¿Estás seguro de eliminar "${item.name}"?`)) {
      return;
    }

    this.isLoading = true;

    if (this.data.type === 'category') {
      this.hierarchyService.deleteCategory(item.id).subscribe({
        next: () => {
          this.isLoading = false;
          this.toastr.success('Categoría eliminada exitosamente', 'Éxito');
          this.loadItems();
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger('Error al eliminar categoría. Puede tener elementos asociados.', 'Error');
          console.error(error);
        }
      });
    } else if (this.data.type === 'level') {
      this.hierarchyService.deleteLevel(item.id).subscribe({
        next: () => {
          this.isLoading = false;
          this.toastr.success('Nivel eliminado exitosamente', 'Éxito');
          this.loadItems();
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger('Error al eliminar nivel. Puede tener elementos asociados.', 'Error');
          console.error(error);
        }
      });
    }
    else if (this.data.type === 'subject') {
      this.hierarchyService.deleteSubject(item.id).subscribe({
        next: () => {
          this.isLoading = false;
          this.toastr.success('Materia eliminada exitosamente', 'Éxito');
          this.loadItems();
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger('Error al eliminar materia. Puede tener elementos asociados.', 'Error');
          console.error(error);
        }
      });
    } else if (this.data.type === 'grade') {
      this.hierarchyService.deleteGrade(item.id).subscribe({
        next: () => {
          this.isLoading = false;
          this.toastr.success('Grado eliminado exitosamente', 'Éxito');
          this.loadItems();
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.danger('Error al eliminar grado. Puede tener elementos asociados.', 'Error');
          console.error(error);
        }
      });
    }
  }

  onEdit(item: any): void {
    this.data.mode = 'edit';
    this.data.item = item;
    this.initForm();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getTitle(): string {
    const label = this.typeLabels[this.data.type];
    return this.data.mode === 'create' ? `Crear ${label}` : `Editar ${label}`;
  }
}
