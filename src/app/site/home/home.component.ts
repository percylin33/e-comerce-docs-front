import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { SearchComponent } from '../../shared/component/search/search.component';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Document, DocumentData } from '../../@core/interfaces/documents';

@Component({
  selector: 'ngx-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild(SearchComponent) searchComponent: SearchComponent;
  @ViewChild('searchBarContainer') searchBarContainer: ElementRef;

  suggestions: string[] = [];
  ducumentList: Document[] = [];
  originalDocuments: Document[] = [];
  showCarousel: boolean = true;
  selectedSuggestionIndex: number = -1;
  showSuggestions: boolean = false;
  private destroy$ = new Subject<void>();
  private searchSubject: Subject<string> = new Subject();

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

  levels = [
    { img: '/assets/iconos/inicial.webp', title: 'Inicial' },
    { img: '/assets/iconos/primaria.webp', title: 'Primaria' },
    { img: '/assets/iconos/secundaria.webp', title: 'Secundaria' },
  ];

  constructor(private document: DocumentData, private renderer: Renderer2) { }

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(1000), // Espera 300ms
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });

    this.renderer.listen('document', 'click', (event: Event) => {
      if (this.searchBarContainer && !this.searchBarContainer.nativeElement.contains(event.target)) {
        this.suggestions = [];
      }
    });
  }

  onSearchInput(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
    this.showSuggestions = true;
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
      this.showCarousel = true;
      return;
    }

    const normalizedSearchTerm = this.normalizeString(searchTerm);

    this.document.searchDocuments('title', searchTerm).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        const searchResults = response.data;
        this.ducumentList = searchResults.filter((doc: Document) => 
          this.normalizeString(doc.title).includes(normalizedSearchTerm)
        );
        this.suggestions = this.ducumentList.map((doc: Document) => doc.title);
        this.showCarousel = this.ducumentList.length === 0;
      },
      error: (error) => {
        console.error('Error al cargar documentos:', error);
      }
    });
  }

  selectSuggestion(suggestion: string): void {
    this.suggestions = [];
    (document.querySelector('.search-bar input') as HTMLInputElement).value = suggestion;
    this.onSearchInput(suggestion);
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
  }

  private normalizeString(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

}
