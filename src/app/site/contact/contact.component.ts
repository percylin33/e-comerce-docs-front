import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EMAIL_PATTERN } from '../../@auth/components';
import { ContactData, Contact } from '../../@core/interfaces/contact';
import { NbToastrService } from '@nebular/theme';

interface WhatsAppContact {
  name: string;
  number: string;
  description: string;
  available: string;
  color: string;
}

@Component({
  selector: 'ngx-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit{
  contactForm: FormGroup;
  ready: boolean = false;
  formProgress: number = 0;
  
  // Múltiples contactos de WhatsApp
  whatsappContacts: WhatsAppContact[] = [
    {
      name: 'Ventas y Consultas',
      number: '51978768681',
      description: 'Consultas generales y atención personalizada de ventas',
      available: 'Lun-Vie 8:00-18:00',
      color: '#25d366'
    },
    {
      name: 'Soporte Pedagógico',
      number: '51961273370', // Cambia por tu número real
      description: 'Orientación pedagógica y soporte académico',
      available: 'Lun-Sab 9:00-20:00',
      color: '#128c7e'
    },
    {
      name: 'Soporte Técnico',
      number: '51953882987', // Cambia por tu número real
      description: 'Ayuda con problemas técnicos y configuración de la plataforma',
      available: '24/7',
      color: '#075e54'
    }
  ];

  // Información del PDF
  pdfInfo = {
    title: 'Guía Informativa Carpeta Digital',
    description: 'Descarga nuestra guía completa con toda la información sobre nuestros servicios',
    filename: 'carpeta-digital-info.html',
    url: '/assets/documents/carpeta-digital-info.html'
  };

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

  // Método mejorado para abrir WhatsApp con múltiples números
  openWhatsApp(contact: WhatsAppContact) {
    const message = `Hola, me interesa obtener más información sobre Carpeta Digital. Me gustaría hablar sobre: ${contact.description}`;
    const url = `https://wa.me/${contact.number}?text=${encodeURIComponent(message)}`;
    
    // Efecto de feedback visual
    this.toastrService.info(`Conectando con ${contact.name}...`, 'WhatsApp');
    
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // Método para descargar PDF
  downloadPDF() {
    try {
      // Crear un elemento 'a' temporal para la descarga
      const link = document.createElement('a');
      link.href = this.pdfInfo.url;
      link.download = this.pdfInfo.filename;
      link.target = '_blank';
      
      // Agregar al DOM, hacer click y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.toastrService.success('¡Descarga iniciada!', 'PDF Descargado');
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      this.toastrService.danger('Error al descargar el archivo. Intenta nuevamente.', 'Error de descarga');
    }
  }

  // Método para previsualizar PDF en modal/nueva ventana
  previewPDF() {
    try {
      window.open(this.pdfInfo.url, '_blank', 'noopener,noreferrer');
      this.toastrService.info('Abriendo vista previa...', 'PDF');
    } catch (error) {
      console.error('Error al abrir PDF:', error);
      this.toastrService.danger('Error al abrir el archivo. Intenta descargarlo.', 'Error de vista previa');
    }
  }

  // Método para obtener el color del botón de WhatsApp
  getWhatsAppButtonStyle(contact: WhatsAppContact) {
    return {
      'background': `linear-gradient(135deg, ${contact.color}, ${this.darkenColor(contact.color, 20)})`,
      'border-color': contact.color
    };
  }

  // Utilidad para oscurecer colores
  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
}
