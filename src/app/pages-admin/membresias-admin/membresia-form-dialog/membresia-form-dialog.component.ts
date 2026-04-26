import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { SubscriptionType, NivelEducativo } from '../../../@core/data/subscription-types';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel, MatError, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';

export interface MembresiaFormDialogData {
  membresia?: SubscriptionType;
  isEdit: boolean;
}

@Component({
    selector: 'ngx-membresia-form-dialog',
    templateUrl: './membresia-form-dialog.component.html',
    styleUrls: ['./membresia-form-dialog.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatError, MatSelect, MatOption, MatHint, MatCheckbox, MatIcon, MatIconButton, MatButton, MatDialogActions]
})
export class MembresiaFormDialogComponent implements OnInit {
  get beneficiosGenerales(): FormArray {
    const array = this.form.get('beneficiosGenerales') as FormArray;
    console.log('🔍 Getter beneficiosGenerales llamado, valor actual:', array?.value);
    return array;
  }

  addBeneficio(): void {
    console.log('🔍 Agregando beneficio. FormArray actual:', this.beneficiosGenerales.value);
    this.beneficiosGenerales.push(new FormControl(''));
    console.log('✅ Beneficio agregado. FormArray nuevo:', this.beneficiosGenerales.value);
  }

  removeBeneficio(index: number): void {
    console.log('🔍 Eliminando beneficio en índice:', index, 'FormArray actual:', this.beneficiosGenerales.value);
    this.beneficiosGenerales.removeAt(index);
    console.log('✅ Beneficio eliminado. FormArray nuevo:', this.beneficiosGenerales.value);
  }

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
    console.log('🏗️ Constructor llamado con data:', data);
    this.form = this.createForm();
  }

  ngOnInit(): void {
    console.log('🔍 ngOnInit() - data:', this.data);
    if (this.data.isEdit && this.data.membresia) {
      console.log('📝 Editando membresía:', this.data.membresia);
      console.log('🎯 beneficiosGenerales de la membresía:', this.data.membresia.beneficiosGenerales);

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
        descuentoUnidadesPasadas: this.data.membresia.descuentoUnidadesPasadas || 0,
        tipoPeriodo: this.data.membresia.tipoPeriodo || 'M'
      });

      // Inicializar FormArray de beneficiosGenerales
      const beneficios = this.data.membresia.beneficiosGenerales || [];
      console.log('🔄 Inicializando FormArray con beneficios:', beneficios);
      this.beneficiosGenerales.clear();
      beneficios.forEach(b => this.beneficiosGenerales.push(new FormControl(b)));
      console.log('✅ FormArray inicializado:', this.beneficiosGenerales.value);
    } else {
      console.log('🆕 Creando nueva membresía');
    }
  }

  createForm(): FormGroup {
    const form = this.fb.group({
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
      descuentoUnidadesPasadas: [0, [Validators.min(0), Validators.max(100)]],
      beneficiosGenerales: this.fb.array([])
      ,tipoPeriodo: ['M', Validators.required]
    });
    console.log('🏗️ Formulario creado:', form.value);
    return form;
  }

  getTitle(): string {
    return this.data.isEdit ? 'Editar Membresía' : 'Nueva Membresía';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    console.log('🔍 Iniciando onSave()');
    console.log('📝 Formulario válido:', this.form.valid);
    console.log('📋 Formulario completo:', this.form.value);
    console.log('🎯 FormArray beneficiosGenerales:', this.beneficiosGenerales.value);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.log('❌ Formulario inválido, marcando errores');
      return;
    }

    const formValue = this.form.value;
    console.log('📝 formValue inicial:', formValue);

    // Obtener valores del FormArray y filtrar vacíos
    const beneficiosFiltrados = (this.beneficiosGenerales.value || []).filter((b: string) => !!b && b.trim() !== '');
    console.log('🔍 beneficiosGenerales.value:', this.beneficiosGenerales.value);
    console.log('🎯 beneficiosFiltrados:', beneficiosFiltrados);

    formValue.beneficiosGenerales = beneficiosFiltrados;
    console.log('📝 formValue con beneficios filtrados:', formValue);

    // Si es edición, incluir el ID
    const result = this.data.isEdit 
      ? { ...formValue, id: this.data.membresia.id }
      : formValue;

    console.log('✅ Resultado final a enviar:', result);
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
