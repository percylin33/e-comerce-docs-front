import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbToastrService } from '@nebular/theme';
import { Reclamation } from '../../@core/interfaces/reclamation';
import { ReclamationData } from '../../@core/interfaces/reclamation';

@Component({
  selector: 'ngx-complaint-book',
  templateUrl: './complaint-book.component.html',
  styleUrls: ['./complaint-book.component.scss'],
})
export class ComplaintBookComponent implements OnInit {
  complaintForm: FormGroup;
  ready = false;

  constructor(
    private fb: FormBuilder,
    private toastrService: NbToastrService,
    private reclamationService: ReclamationData
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.ready = true;

    this.complaintForm.get('es_menor').valueChanges.subscribe(value => {
      if (value) {
        this.complaintForm.get('nombreApoderado').setValidators([Validators.required]);
      } else {
        this.complaintForm.get('nombreApoderado').clearValidators();
      }
      this.complaintForm.get('nombreApoderado').updateValueAndValidity();
    });
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
      detalle: ['', [Validators.required, Validators.minLength(10)]],

      // Conformidad
      aceptaTerminos: [false, Validators.requiredTrue]
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
