import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, AfterViewInit, PLATFORM_ID, TemplateRef, ViewContainerRef, WritableSignal, inject, viewChild, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { catchError, debounceTime, takeUntil } from 'rxjs/operators';
import { Document, DocumentData, GetDocumentsResponse } from '../../@core/interfaces/documents';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { MatIcon } from '@angular/material/icon';
import { CardComponent } from '../../shared/component/card/card.component';
import { NbIconModule, NbAccordionModule } from '@nebular/theme';
import { CtaBannerComponent } from '../../shared/component/cta-banner/cta-banner.component';
import { CardSkeletonComponent } from '../../shared/component/card-skeleton/card-skeleton.component';
import { OnboardingNudgeComponent } from '../../shared/component/onboarding-nudge';
import { ShowcaseSectionComponent } from '../../shared/component/showcase-section';
import { HomePromotionPopupComponent } from '../promotions/ui/home-promotion-popup/home-promotion-popup.component';

type ProductCarouselKey = 'recent' | 'popular' | 'sold' | 'free';

interface ProductCarouselSection {
  key: ProductCarouselKey;
  title: string;
  subtitle: string;
  icon: string;
  actionRoute: string | any[];
  items: WritableSignal<Document[]>;
  page: WritableSignal<number>;
  totalPages: WritableSignal<number>;
  totalItems: WritableSignal<number>;
  loading: WritableSignal<boolean>;
  loadingMore: WritableSignal<boolean>;
  error: WritableSignal<boolean>;
  loaded: WritableSignal<boolean>;
  free?: boolean;
  fetch: (page: number, pageSize: number) => Observable<GetDocumentsResponse>;
}

/** API mínima del web component Swiper usada en el home */
type HomeProductSwiperLite = {
  isBeginning: boolean;
  isEnd: boolean;
  slideNext: (speed?: number) => void;
  slidePrev: (speed?: number) => void;
  update: () => void;
};

@Component({
    selector: 'ngx-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
      MatIcon, CardComponent, NbIconModule, RouterLink,
      NbAccordionModule, CtaBannerComponent,
      CardSkeletonComponent, OnboardingNudgeComponent, ShowcaseSectionComponent,
      HomePromotionPopupComponent,
    ],
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  /** Controla si hay una petición pendiente por sección para evitar múltiples cargas seguidas */
  private carouselPendingLoad: Record<string, boolean> = {};
  /** Tras cargar más ítems, Swiper dispara varios eventos: ignorar “pedir siguiente página” unos ms. */
  private homeProductEndCooldownUntil: Partial<Record<ProductCarouselKey, number>> = {};
  /** Debounce para reachEnd / arrastre al final (evita ráfagas de peticiones). */
  private homeProductLoadMoreDebounce: Partial<Record<ProductCarouselKey, ReturnType<typeof setTimeout>>> = {};
  private document = inject(DocumentData);
  private renderer = inject(Renderer2);
  private router = inject(Router);
  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);

  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  /** Imagen hero LCP: en viewport menor a 769px no se muestra; no montar el bloque evita descargar el WebP con fetchpriority high. */
  readonly showHeroLcpImage = signal(this.getInitialHeroLcpVisibility());
  private heroPhotoMediaCleanup: (() => void) | null = null;

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
      pregunta: '¿Cómo recibo el material después de comprar?',
      respuesta: 'Después de confirmar el pago, el material queda disponible en tu cuenta para descarga inmediata.'
    },
    {
      pregunta: '¿Los materiales son editables?',
      respuesta: 'Sí. Muchos recursos se entregan en formatos editables para que puedas adaptarlos a tu grado, aula o programación.'
    },
    {
      pregunta: '¿Cuentan con soporte para docentes?',
      respuesta: 'Sí. Nuestro equipo puede ayudarte con dudas sobre acceso, descargas, compras y uso del material.'
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

  readonly carouselPageSize = 10;
  readonly skeletonItems = Array.from({ length: 5 });
  readonly productCarousels: ProductCarouselSection[] = [
    {
      key: 'recent',
      title: 'Añadidos Recientemente',
      subtitle: 'Nuevos materiales educativos frescos cada semana.',
      icon: 'new_releases',
      actionRoute: '/site/categorias',
      items: signal<Document[]>([]),
      page: signal(0),
      totalPages: signal(1),
      totalItems: signal(0),
      loading: signal(false),
      loadingMore: signal(false),
      error: signal(false),
      loaded: signal(false),
      fetch: (page, pageSize) => this.document.getDocumentServiceRecientes(page, pageSize),
    },
    {
      key: 'popular',
      title: 'Los más populares',
      subtitle: 'Los preferidos por miles de docentes.',
      icon: 'trending_up',
      actionRoute: '/site/categorias',
      items: signal<Document[]>([]),
      page: signal(0),
      totalPages: signal(1),
      totalItems: signal(0),
      loading: signal(false),
      loadingMore: signal(false),
      error: signal(false),
      loaded: signal(false),
      fetch: (page, pageSize) => this.document.getDocumentServiceMasVendidos(page, pageSize),
    },
    {
      key: 'free',
      title: 'Descargas Gratis',
      subtitle: 'Recursos gratuitos listos para usar en clase.',
      icon: 'redeem',
      actionRoute: '/site/categorias/MATERIAL_GRATIS',
      items: signal<Document[]>([]),
      page: signal(0),
      totalPages: signal(1),
      totalItems: signal(0),
      loading: signal(false),
      loadingMore: signal(false),
      error: signal(false),
      loaded: signal(false),
      free: true,
      fetch: (page, pageSize) => this.document.getDocumentFree(page, pageSize),
    },
  ];

  /** Estado de flechas prev/next (next sigue activo si hay más páginas aunque Swiper esté en el último slide actual). */
  readonly homeProductCarouselEdge: Record<
    ProductCarouselKey,
    { atStart: ReturnType<typeof signal<boolean>>; atEnd: ReturnType<typeof signal<boolean>> }
  > = {
    recent: { atStart: signal(true), atEnd: signal(false) },
    popular: { atStart: signal(true), atEnd: signal(false) },
    sold: { atStart: signal(true), atEnd: signal(false) },
    free: { atStart: signal(true), atEnd: signal(false) },
  };

  ngOnInit(): void {
    this.setupHeroLcpImageVisibility();

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

    this.scheduleProductCarouselsLoad();
  }

  private getInitialHeroLcpVisibility(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }
    return typeof matchMedia !== 'undefined' && matchMedia('(min-width: 769px)').matches;
  }

  private setupHeroLcpImageVisibility(): void {
    if (!isPlatformBrowser(this.platformId) || typeof matchMedia === 'undefined') {
      return;
    }
    const mq = matchMedia('(min-width: 769px)');
    const apply = (): void => {
      this.showHeroLcpImage.set(mq.matches);
      this.cdr.markForCheck();
    };
    apply();
    mq.addEventListener('change', apply);
    this.heroPhotoMediaCleanup = (): void => mq.removeEventListener('change', apply);
  }

  /** Carruseles bajo demanda: libera el hilo principal tras el hero (mejor INP / contención con LCP). */
  private scheduleProductCarouselsLoad(): void {
    const run = (): void => this.loadProductCarousels();
    if (!isPlatformBrowser(this.platformId)) {
      run();
      return;
    }
    const w = window as Window & { requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number };
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(() => run(), { timeout: 2500 });
    } else {
      setTimeout(run, 150);
    }
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
        '.animate-on-scroll, .services-section, .faq-section, .search-results-container'
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
    const searchTerm = (document.querySelector('.modern-search-input') as HTMLInputElement)?.value ?? '';
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
    this.heroPhotoMediaCleanup?.();
    this.heroPhotoMediaCleanup = null;

    this.destroy$.next();
    this.destroy$.complete();

    for (const k of Object.keys(this.homeProductLoadMoreDebounce)) {
      const t = this.homeProductLoadMoreDebounce[k as ProductCarouselKey];
      if (t) {
        clearTimeout(t);
      }
    }
    this.homeProductLoadMoreDebounce = {};

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

  private loadProductCarousels(): void {
    this.productCarousels.forEach(section => this.loadCarouselPage(section, 1));
  }

  loadMoreCarousel(section: ProductCarouselSection): void {
    const key = section.key;
    const nextPage = section.page() + 1;
    if (section.loading() || section.loadingMore() || nextPage > section.totalPages()) {
      return;
    }
    // Si ya hay una petición pendiente para este carrusel, no dispares otra
    if (this.carouselPendingLoad[key]) {
      return;
    }
    this.carouselPendingLoad[key] = true;
    this.loadCarouselPage(section, nextPage, () => {
      this.carouselPendingLoad[key] = false;
    });
  }

  getCarouselTrackId(section: ProductCarouselSection): string {
    return `home-product-carousel-${section.key}`;
  }

  private getHomeProductSwiper(section: ProductCarouselSection): HomeProductSwiperLite | null {
    const el = document.getElementById(this.getCarouselTrackId(section)) as
      | (HTMLElement & { swiper?: HomeProductSwiperLite })
      | null;
    return el?.swiper ?? null;
  }

  private extractHomeProductSwiper(ev: Event): HomeProductSwiperLite | null {
    const detail = (ev as CustomEvent).detail;
    const fromDetail = Array.isArray(detail) ? detail[0] : detail;
    if (fromDetail && typeof fromDetail === 'object') {
      return fromDetail as HomeProductSwiperLite;
    }
    return (ev.target as HTMLElement & { swiper?: HomeProductSwiperLite })?.swiper ?? null;
  }

  onHomeProductSwiperSync(section: ProductCarouselSection, ev: Event): void {
    const swiper = this.extractHomeProductSwiper(ev);
    if (swiper) {
      this.syncHomeProductCarouselEdges(section, swiper);
      this.cdr.markForCheck();
    }
  }

  onHomeProductSwiperSlideChange(section: ProductCarouselSection, ev: Event): void {
    const swiper = this.extractHomeProductSwiper(ev);
    if (!swiper) {
      return;
    }
    // No cargar aquí: `slideChange` se dispara muchas veces al arrastrar y tras `update()`.
    // La carga incremental va por `reachEnd` + debounce (`onHomeProductSwiperReachEnd`).
    this.syncHomeProductCarouselEdges(section, swiper);
    this.cdr.markForCheck();
  }

  /** Un solo disparo “suave” al llegar al final (ratón / touch). */
  onHomeProductSwiperReachEnd(section: ProductCarouselSection): void {
    const key = section.key;
    const prev = this.homeProductLoadMoreDebounce[key];
    if (prev) {
      clearTimeout(prev);
    }
    this.homeProductLoadMoreDebounce[key] = setTimeout(() => {
      this.homeProductLoadMoreDebounce[key] = undefined;
      this.tryLoadMoreProductCarouselPage(section);
    }, 320);
  }

  /** Condiciones estrictas + cooldown para no encadenar páginas solas. */
  private tryLoadMoreProductCarouselPage(section: ProductCarouselSection): void {
    const key = section.key;
    if (Date.now() < (this.homeProductEndCooldownUntil[key] ?? 0)) {
      return;
    }
    if (section.loading() || section.loadingMore() || this.carouselPendingLoad[key]) {
      return;
    }
    const sw = this.getHomeProductSwiper(section);
    if (!sw?.isEnd) {
      return;
    }
    if (!this.hasMoreCarouselItems(section)) {
      return;
    }
    this.loadMoreCarousel(section);
  }

  private syncHomeProductCarouselEdges(section: ProductCarouselSection, swiper: HomeProductSwiperLite): void {
    const edge = this.homeProductCarouselEdge[section.key];
    if (!edge) {
      return;
    }
    edge.atStart.set(!!swiper.isBeginning);
    const noMorePages = !this.hasMoreCarouselItems(section);
    edge.atEnd.set(!!swiper.isEnd && noMorePages);
  }

  slideHomeProductCarousel(section: ProductCarouselSection, direction: 'previous' | 'next'): void {
    const swiper = this.getHomeProductSwiper(section);
    if (!swiper) {
      return;
    }
    if (direction === 'next' && swiper.isEnd && this.hasMoreCarouselItems(section)) {
      this.loadMoreCarousel(section);
      setTimeout(() => {
        const sw = this.getHomeProductSwiper(section);
        sw?.update?.();
        if (sw) {
          this.syncHomeProductCarouselEdges(section, sw);
          if (!sw.isEnd) {
            sw.slideNext?.(300);
          }
          this.syncHomeProductCarouselEdges(section, sw);
        }
        this.cdr.markForCheck();
      }, 450);
      return;
    }
    if (direction === 'next') {
      swiper.slideNext?.();
    } else {
      swiper.slidePrev?.();
    }
    requestAnimationFrame(() => {
      const sw = this.getHomeProductSwiper(section);
      if (sw) {
        this.syncHomeProductCarouselEdges(section, sw);
      }
      this.cdr.markForCheck();
    });
  }

  private refreshHomeProductSwiper(section: ProductCarouselSection): void {
    setTimeout(() => {
      const sw = this.getHomeProductSwiper(section);
      sw?.update?.();
      if (sw) {
        this.syncHomeProductCarouselEdges(section, sw);
      }
      this.cdr.markForCheck();
    }, 0);
  }

  hasMoreCarouselItems(section: ProductCarouselSection): boolean {
    return section.page() < section.totalPages();
  }

  retryCarousel(section: ProductCarouselSection): void {
    this.loadCarouselPage(section, Math.max(section.page() || 1, 1));
  }

  /** Permite callback opcional al terminar la carga (para liberar el lock de scroll) */
  private loadCarouselPage(section: ProductCarouselSection, page: number, done?: () => void): void {
    const firstPage = page === 1;
    section.error.set(false);
    firstPage ? section.loading.set(true) : section.loadingMore.set(true);

    section.fetch(page, this.carouselPageSize)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          section.error.set(true);
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response) {
          const incomingItems = this.toCarouselDocuments(response.data ?? [], section.free);
          section.items.set(firstPage ? incomingItems : this.mergeCarouselDocuments(section.items(), incomingItems));
          section.page.set(response.pagination?.paginaActual ?? page);
          section.totalPages.set(Math.max(response.pagination?.cantidadDePaginas ?? 1, 1));
          section.totalItems.set(response.pagination?.cantidadDeDocumentos ?? section.items().length);
          if (!firstPage) {
            this.homeProductEndCooldownUntil[section.key] = Date.now() + 520;
          }
        }

        section.loaded.set(true);
        section.loading.set(false);
        section.loadingMore.set(false);
        if (done) done();
        this.cdr.markForCheck();
        this.refreshHomeProductSwiper(section);
      });
  }

  private mergeCarouselDocuments(currentItems: Document[], incomingItems: Document[]): Document[] {
    const seenIds = new Set(currentItems.map(item => item.id));
    return [...currentItems, ...incomingItems.filter(item => !seenIds.has(item.id))];
  }

  private toCarouselDocuments(docs: Document[], free = false): Document[] {
    return (docs || []).map((documentItem): Document => ({
      ...documentItem,
      imagenUrlPublic: documentItem.imagenUrlPublic || documentItem.imagenUrl_private || '/assets/images/default-product.jpg',
      documentoLibre: free || documentItem.documentoLibre === true || documentItem.price === 0,
    }));
  }

  private normalizeString(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  isFontAwesome(icon: string): boolean {
    return icon === 'brain';
  }

  onShowcaseCardClick(cardId: string): void {
    console.log('[Home] Showcase card clicked:', cardId);
    // Navegar según el card seleccionado
    const routes: Record<string, string> = {
      'featured': '/site/ia-planificaciones',
      'side1': '/site/categorias/KITS',
      'side2': '/site/comunidad',
    };
    const route = routes[cardId];
    if (route) {
      this.router.navigate([route]);
    }
  }
}
