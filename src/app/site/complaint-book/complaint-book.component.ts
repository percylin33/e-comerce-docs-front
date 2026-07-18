import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NbToastrService, NbCardModule, NbSpinnerModule } from '@nebular/theme';
import { Reclamation } from '../../@core/interfaces/reclamation';
import { ReclamationData } from '../../@core/interfaces/reclamation';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS, provideNativeDateAdapter } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

const ES_PE_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
    selector: 'ngx-complaint-book',
    templateUrl: './complaint-book.component.html',
    styleUrls: ['./complaint-book.component.scss'],
    standalone: true,
    imports: [
        NbCardModule,
        FormsModule,
        ReactiveFormsModule,
        NbSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatRadioModule,
        MatDatepickerModule,
        MatCheckboxModule,
        MatButtonModule,
    ],
    providers: [
        provideNativeDateAdapter(),
        { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
        { provide: MAT_DATE_FORMATS, useValue: ES_PE_DATE_FORMATS },
    ],
})
export class ComplaintBookComponent implements OnInit {
  private fb = inject(FormBuilder);
  private toastrService = inject(NbToastrService);
  private reclamationService = inject(ReclamationData);

  complaintForm!: FormGroup;
  ready = false;

  getDetalleLength(): number {
    if (!this.complaintForm) return 0;
    const value = this.complaintForm.get('detalle')?.value;
    return value ? value.length : 0;
  }

  ngOnInit(): void {
    this.initForm();
    this.ready = true;
  }

  initForm(): void {
    this.complaintForm = this.fb.group({
      // Identificación del cliente
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      apellido: ['', [Validators.required, Validators.minLength(3)]],
      tipo_documento: ['DNI', Validators.required],
      numero_documento: ['', [Validators.required, Validators.minLength(8)]],
      es_menor: [false, Validators.required],
      nombreApoderado: [''],

      // Ubicación y contacto
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      departamento: ['', Validators.required],
      provincia: ['', Validators.required],
      distrito: ['', Validators.required],
      telefono: [''],  // opcional
      email: ['', [Validators.required, Validators.email]],

      // Datos de la reclamación
      fecha_incidente: [null],  // opcional
      tipo: ['queja', Validators.required],
      codigoTransaccion: ['', Validators.required],
      montoPagado: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],  // opcional
      detalle: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],

      // Conformidad
      aceptaTerminos: [false, Validators.requiredTrue]
    });

    // Suscripciones
    this.complaintForm.get('es_menor')!.valueChanges.subscribe(value => {
      const apoderado = this.complaintForm.get('nombreApoderado')!;
      if (value) {
        apoderado.setValidators([Validators.required]);
      } else {
        apoderado.clearValidators();
      }
      apoderado.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    if (this.complaintForm.invalid) {
      this.toastrService.warning('Complete todos los campos correctamente', 'Formulario inválido');
      return;
    }
    this.ready = false;
    const reclamationData: Reclamation = this.complaintForm.value;
    this.reclamationService.sendReclamation(reclamationData).subscribe({
      next: (response) => {
        this.ready = true;
        if (response.status === 200) {
          this.toastrService.success('Reclamación enviada con éxito', 'Éxito');
          this.complaintForm.reset();
        }
      },
      error: () => {
        this.ready = true;
        this.toastrService.warning('Ocurrió un error al enviar la reclamación', 'Error');
      },
    });
  }
}
