import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EMAIL_PATTERN } from '../../@auth/components';
import { ContactData, Contact } from '../../@core/interfaces/contact';
import { NbToastrService } from '@nebular/theme';

@Component({
  selector: 'ngx-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit{
  contactForm: FormGroup;
  ready: boolean = false;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactData,
    private toastrService: NbToastrService // Inyectar servicio de Toastr
  )
  { }

  ngOnInit(): void {
      this.initForm();
      this.ready = true;
  }

  initForm() {
    this.contactForm = this.fb.group({
      nombre:this.fb.control('',[Validators.required, Validators.minLength(3), Validators.maxLength(20)]),
      apellido:this.fb.control('',[Validators.required, Validators.minLength(3), Validators.maxLength(20)]),
      email:this.fb.control('',[Validators.required, Validators.pattern(EMAIL_PATTERN)]),
      telefono:this.fb.control('',[Validators.required, Validators.minLength(9), Validators.maxLength(15)]),
      mensaje:this.fb.control('',[Validators.required, Validators.minLength(10), Validators.maxLength(500)])
    });
  }

  onSubmit() {
    if (this.contactForm.invalid) {
      this.toastrService.warning('Complete todos los campos correctamente', 'Formulario inválido');
      return;
    }
    this.ready = false;
    const data = this.contactForm.value;
    this.contactService.sendContact(data).subscribe({
      next: (response) => {
        this.ready = true;
        if (response.status === 200) {
          this.toastrService.success('Mensaje enviado con éxito', 'Éxito');
          this.contactForm.reset();
        }
      },
      error: () => {
        this.ready = true;
        this.toastrService.warning('Ocurrió un error al enviar el mensaje', 'Error');
      },
    });
  }
}
