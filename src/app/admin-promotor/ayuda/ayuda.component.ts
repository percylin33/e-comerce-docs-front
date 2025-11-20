import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ngx-ayuda',
  templateUrl: './ayuda.component.html',
  styleUrls: ['./ayuda.component.scss']
})
export class AyudaComponent implements OnInit {
  searchText = '';
  filteredSections: any[] = [];

  // Data-driven FAQ sections to render accordion-style items
  faqSections = [
    {
      id: 'cupones',
      title: 'Cupones y Códigos',
      icon: 'fas fa-tag',
      faqs: [
        {
          question: '¿Cómo genero mi código promocional?',
          answer: 'Tu código principal se genera automáticamente y lo encuentras en la sección "Cupones". Desde allí puedes copiarlo o compartirlo directamente.',
          open: true
        },
        {
          question: '¿Puedo tener múltiples códigos activos?',
          answer: 'Actualmente, cada embajador tiene un código principal activo. Estamos evaluando la opción de cupones personalizados para embajadores destacados en el futuro.',
          open: false
        },
        {
          question: '¿Cómo comparto mi código con mis contactos?',
          answer: 'En la sección "Cupones", encontrarás botones para copiar el código, compartirlo usando las opciones de tu dispositivo (WhatsApp, email, etc.) o generar un código QR.',
          open: false
        }
      ]
    },
    {
      id: 'pagos',
      title: 'Pagos y Comisiones',
      icon: 'fas fa-wallet',
      faqs: [
        {
          question: '¿Cuándo recibo mis comisiones?',
          answer: 'Las comisiones se pagan mensualmente, durante los primeros 5 días hábiles de cada mes, correspondientes a las ventas confirmadas del mes anterior.',
          open: false
        },
        {
          question: '¿Qué métodos de pago están disponibles?',
          answer: 'Ofrecemos transferencia bancaria directa (Perú), Yape, Plin y PayPal (internacional). Configura tu método preferido en "Mi Perfil" > "Método de Pago".',
          open: false
        },
        {
          question: '¿Hay un monto mínimo para retirar?',
          answer: 'Sí, el monto mínimo acumulado para procesar un pago es de S/ 50.00 (o su equivalente en USD para PayPal). Si no alcanzas el mínimo, se acumula para el siguiente mes.',
          open: false
        }
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing y Ventas',
      icon: 'fas fa-bullhorn',
      faqs: [
        {
          question: '¿Dónde encuentro materiales de marketing?',
          answer: 'En la sección "Guías y Tutoriales" encontrarás videos, guías PDF, plantillas, banners y logos listos para usar en tus promociones.',
          open: false
        },
        {
          question: '¿Cómo puedo aumentar mis ventas?',
          answer: 'Comparte contenido de valor, sé activo en redes sociales (especialmente grupos de docentes), utiliza los recursos visuales que te proporcionamos y explica claramente la solución que ofrece cada producto.',
          open: false
        },
        {
          question: '¿Es obligatorio repostear contenido de Carpeta Digital?',
          answer: 'Si bien no es estrictamente obligatorio, es altamente recomendable. Compartir nuestras publicaciones oficiales ayuda a construir confianza y mantener la coherencia de la marca.',
          open: false
        }
      ]
    },
    {
      id: 'tecnico',
      title: 'Soporte Técnico',
      icon: 'fas fa-tools',
      faqs: [
        {
          question: '¿Qué hago si no puedo acceder a mi cuenta?',
          answer: 'Primero, intenta usar la opción "¿Olvidaste tu contraseña?" en la página de inicio de sesión. Si eso no funciona, contacta con nosotros a través de los canales de soporte indicados en esta página.',
          open: false
        },
        {
          question: '¿Qué pasa si desactivo mi cuenta temporalmente?',
          answer: 'Si desactivas tu cuenta (función disponible en "Mi Perfil"), tu código dejará de funcionar y no generarás comisiones. Las comisiones pendientes (si superan el mínimo) se pagarán en el ciclo normal. Podrás reactivar tu cuenta cuando lo desees.',
          open: false
        },
        {
          question: '¿Qué pasa si elimino mi cuenta permanentemente?',
          answer: 'La eliminación es permanente e irreversible. Perderás acceso al panel, tus estadísticas y cualquier comisión pendiente por debajo del mínimo de pago. Las comisiones pendientes que superen el mínimo se pagarán. No podrás volver a registrarte como embajador por un período de 90 días.',
          open: false
        },
        {
          question: '¿El panel funciona bien en móviles?',
          answer: '¡Sí! El panel está diseñado para ser completamente funcional y fácil de usar en cualquier dispositivo: celular, tablet o computadora.',
          open: false
        }
      ]
    }
  ];

  ngOnInit() {
    this.filteredSections = [...this.faqSections];
  }

  toggleFaq(sectionIndex: number, faqIndex: number) {
    const section = this.filteredSections[sectionIndex];
    // Close other faqs in the same section (classic accordion behavior)
    section.faqs.forEach((f: any, idx: number) => {
      f.open = idx === faqIndex ? !f.open : false;
    });
  }

  onSearchChange(event: any) {
    const searchTerm = event.target.value.toLowerCase().trim();
    this.searchText = searchTerm;

    if (!searchTerm) {
      // Si no hay búsqueda, mostrar todas las secciones
      this.filteredSections = [...this.faqSections];
      return;
    }

    // Filtrar secciones y FAQs que coincidan con el término de búsqueda
    this.filteredSections = this.faqSections.map(section => {
      const filteredFaqs = section.faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm) || 
        faq.answer.toLowerCase().includes(searchTerm)
      );

      return {
        ...section,
        faqs: filteredFaqs
      };
    }).filter(section => section.faqs.length > 0);
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(`faq-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Opcional: abrir la primera pregunta de la sección
      setTimeout(() => {
        const sectionIndex = this.filteredSections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1 && this.filteredSections[sectionIndex].faqs.length > 0) {
          this.filteredSections[sectionIndex].faqs[0].open = true;
        }
      }, 500);
    }
  }

  get hasResults(): boolean {
    return this.filteredSections.length > 0;
  }
}
