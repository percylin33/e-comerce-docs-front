import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Materia, MateriaData, MateriaDto } from '../../../@core/data/materia';

interface DialogData {
  materia?: Materia;
  subscriptionTypeId: number;
  isEdit: boolean;
}

@Component({
  selector: 'ngx-materia-form-dialog',
  templateUrl: './materia-form-dialog.component.html',
  styleUrls: ['./materia-form-dialog.component.scss']
})
export class MateriaFormDialogComponent implements OnInit {
  form: FormGroup;
  isEdit: boolean;
  isSaving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private materiaService: MateriaData,
    public dialogRef: MatDialogRef<MateriaFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEdit = data.isEdit;
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const materia = this.data.materia;
    
    this.form = this.fb.group({
      nombre: [materia?.nombre || '', [Validators.required, Validators.minLength(3)]],
      muestra: [this.arrayToText(materia?.muestra || []), []],
      afiche: [materia?.afiche || '', []],
      beneficios: [this.arrayToText(materia?.beneficios || []), []],
      activo: [materia?.activo ?? true]
    });
  }

  arrayToText(arr: string[]): string {
    return arr.join('\n');
  }

  textToArray(text: string): string[] {
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.isSaving = true;
    const formValue = this.form.value;
    
    const materiaDto: MateriaDto = {
      nombre: formValue.nombre,
      muestra: this.textToArray(formValue.muestra),
      afiche: formValue.afiche || null,
      beneficios: this.textToArray(formValue.beneficios),
      subscriptionTypeId: this.data.subscriptionTypeId,
      activo: formValue.activo
    };

    const request$ = this.isEdit
      ? this.materiaService.update(this.data.materia.id, materiaDto)
      : this.materiaService.create(materiaDto);

    request$.subscribe({
      next: (result) => {
        
        this.dialogRef.close(result);
      },
      error: (err) => {
        console.error('❌ Error al guardar materia:', err);
        alert('Error al guardar la materia');
        this.isSaving = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
