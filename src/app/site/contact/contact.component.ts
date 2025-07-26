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
  formProgress: number = 0;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactData,
    private toastrService: NbToastrService
  )
  { }

  ngOnInit(): void {
      this.initForm();
      this.ready = true;
      this.setupFormProgressTracking();
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

  setupFormProgressTracking() {
    this.contactForm.valueChanges.subscribe(() => {
      this.calculateFormProgress();
    });
  }

  calculateFormProgress() {
    const controls = Object.keys(this.contactForm.controls);
    const validControls = controls.filter(key => 
      this.contactForm.get(key)?.valid
    ).length;
    this.formProgress = (validControls / controls.length) * 100;
  }

  onSubmit() {
    if (this.contactForm.invalid) {
      this.markFormGroupTouched(this.contactForm);
      this.toastrService.warning('Complete todos los campos correctamente', 'Formulario incompleto');
      return;
    }
    
    this.ready = false;
    const data = this.contactForm.value;
    
    this.contactService.sendContact(data).subscribe({
      next: (response) => {
        this.ready = true;
        if (response.status === 200) {
          this.toastrService.success('¡Mensaje enviado con éxito! Te responderemos pronto.', 'Mensaje enviado');
          this.contactForm.reset();
          this.resetFormValidation();
        } else {
          this.toastrService.warning('Hubo un problema al enviar el mensaje. Intenta nuevamente.', 'Error al enviar');
        }
      },
      error: (error) => {
        this.ready = true;
        console.error('Error al enviar contacto:', error);
        this.toastrService.danger('No pudimos enviar tu mensaje. Verifica tu conexión e intenta nuevamente.', 'Error de conexión');
      },
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private resetFormValidation() {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsUntouched();
      control?.markAsPristine();
    });
  }

  // Método para abrir WhatsApp (alternativo al href)
  openWhatsApp() {
    const phoneNumber = '51978768681';
    const message = 'Hola, me interesa obtener más información sobre Carpeta Digital';
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
