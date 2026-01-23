import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SubscriptionType, NivelEducativo } from '../../../@core/data/subscription-types';

export interface MembresiaFormDialogData {
  membresia?: SubscriptionType;
  isEdit: boolean;
}

@Component({
  selector: 'ngx-membresia-form-dialog',
  templateUrl: './membresia-form-dialog.component.html',
  styleUrls: ['./membresia-form-dialog.component.scss']
})
export class MembresiaFormDialogComponent implements OnInit {

  form: FormGroup;
  nivelesEducativos: NivelEducativo[] = ['INICIAL', 'PRIMARIA', 'SECUNDARIA', 'TODOS'];
  coloresBadge = [
    { value: null, label: 'Sin color' },
    { value: 'primary', label: 'Azul (Primary)' },
    { value: 'success', label: 'Verde (Success)' },
    { value: 'warning', label: 'Amarillo (Warning)' },
    { value: 'info', label: 'Celeste (Info)' },
    { value: 'danger', label: 'Rojo (Danger)' }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MembresiaFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MembresiaFormDialogData
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.membresia) {
      this.form.patchValue({
        nombre: this.data.membresia.nombre,
        descripcion: this.data.membresia.descripcion,
        textoDescuento: this.data.membresia.textoDescuento,
        textoPrecio: this.data.membresia.textoPrecio,
        notaPrecio: this.data.membresia.notaPrecio,
        nivel: this.data.membresia.nivel,
        esRecomendada: this.data.membresia.esRecomendada,
        esPopular: this.data.membresia.esPopular,
        posicion: this.data.membresia.posicion,
        activo: this.data.membresia.activo,
        colorBadge: this.data.membresia.colorBadge,
        esEspecial: this.data.membresia.esEspecial || false,
        descuentoUnidadesPasadas: this.data.membresia.descuentoUnidadesPasadas || 0
      });
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.maxLength(500)]],
      textoDescuento: ['', Validators.maxLength(100)],
      textoPrecio: ['', [Validators.required, Validators.maxLength(50)]],
      notaPrecio: ['', Validators.maxLength(200)],
      nivel: ['TODOS', Validators.required],
      esRecomendada: [false],
      esPopular: [false],
      posicion: [0, [Validators.required, Validators.min(0)]],
      activo: [true],
      colorBadge: [null],
      // Soporte para Unidades Históricas
      esEspecial: [false],
      descuentoUnidadesPasadas: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  getTitle(): string {
    return this.data.isEdit ? 'Editar Membresía' : 'Nueva Membresía';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    
    // Si es edición, incluir el ID
    const result = this.data.isEdit 
      ? { ...formValue, id: this.data.membresia.id }
      : formValue;

    this.dialogRef.close(result);
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.form.get(controlName);
    return control?.hasError(errorName) && (control.dirty || control.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    
    if (control?.hasError('min')) {
      return 'El valor debe ser mayor o igual a 0';
    }
    
    if (control?.hasError('max')) {
      const maxValue = control.errors['max'].max;
      return `El valor debe ser menor o igual a ${maxValue}`;
    }
    
    return '';
  }
}
