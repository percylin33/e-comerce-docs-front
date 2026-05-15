import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { Opcion, OpcionData, OpcionDto } from '../../../@core/data/materia';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface DialogData {
  opcion?: Opcion;
  materiaId: number;
  isEdit: boolean;
}

@Component({
    selector: 'ngx-opcion-form-dialog',
    templateUrl: './opcion-form-dialog.component.html',
    styleUrls: ['./opcion-form-dialog.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatDialogActions, MatButtonModule, MatIconModule, MatProgressSpinnerModule]
})
export class OpcionFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private opcionService = inject(OpcionData);
  dialogRef = inject<MatDialogRef<OpcionFormDialogComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;
  isEdit: boolean;
  isSaving: boolean = false;

  constructor() {
    const data = this.data;

    this.isEdit = data.isEdit;
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const opcion = this.data.opcion;
    
    this.form = this.fb.group({
      nombre: [opcion?.nombre || '', [Validators.required, Validators.minLength(3)]],
      antes: [opcion?.antes || 0, [Validators.min(0)]],
      ahora: [opcion?.ahora || 0, [Validators.required, Validators.min(0.01)]],
      posicion: [opcion?.posicion || 0, [Validators.min(0)]],
      exclusivo: [opcion?.exclusivo || false],
      activo: [opcion?.activo ?? true]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.value;

    // Validar que ahora <= antes (si antes > 0)
    if (formValue.antes > 0 && formValue.ahora > formValue.antes) {
      alert('El precio "Ahora" no puede ser mayor al precio "Antes"');
      return;
    }

    this.isSaving = true;
    
    const opcionDto: OpcionDto = {
      nombre: formValue.nombre,
      antes: formValue.antes,
      ahora: formValue.ahora,
      posicion: formValue.posicion,
      exclusivo: formValue.exclusivo,
      activo: formValue.activo,
      materiaId: this.data.materiaId
    };

    const request$ = this.isEdit
      ? this.opcionService.update(this.data.opcion!.id, opcionDto)
      : this.opcionService.create(opcionDto);

    request$.subscribe({
      next: (result) => {
        
        this.dialogRef.close(result);
      },
      error: (err) => {
        console.error('❌ Error al guardar opción:', err);
        alert('Error al guardar la opción');
        this.isSaving = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
