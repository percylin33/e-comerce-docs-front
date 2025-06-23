import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Membresia, MembresiaData } from '../../@core/interfaces/membresia';
import { Subscription } from 'rxjs';
import { CartItem } from '../../@core/interfaces/cartItem';
import { CartService } from '../../@core/backend/services/cart.service';
import { NbToastrService } from '@nebular/theme';


interface Membership {
  nombre: string;
  descripcion: string;
  ahora: string;
  beneficios: string[];
  descuento: string;
}

@Component({
  selector: 'ngx-membresia-detail',
  templateUrl: './membresia-detail.component.html',
  styleUrls: ['./membresia-detail.component.scss']
})
export class MembresiaDetailComponent implements OnInit {
  id!: string;
  membresia: Membresia;
  selectedMembership!: Membership;
  selectedMateria: any = null;
  counter: number = 0;
  total: number = 0;
  installments = { cuotas: 1, montoPorCuota: 0 };
  selectedCuota: number | null = null; // Por defecto, una sola cuota
  remainingCuotas: number = 0; // Cuotas restantes
  showInstallments: boolean = false;
  totalCuotas: number = 0;
  validationMessage: string | null = null;
  isValid: boolean = true;
  private routeSub: Subscription;

  constructor(
    private route: ActivatedRoute,
    private toastrService: NbToastrService,
    private membresiaService: MembresiaData,
    private router: Router,
    private cartService: CartService,
  ) { }

  ngOnInit(): void {
    this.route.snapshot.paramMap.get('id');

    // Usa el ID para obtener la membresía correspondiente
    // if (id !== null) {
    //   const index = parseInt(id, 10); // Convierte el parámetro a número
    //   //this.membresia = this.membresias[index]; // Obtiene la membresía correspondiente del array
    //   const mem = this.loadMembresia(index);
    //   console.log('membresia', mem);
      
    // }

    this.routeSub = this.route.paramMap.subscribe(params => {
      this.id = params.get('id');
      this.loadMembresia(Number(this.id )+ 1); // Llama a una función para cargar el documento
    });
    
      
      
   

  }


  loadMembresia(id: number): void {
    if (id) {
      // Llamar al servicio para obtener el documento por ID
      this.membresiaService.getMembresiaById(id).subscribe((response) => {
        
        this.membresia = response.data;

        if (this.membresia.nombre === 'Membresía Mensual Inicial') {
          this.membresia.materias[0].opciones[3].exclusivo = true;
        }
        console.log('Documento obtenido:', this.membresia);
        
      }, (error) => {
        console.error('Error al obtener el documento:', error);
      });
    } else {
      console.error('No se proporcionó un ID de documento válido');
    }
  }

  calculateTotal(): void {
    this.total = 0;
    if (!this.membresia) {

      return;
    }

    if (this.membresia.materias.length > 1) {
      console.log('Hay materias 111111111111111.  ' + this.membresia.materias.length);

      this.membresia.materias.forEach((materia: any) => {
        const selectedCount = materia.opciones.filter((opcion: any) => opcion.seleccionada).length;



        if (['Comunicación', 'Matemática', 'Ciencia y Tecnología', 'Ciencias Sociales'].includes(materia.nombre)) {



          switch (selectedCount) {
            case 1: materia.total = materia.opciones[selectedCount - 1].ahora; break;
            case 2: materia.total = materia.opciones[selectedCount - 1].ahora; break;
            case 3: materia.total = materia.opciones[selectedCount - 1].ahora; break;
            case 4: materia.total = materia.opciones[selectedCount - 1].ahora; break;
            case 5: materia.total = materia.opciones[selectedCount - 1].ahora; break;
            default: materia.total = 0;
          }
        } else if (['DPCC', 'Arte'].includes(materia.nombre)) {
          switch (selectedCount) {
            case 1: materia.total = materia.opciones[selectedCount - 1].ahora; break;
            case 2: materia.total = materia.opciones[selectedCount - 1].ahora; break;
            case 3: materia.total = materia.opciones[selectedCount - 1].ahora; break;
            case 4: materia.total = materia.opciones[selectedCount - 1].ahora; break;
            case 5: materia.total = materia.opciones[selectedCount - 1].ahora; break;
            default: materia.total = 0;
          }
        } else {
          switch (selectedCount) {
            case 1: materia.total = materia.opciones[selectedCount - 1].ahora; break;
            case 2: materia.total = materia.opciones[selectedCount - 1].ahora; break;
            case 3: materia.total = materia.opciones[selectedCount - 1].ahora; break;
            default: materia.total = 0;
          }
        }
      });

      // Calcula el total general sumando los totales de las materias
      this.total = this.membresia.materias.reduce((acc: number, materia: any) => acc + (materia.total || 0), 0);
    } else if (this.membresia.materias.length === 1) {

      this.membresia.materias.forEach((materia: any) => {
        // Filtrar las opciones seleccionadas y sumar sus valores
        materia.total = materia.opciones
          .filter((opcion: any) => opcion.seleccionada)
          .reduce((acc: number, opcion: any) => acc + opcion.ahora, 0);
      });

      // Sumar los totales de todas las materias para obtener el total general
      this.total = this.membresia.materias.reduce((acc: number, materia: any) => acc + (materia.total || 0), 0);

    } else {
      this.total = 0;
    }

    if (this.membresia.nombre === 'Membresía Anual Secundaria') {
      this.installments = this.calculateInstallments(this.total);

      if (this.selectedCuota && this.selectedCuota > this.installments.cuotas) {
      this.selectedCuota = null;
      console.log('La cuota seleccionada ya no es válida. Restableciendo selección.');
      }
    }
  }

  toggleOpcion(opcion: any) {
    if (opcion.exclusivo) {
      if (opcion.seleccionada) {
        // Si la opción exclusiva ya está seleccionada, deselecciónala
        opcion.seleccionada = false;
      } else {
        // Si no está seleccionada, deselecciona todas las opciones y selecciona esta
        this.deselectAllOptions();
        opcion.seleccionada = true;
      }
    } else {
      // Si no es exclusiva, deselecciona la opción exclusiva si está seleccionada
      const unidocente = this.membresia.materias[0].opciones.find(o => o.exclusivo);
      if (unidocente) unidocente.seleccionada = false;
  
      // Alterna la selección de la opción
      opcion.seleccionada = !opcion.seleccionada;
    }
  
    // Recalcula el total después de cualquier cambio
    this.calculateTotal();
  }

  private deselectAllOptions(): void {
    this.membresia.materias[0].opciones.forEach(o => (o.seleccionada = false));
  }

  isOptionDisabled(opcion: any): boolean {
    const unidocenteSeleccionada = this.membresia.materias[0].opciones.find(o => o.exclusivo && o.seleccionada);
    return !!unidocenteSeleccionada && !opcion.exclusivo;
  }

  getMembresiaById(id: string): any {
    // Implementa la lógica para obtener la membresía por ID
    // Por ejemplo, podrías usar un servicio o un array local

  }

  toggleMateria(materia: any): void {
    materia.expandido = !materia.expandido; // Alterna el estado "expandido" de la materia
  }


  getTotalPorMateria(materia: any): number {
    const total = materia.total || 0;
    return total;
  }

  getTotalAntesPorMateria(materia: any): number {
    if (!materia || !materia.opciones) {
      return 0; // Si no hay materia o no tiene opciones, el total es 0
    }

    const selectedCount = materia.opciones.filter((opcion: any) => opcion.seleccionada).length;

    if (['Comunicación', 'Matemática', 'Ciencia y Tecnología', 'Ciencias Sociales'].includes(materia.nombre)) {
      // Precios "antes" para Comunicación, Matemática, Ciencia y Tecnología, Ciencias Sociales
      switch (selectedCount) {
        case 1:
          return 35;
        case 2:
          return 60;
        case 3:
          return 80;
        case 4:
          return 100;
        case 5:
          return 120;
        default:
          return 0;
      }
    } else if (['DPCC', 'Arte'].includes(materia.nombre)) {
      // Precios "antes" para DPCC y Arte
      switch (selectedCount) {
        case 1:
          return 35;
        case 2:
          return 50;
        case 3:
          return 70;
        case 4:
          return 80;
        case 5:
          return 90;
        default:
          return 0;
      }
    } else {
      // Precios "antes" para los restantes
      switch (selectedCount) {
        case 1:
          return 30;
        case 2:
          return 50;
        case 3:
          return 70;
        default:
          return 0;
      }
    }
  }

  openModal(materia: any): void {
    if (!materia) {
      console.error('No se pudo abrir el modal: el objeto es inválido.');
      return;
    }
  
    console.log('Abriendo modal para la materia:', materia);

    const muestraArray = materia.muestraJson ? JSON.parse(materia.muestraJson) : materia.muestra;
  
    // Asigna los datos de la materia seleccionada al modal
    this.selectedMateria = {
      nombre: materia.nombre,
      descripcion: materia.descripcion || this.membresia.descripcion, // Usa la descripción de la membresía si no hay descripción en la materia
      beneficios: materia.beneficios || [],
      muestra: muestraArray || [],
      afiche: materia.afiche || null,
    };
  }

  closeModal(): void {
    this.selectedMateria = null;
  }

  calculateInstallments(total: number): { cuotas: number, montoPorCuota: number } {
    let cuotas = 1; // Por defecto, una sola cuota
    let montoPorCuota = total;

    if (total > 600) {
      cuotas = 4;
    } else if (total > 400) {
      cuotas = 3;
    } else if (total > 179) {
      cuotas = 2;
    }

    montoPorCuota = total / cuotas;
    console.log('Cuota cuotas:', cuotas);
    
    
    console.log('Cuota remainingCuotas 2:', this.remainingCuotas);
    // Actualiza las cuotas restantes
    //this.remainingCuotas = cuotas - 1;
    console.log('Cuota remainingCuotas 1:', this.remainingCuotas);
    return { cuotas, montoPorCuota };
  }

  // selectCuota(cuota: number | null): void {
  //   if (this.total === 0) {
  //     console.warn('No se puede seleccionar cuotas con un total de 0.');
  //     return;
  //   }

  //   if (cuota === null) {
  //     // Si no se selecciona ninguna cuota, restablece el total completo
  //     this.selectedCuota = null;
  //     this.remainingCuotas = 0;
  //     this.total = this.installments.montoPorCuota * this.installments.cuotas; // Total completo
  //   } else {
  //     // Si se selecciona una cuota, calcula el monto y las cuotas restantes
  //     this.selectedCuota = cuota;
  //     const montoPorCuota = this.installments.montoPorCuota;
  //     this.total = montoPorCuota * cuota; // Actualiza el total según la cuota seleccionada
  //     this.remainingCuotas = this.installments.cuotas - cuota; // Calcula las cuotas restantes
  //   }
  //   console.log('Cuota remainingCuotas:', this.remainingCuotas);

  // }

  selectCuota(cuota: number): void {
    this.selectedCuota = cuota;
    this.installments.montoPorCuota = this.total / cuota; // Calcula el monto por cuota
    this.isValid = true; // El estado es válido porque se seleccionó una cuota
    this.validationMessage = null; // Limpia el mensaje de advertencia
    console.log('Cuota selectedCuota:', this.selectedCuota);
    console.log('Cuota installments.montoPorCuota:', this.installments.montoPorCuota);
    
    this.totalCuotas = this.total / cuota // Actualiza el total según la cuota seleccionada
  }

  toggleInstallments(): void {
    this.showInstallments = !this.showInstallments;
    
  if (!this.showInstallments) {
    // Restablece los valores si se cancela el fraccionamiento
    this.selectedCuota = null; // Elimina la cuota seleccionada
    this.installments = { cuotas: 1, montoPorCuota: this.total }; // Restablece el fraccionamiento a un único pago
    this.isValid = true; // El estado es válido porque no hay fraccionamiento
    this.validationMessage = null; // Limpia el mensaje de advertencia
    console.log('Fraccionamiento cancelado. Total restablecido:', this.total);
    console.log('Fraccionamiento cancelado. Cuotas restablecidas:', this.installments);
    
  } else {
    // Recalcula las cuotas disponibles al activar el fraccionamiento
    this.installments = this.calculateInstallments(this.total);
    console.log('Fraccionamiento activado. Cuotas recalculadas:', this.installments);
    console.log(this.selectedCuota);
    
  }
  }

  getPaymentSchedule(): { monto: number; fecha: string }[] {
    if (!this.selectedCuota || this.total === 0) {
      return [];
    }

    const schedule = [];
    const cuotaMonto = this.total / this.selectedCuota; // Divide el total entre las cuotas seleccionadas
    const today = new Date();

    for (let i = 0; i < this.selectedCuota; i++) {
      const paymentDate = new Date(today);
      paymentDate.setMonth(today.getMonth() + i); // Incrementa el mes para cada cuota

      schedule.push({
        monto: cuotaMonto,
        fecha: paymentDate.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' }),
      });
    }

    return schedule;
  }

  goToCheckout(): void {
    // Clear the cart before adding the subscription
    this.cartService.clearCart();

    const subscriptionItem: CartItem = {
      id: Number(this.id )+ 1, // Genera un ID único basado en el nombre de la membresía
      title: this.membresia.nombre, // Título de la suscripción
      description: this.membresia.descripcion, // Descripción de la suscripción
      price: this.installments.cuotas > 1 ? this.total/this.selectedCuota : this.total, // Precio total calculado de la suscripción
      imagenUrlPublic: this.membresia.materias[0]?.afiche || '', // Usa la imagen del afiche de la primera materia (si existe)
      isSubscription: true, // Indica que es una suscripción
      totalCuotas: this.selectedCuota || 1, // Número total de cuotas seleccionadas
      montoPorCuota: this.installments.montoPorCuota || this.total, // Monto por cada cuota
      montoTotal: this.total, // Monto total de la suscripción
      materiasSeleccionadas: this.membresia.materias
        .filter(materia => materia.opciones.some(opcion => opcion.seleccionada)) // Filtra materias con opciones seleccionadas
        .map(materia => ({
          id: materia.id,
          nombre: materia.nombre,
          opcionesSeleccionadas: materia.opciones.filter(opcion => opcion.seleccionada) // Filtra opciones seleccionadas
        }))
    };

    const added = this.cartService.addToCart(subscriptionItem);
    if (added) {
      this.toastrService.success('Suscripción añadida al carrito', 'Éxito');
      this.router.navigate(['/site/checkout']); // Redirige al checkout
    } else {
      this.toastrService.warning('La suscripción ya está en el carrito', 'Información');
    }
  }


  validateAndProceed(): void {
   if (this.total === 0) {
    this.validationMessage = 'Por favor, selecciona al menos una opción para continuar.';
     this.isValid = false;
    return;
  }

  if (this.showInstallments && this.selectedCuota === null) {
    this.validationMessage = 'Por favor, selecciona una opción de fraccionamiento o cancelalo para continuar.';
     this.isValid = false;
    return;
  }

  // Si todas las validaciones pasan, limpia el mensaje y procede con el pago
  this.validationMessage = null;
  this.isValid = true;
  this.goToCheckout();
}

}
