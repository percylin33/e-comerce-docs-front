import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'ngx-purchase-confirmation',
  templateUrl: './purchase-confirmation.component.html',
  styleUrls: ['./purchase-confirmation.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class PurchaseConfirmationComponent implements OnInit {
  
  // Estados de la compra
  isSuccess: boolean = false;
  isError: boolean = false;
  isSubscription: boolean = false;
  
  // Datos de la transacción
  transactionType: string = '';
  errorMessage: string = '';
  userEmail: string = '';
  userName: string = '';
  
  // Estados para el modal de imagen expandida
  isImageModalOpen: boolean = false;
  expandedImageSrc: string = '';
  expandedImageAlt: string = '';
  
  // Pasos del proceso para suscripciones
  subscriptionSteps = [
  {
    icon: 'log-in-outline',
    title: 'Iniciar sesión',
    description: 'Accede con tus credenciales para entrar al sistema.',
    completed: true,
    image: 'assets/images/caso-0.webp'
  },
  {
    icon: 'person-circle-outline',
    title: 'Mi cuenta',
    description: 'Dirígete a tu perfil o área personal.',
    completed: false,
    image: 'assets/images/paso-1.webp'
  },
  {
    icon: 'folder-open-outline',
    title: 'Suscripciones',
    description: 'En esta sección verás todas tus suscripciones activas.',
    completed: false,
    image: 'assets/images/paso-2.webp'
  },
  {
    icon: 'book-open-outline',
    title: 'Selecciona materia',
    description: 'Elige la materia que compraste para ver sus recursos.',
    completed: false,
    image: 'assets/images/paso-3.webp'
  },
  {
    icon: 'download-outline',
    title: 'Descarga documento',
    description: 'Descarga el material de la materia seleccionada.',
    completed: false,
    image: 'assets/images/paso-4.webp'
  }
];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastrService: NbToastrService
  ) {}

  ngOnInit(): void {
    // Obtener parámetros de la URL
    this.route.queryParams.subscribe(params => {
      this.isSuccess = params['success'] === 'true';
      this.isError = params['error'] === 'true';
      this.isSubscription = params['isSubscription'] === 'true';
      this.transactionType = params['transactionType'] || '';
      this.errorMessage = params['errorMessage'] || '';
      this.userEmail = params['email'] || '';
      this.userName = params['name'] || '';
      
      // Si no hay parámetros válidos, redirigir al home
      if (!this.isSuccess && !this.isError) {
        this.router.navigate(['/site/home']);
      }
    });
  }

  // Navegar al home
  goToHome(): void {
    this.router.navigate(['/site/home']);
  }

  // Navegar al área de usuario
  goToAccount(): void {
    this.router.navigate(['/cuenta-usuario']);
  }

  // Navegar al carrito para intentar de nuevo
  goToCart(): void {
    this.router.navigate(['/site/cart']);
  }

  // Contactar soporte
  contactSupport(): void {
    // Redirigir a la página de contacto o abrir email
    this.router.navigate(['/site/contact']);
  }

  // Reintentrar compra
  retryPurchase(): void {
    this.router.navigate(['/site/cart']);
  }

  // Expandir imagen en modal
  expandImage(imageSrc: string, imageAlt: string): void {
    this.expandedImageSrc = imageSrc;
    this.expandedImageAlt = imageAlt;
    this.isImageModalOpen = true;
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  }

  // Cerrar modal de imagen
  closeImageModal(): void {
    this.isImageModalOpen = false;
    this.expandedImageSrc = '';
    this.expandedImageAlt = '';
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
  }

  // Cerrar modal al hacer clic en el overlay
  closeModalOnOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeImageModal();
    }
  }
}