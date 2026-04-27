import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, AfterViewInit, TemplateRef, ViewContainerRef, inject, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Document, DocumentData } from '../../@core/interfaces/documents';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { MatIcon } from '@angular/material/icon';
import { CardComponent } from '../../shared/component/card/card.component';
import { NbIconModule, NbAccordionModule } from '@nebular/theme';
import { CarrouselComponent } from '../../shared/component/carrousel/carrousel.component';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'ngx-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIcon, CardComponent, NbIconModule, RouterLink, CarrouselComponent, NbAccordionModule, MatButton]
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private document = inject(DocumentData);
  private renderer = inject(Renderer2);
  private router = inject(Router);
  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private cdr = inject(ChangeDetectorRef);

  readonly searchBarContainer = viewChild<ElementRef>('searchBarContainer');
  readonly searchWrapper = viewChild<ElementRef>('searchWrapper');
  readonly suggestionsTemplate = viewChild<TemplateRef<unknown>>('suggestionsTemplate');

  suggestions: string[] = [];
  suggestionDocuments: Document[] = [];
  ducumentList: Document[] = [];
  showCarousel: boolean = true;
  selectedSuggestionIndex: number = -1;
  showSuggestions: boolean = false;
  isSearching: boolean = false;
  private destroy$ = new Subject<void>();
  private searchSubject: Subject<string> = new Subject();
  private intersectionObserver!: IntersectionObserver;
  private overlayRef: OverlayRef | null = null;

  preguntasYRespuestas = [
    {
      pregunta: '¿Qué tipo de documentos puedo comprar en la plataforma?',
      respuesta: 'En nuestra plataforma ofrecemos una amplia gama de documentos educativos sobre planificación curricular, evaluación, estrategias y recursos diseñados para cubrir diversas áreas y grados de la educación básica. Puedes encontrar desde programaciones anuales, unidades didácticas, sesiones de aprendizaje, Instrumentos de Evaluación, hasta fichas de aplicación y materiales de refuerzo escolar. Cada documento es creado y revisado por expertos en el área o nivel, lo que garantiza que los contenidos sean precisos y útiles para el usuario. Nos esforzamos por proporcionar material de calidad tanto para docentes como para padres de familia y estudiantes que deseen potenciar el aprendizaje impartido en sus aulas de clase. Ya sea que busques planificaciones para mejorar tu labor docente en aula o apoyo pedagógico para potenciar el aprendizaje de tu menor de edad, nuestra plataforma tiene algo para ti.'
    },
    {
      pregunta: '¿Cómo puedo estar seguro de la calidad de los documentos? ',
      respuesta: 'Sabemos que la calidad de los documentos es fundamental, por eso cada material que se publica en nuestra plataforma pasa por un proceso de revisión exhaustivo. Nuestro equipo de expertos en diferentes niveles y áreas revisa los documentos para garantizar que cumplan con altos estándares de calidad en términos de contenido, formato y relevancia. Además, los usuarios pueden calificar y dejar comentarios sobre los documentos después de su compra. Esto te permitirá ver las opiniones y valoraciones de otros usuarios antes de realizar una compra, ayudándote a tomar una decisión informada. También ofrecemos la posibilidad de descargar una vista previa del documento para que puedas evaluar su contenido antes de adquirirlo.'
    },
    {
      pregunta: '¿Es necesario crear una cuenta para comprar documentos?',
      respuesta: 'Sí, crear una cuenta es necesario para realizar compras en nuestra plataforma. Al crear una cuenta, no solo tendrás acceso a la compra de documentos, sino también a varias funcionalidades adicionales. Podrás revisar tu historial de compras, descargar nuevamente cualquier documento adquirido, y también guardar documentos en tu lista de favoritos para futuras compras. Tener una cuenta te permitirá acceder a descuentos exclusivos y recibir actualizaciones sobre nuevos documentos en tu área de interés. Además, contarás con soporte técnico personalizado en caso de cualquier problema con tus compras o el uso de la plataforma.'
    },
    {
      pregunta: '¿Cómo realizo el pago por un documento?',
      respuesta: 'Realizar un pago en nuestra plataforma es sencillo y seguro. Aceptamos diferentes métodos de pago, incluidos tarjetas de crédito y débito, PayPal y transferencias bancarias. Durante el proceso de pago, toda la información personal y financiera está protegida mediante encriptación avanzada para garantizar la máxima seguridad. Una vez completada la transacción, el documento se desbloqueará para ti y podrás descargarlo directamente desde tu cuenta. También recibirás un correo de confirmación con un enlace a tu compra, por lo que siempre tendrás acceso al documento en caso de necesitarlo nuevamente en el futuro.'
    },
    {
      pregunta: '¿Puedo compartir los documentos que compro?',
      respuesta: 'Aunque entendemos que quieras compartir el material que has adquirido, los documentos comprados en nuestra plataforma son para uso personal. La redistribución de los documentos está prohibida, ya que infringe los derechos de autor de los creadores. Si deseas que otras personas accedan al mismo material, cada usuario deberá adquirir su propia copia. Nuestra misión es apoyar a los autores y creadores de contenido educativo, y compartir los documentos sin permiso afecta directamente su trabajo. Además, ofrecer descuentos y promociones ocasionales permite que los documentos sean accesibles para una mayor cantidad de personas.'
    },
    {
      pregunta: '¿Qué debo hacer si no encuentro el documento que necesito?',
      respuesta: 'Si no encuentras el documento específico que estás buscando, no te preocupes. Estamos constantemente actualizando nuestra base de datos con nuevos contenidos y trabajamos junto con autores y colaboradores para agregar material relevante en diversas áreas. Si necesitas un documento en particular, puedes usar nuestro formulario de solicitud, donde podrás describir el material que necesitas. Nuestro equipo revisará tu solicitud y, en muchos casos, podremos recomendarte documentos similares o contactar a autores que puedan crear el contenido que buscas. También te sugerimos suscribirte a nuestras notificaciones, para que recibas alertas cuando se publique nuevo material en la categoría que te interesa.'
    }
  ];

  currentYear = new Date().getFullYear();

  services = [
    { icon: 'stars', title: 'PLANIFICACION', subtitle: `${new Date().getFullYear()}`, route: '/site/membresia' },
    { icon: 'folder_special', title: 'PLANIFICACIÓN', subtitle: `${new Date().getFullYear() - 1} - ${new Date().getFullYear() - 2} ...`, route: '/site/categorias/KITS' },
    { icon: 'library_books', title: 'SESIONES', route: '/site/categorias/PLANIFICACION' },
    { icon: 'brain', title: 'KIT DE REFORZAMIENTO', route: '/site/categorias/REFORZAMIENTO' },
    { icon: 'menu_book', title: 'KIT DE PLAN LECTOR', route: '/site/categorias/PLAN_LECTOR' },
    { icon: 'extension', title: 'ESTRATEGIAS', route: '/site/categorias/ESTRATEGIAS' },
    { icon: 'assessment', title: 'EVALUACIÓN', route: '/site/categorias/EVALUACION' },
    { icon: 'inventory', title: 'RECURSOS', route: '/site/categorias/RECURSOS' },
    { icon: 'laptop', title: 'EBOOK Y TALLERES', route: '/site/categorias/EBOOKS' },
    { icon: 'redeem', title: 'MATERIAL GRATIS', route: '/site/categorias/MATERIAL_GRATIS' }
  ];

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });

    this.renderer.listen('document', 'click', (event: Event) => {
      const container = this.searchBarContainer();
      if (container && !container.nativeElement.contains(event.target)) {
        this.suggestions = [];
        this.hideOverlay();
      }
    });
  }

  ngAfterViewInit(): void {
    this.setupScrollAnimations();
  }

  private setupScrollAnimations(): void {
    // Configurar el Intersection Observer
    const observerOptions = {
      threshold: 0.1, // Se activa cuando el 10% del elemento es visible
      rootMargin: '0px 0px -50px 0px' // Se activa un poco antes de que sea completamente visible
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Agregar clase de animación cuando el elemento entra en viewport
          entry.target.classList.add('animate-in-view');
          
          // Para service cards y faq items, también animar sus hijos
          if (entry.target.classList.contains('services-section')) {
            const serviceCards = entry.target.querySelectorAll('.service-card');
            serviceCards.forEach((card, index) => {
              setTimeout(() => {
                card.classList.add('animate-in-view');
              }, index * 100);
            });
          }
          
          if (entry.target.classList.contains('faq-section')) {
            const faqItems = entry.target.querySelectorAll('.faq-item');
            const faqHeader = entry.target.querySelector('.faq-header');
            const faqFooter = entry.target.querySelector('.faq-footer');
            
            // Animar header primero
            if (faqHeader) {
              faqHeader.classList.add('animate-in-view');
            }
            
            // Animar items con delay escalonado
            faqItems.forEach((item, index) => {
              setTimeout(() => {
                item.classList.add('animate-in-view');
              }, 200 + (index * 150));
            });
            
            // Animar footer al final
            if (faqFooter) {
              setTimeout(() => {
                faqFooter.classList.add('animate-in-view');
              }, 200 + (faqItems.length * 150) + 300);
            }
          }
          
          // Para resultados de búsqueda
          if (entry.target.classList.contains('search-results-container')) {
            const header = entry.target.querySelector('.search-results-header');
            const cards = entry.target.querySelectorAll('.card-item');
            
            if (header) {
              header.classList.add('animate-in-view');
            }
            
            cards.forEach((card, index) => {
              setTimeout(() => {
                card.classList.add('animate-in-view');
              }, index * 100);
            });
          }
          
          // Opcional: dejar de observar el elemento después de animar
          this.intersectionObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observar todos los elementos con clases de animación después de un pequeño delay
    setTimeout(() => {
      const elementsToAnimate = document.querySelectorAll(
        '.animate-on-scroll, .services-section, .faq-section, .search-results-container, ngx-carrousel'
      );
      
      elementsToAnimate.forEach(element => {
        this.intersectionObserver.observe(element);
      });
    }, 100);
  }

  onSearchInput(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
    
    if (searchTerm.trim().length > 0) {
      this.showSuggestions = true;
      // Mostrar overlay cuando hay sugerencias
      this.showOverlay();
    } else {
      this.showSuggestions = false;
      this.ducumentList = [];
      this.suggestions = [];
      this.suggestionDocuments = [];
      this.showCarousel = true;
      this.hideOverlay();
    }
  }

  private showOverlay(): void {
    const wrapper = this.searchWrapper();
    const template = this.suggestionsTemplate();
    if (!this.overlayRef && wrapper && template) {
      const positionStrategy = this.overlay.position()
        .flexibleConnectedTo(wrapper)
        .withPositions([
          {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
            offsetY: 2
          } as ConnectedPosition
        ]);

      this.overlayRef = this.overlay.create({
        positionStrategy,
        scrollStrategy: this.overlay.scrollStrategies.reposition(),
        hasBackdrop: false,
        width: wrapper.nativeElement.offsetWidth,
        maxHeight: 300
      });
    }

    if (this.overlayRef && !this.overlayRef.hasAttached() && template) {
      const portal = new TemplatePortal(template, this.viewContainerRef);
      this.overlayRef.attach(portal);
    }
  }

  private hideOverlay(): void {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }
  }

  private updateSuggestionsPosition(): void {
    // Método eliminado - CDK Overlay maneja automáticamente la posición
  }

  onSearchFocus(): void {
    // Mostrar sugerencias si ya hay texto
    const input = document.querySelector('.modern-search-input') as HTMLInputElement;
    if (input && input.value.trim() && this.suggestions.length > 0) {
      this.showSuggestions = true;
      this.showOverlay();
    }
  }

  onSearchBlur(): void {
    // Ocultar sugerencias después de un pequeño delay para permitir clicks
    setTimeout(() => {
      this.showSuggestions = false;
      this.hideOverlay();
    }, 200);
  }

  onSearchButtonClick(): void {
    const searchTerm = (document.querySelector('.search-bar input') as HTMLInputElement).value;
    this.performSearch(searchTerm);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (this.selectedSuggestionIndex >= 0 && this.selectedSuggestionIndex < this.suggestions.length) {
        this.selectSuggestion(this.suggestions[this.selectedSuggestionIndex]);
      } else {
        this.onSearchButtonClick();
      }
    } else if (event.key === 'ArrowDown') {
      this.selectedSuggestionIndex = (this.selectedSuggestionIndex + 1) % this.suggestions.length;
    } else if (event.key === 'ArrowUp') {
      this.selectedSuggestionIndex = (this.selectedSuggestionIndex - 1 + this.suggestions.length) % this.suggestions.length;
    } else if (event.key === 'Escape') {
      this.suggestions = [];
    }
  }

  performSearch(searchTerm: string): void {
    if (searchTerm.trim() === '') {
      this.ducumentList = [];
      this.suggestions = [];
      this.suggestionDocuments = [];
      this.showCarousel = true;
      this.isSearching = false;
      return;
    }

    this.isSearching = true;
    const normalizedSearchTerm = this.normalizeString(searchTerm);

    this.document.searchDocuments('title', searchTerm, false).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        const searchResults = response.data;
        this.ducumentList = searchResults.filter((doc: Document) => 
          this.normalizeString(doc.title).includes(normalizedSearchTerm)
        );
        this.suggestions = this.ducumentList.map((doc: Document) => doc.title);
        this.suggestionDocuments = [...this.ducumentList];
        this.showCarousel = this.ducumentList.length === 0;
        this.isSearching = false;
        if (this.suggestions.length > 0) {
          this.showOverlay();
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isSearching = false;
        this.cdr.markForCheck();
      }
    });
  }

  selectSuggestion(suggestion: string): void {
    const selectedDocument = this.suggestionDocuments.find(doc => doc.title === suggestion);
    
    if (selectedDocument && selectedDocument.id) {
      this.router.navigate(['/site/detail', selectedDocument.id]);
    } else {
      this.suggestions = [];
      (document.querySelector('.modern-search-input') as HTMLInputElement).value = suggestion;
      this.onSearchInput(suggestion);
    }
    
    this.suggestions = [];
    this.hideOverlay();
  }

  getColClass(index: number): string {
    const totalItems = this.ducumentList.length;
    if (totalItems < 5) {
      return 'col-lg-' + (12 / totalItems);
    } else {
      return 'col-xl-2 col-lg-3 col-md-4 col-sm-6 col-12';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  onServiceClick(service: any): void {
    if (service.route) {
      this.router.navigate([service.route]);
    }
  }

  onContactClick(): void {
    this.router.navigate(['/site/contacto']);
  }

  private normalizeString(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  isFontAwesome(icon: string): boolean {
    return icon === 'brain';
  }
}
