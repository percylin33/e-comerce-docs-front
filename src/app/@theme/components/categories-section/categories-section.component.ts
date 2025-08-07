import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Servicios } from '../../../@core/interfaces/servicios';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'ngx-categories-section',
  templateUrl: './categories-section.component.html',
  styleUrls: ['./categories-section.component.scss']
})
export class CategoriesSectionComponent implements OnInit {
  services: Servicios[];
  selectedCategory: string;
  isMobile: boolean;

  constructor(private router: Router) {
    this.checkIfMobile();
     // Suscribirse a los eventos de navegación
     this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Limpiar la categoría seleccionada si la ruta no es una categoría
      if (!event.url.includes('/site/categorias/')) {
        this.selectedCategory = null;
      }
    });
  }

  ngOnInit() {
    // Llenar la data con el array proporcionado
    this.services = [
      { id: 1, description: 'Adquiere sesiones impactantes y efectivas', name: 'SESIONES' },
      { id: 6, description: 'Unidades de Aprendizaje y otros Kits de materiales', name: 'KITS' },
      { id: 2, description: 'Identifica oportunidades de mejora', name: 'EVALUACION' },
      { id: 3, description: 'Promueve aprendizajes significativos', name: 'ESTRATEGIAS' },
      { id: 4, description: 'Dinamiza tus clases con recursos creativos', name: 'RECURSOS' },
      { id: 5, description: 'Libros digitales para tu desarrollo personal y profesional', name: 'EBOOKS' },
      { id: 7, description: 'Invierte en tu crecimiento profesional y personal', name: 'TALLERES' }
    ];
  }

  @HostListener('window:resize', [])
  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768; // Define el ancho máximo para dispositivos móviles
  }

  onCategoryClick(service: string) {
    // Mapear SESIONES a PLANIFICACION para la selección
    if (service === 'SESIONES') {
      this.selectedCategory = 'PLANIFICACION';
    } else {
      this.selectedCategory = service;
    }

    // Determinar qué categoría enviar al backend
    /*let categoryToSend = service;
    if (service === 'KITS DE PLANIFICACION') {
      categoryToSend = 'KITS';
    }*/
  
    const queryParams = {
      category: service,
    };
    
    this.router.navigate([`/site/categorias/${service}`], { queryParams });
  }
  toggleSidebar() {

  }
}

