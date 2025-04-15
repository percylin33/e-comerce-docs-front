import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Servicios, ServiciosData } from '../../../@core/interfaces/servicios';
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

  constructor(private router: Router,
              private servicesService: ServiciosData
  ) {
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
    this.servicesService.getServicios().subscribe(response => {
      this.services = response.data.map(service => {
        if (service.name === 'PLANIFICACION') {
          return { ...service, name: 'SESIONES' };
        }
        return service;
      });
    });
  }

  @HostListener('window:resize', [])
  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768; // Define el ancho máximo para dispositivos móviles
    console.log('isMobile:', this.isMobile); // Depuración
  }

  onCategoryClick(service: string) {
    if (service === 'SESIONES') {
      this.selectedCategory = 'PLANIFICACION';
    } else {
      this.selectedCategory = service;
    }
  
    const queryParams = {
      category: service, // Puedes ajustar estos valores según sea necesario
    };
    
    if (service === 'KITS') {
      this.router.navigate([`/site/categorias/${service}`], { queryParams });
    }else {
      this.router.navigate([`/site/categorias/${service}`], { queryParams });
    }
  }
  toggleSidebar() {

  }
}

