import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Membresia, MembresiaData } from '../../@core/interfaces/membresia';
import { Subscription } from 'rxjs';
import { CartItem } from '../../@core/interfaces/cartItem';
import { CartService } from '../../@core/backend/services/cart.service';
import { NbToastrService } from '@nebular/theme';
import { MatDialog } from '@angular/material/dialog';
import { AuthModalComponent } from '../../shared/component/auth-modal/auth-modal.component';
import { SharedService } from '../../@auth/components/shared.service';
import { ResellerAlertModalComponent } from '../../shared/component/reseller-alert-modal/reseller-alert-modal.component';
import { NotificationService } from '../../@core/utils/notification.service';
import { UnitScheduleService } from '../../@core/backend/services/unit-schedule.service';
import { UnitSchedule } from '../../@core/interfaces/unit-schedule';


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
export class MembresiaDetailComponent implements OnInit, OnDestroy {
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
  isAuthenticated: boolean = false;
  isValidatingReseller: boolean = false;
  titles: string[] = [];

  // Campos para la selección de unidad/proyecto
  availableUnits: UnitSchedule[] = [];
  allUnits: UnitSchedule[] = []; // Todas las unidades (incluyendo pasadas)
  selectedUnitId: number | null = null;
  selectedUnit: UnitSchedule | null = null; // Cache de la unidad seleccionada
  loadingUnits: boolean = false;
  showAllUnits: boolean = false; // Controla si se muestran todas las unidades o solo la actual
  hasOlderUnits: boolean = false; // Indica si hay unidades pasadas disponibles

  // Soporte para Unidades Históricas
  tipoVisualizacion: 'vigente' | 'historico' = 'vigente'; // Tipo de compra
  descuentoHistorico: number = 0; // Porcentaje de descuento para compras históricas
  descuentoHistoricoAplicado: number = 0; // Monto del descuento aplicado
  totalSinDescuentoHistorico: number = 0; // Total antes del descuento histórico
  isEspecialMembresia: boolean = false; // Flag para membresías especiales

  // Agrupación por años para vista histórica
  availableYears: number[] = []; // Años disponibles con unidades históricas
  selectedYear: number | null = null; // Año seleccionado para filtrar
  unidadesPorAnio: Map<number, UnitSchedule[]> = new Map(); // Mapa de unidades agrupadas por año

  // Variables cacheadas para evitar recálculos en el template
  isAnualMembresia: boolean = false;
  isPrimariaMembresia: boolean = false;
  hasSelectedItemsCache: boolean = false;

  membershipAvailable: boolean = false; // Control de disponibilidad de membresías
  private routeSub: Subscription;
  private authSub: Subscription;

  // Referencias para event listeners
  private storageHandler: (event: StorageEvent) => void;
  private focusHandler: () => void;

  // Cache para optimizar renderizado
  cuotasArray: number[] = [];
  paymentSchedule: { monto: number; fecha: string }[] = [];
  montoPorCuotaCache: { [key: number]: number } = {};

  constructor(
    private route: ActivatedRoute,
    private toastrService: NbToastrService,
    private membresiaService: MembresiaData,
    private router: Router,
    private cartService: CartService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private sharedService: SharedService,
    private unitScheduleService: UnitScheduleService
  ) { }

  ngOnInit(): void {
    this.route.snapshot.paramMap.get('id');

    // Leer parámetros de query para tipo de compra (vigente vs histórico)
    this.route.queryParams.subscribe(params => {
      this.tipoVisualizacion = params['tipo'] || 'vigente';
      // 🔒 SEGURIDAD: El descuento NO viene de la URL (evita manipulación)
      // Se obtiene del backend desde SubscriptionType.descuentoUnidadesPasadas

      
    });

    // Verificar estado de autenticación
    this.checkAuthState();

    // Suscribirse al estado de autenticación del SharedService
    this.authSub = this.sharedService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });

    // Crear referencias para los event listeners
    this.storageHandler = this.onStorageChange.bind(this);
    this.focusHandler = this.onWindowFocus.bind(this);

    // Escuchar cambios en el localStorage para detectar login/logout
    window.addEventListener('storage', this.storageHandler);

    // Escuchar cambios de enfoque en la ventana
    window.addEventListener('focus', this.focusHandler);

    this.routeSub = this.route.paramMap.subscribe(params => {
      this.id = params.get('id');
      this.loadMembresia(Number(this.id)); // Usa el ID real en lugar del índice + 1
    });

    this.membresiaService.getTitleById(Number(this.id)).subscribe({
      next: (response) => {
        if (response.result) {
          this.titles = response.data; // Asigna el nombre de la membresía
        }
      },
      error: (error) => {
      }
    });
  }

  private onStorageChange(event: StorageEvent): void {
    if (event.key === 'currentUser') {
      this.checkAuthState();

      // Forzar detección de cambios si es necesario
      if (this.isAuthenticated && event.newValue) {
        // El usuario se acaba de loguear
      }
    }
  }

  private onWindowFocus(): void {
    // Verificar el estado de autenticación cuando la ventana recibe el enfoque
    this.checkAuthState();
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    // CORREGIDO: Usar la misma referencia de función
    if (this.storageHandler) {
      window.removeEventListener('storage', this.storageHandler);
    }
    if (this.focusHandler) {
      window.removeEventListener('focus', this.focusHandler);
    }
  }

  private checkAuthState(): void {
    const currentUser = localStorage.getItem('currentUser');
    const wasAuthenticated = this.isAuthenticated;
    this.isAuthenticated = !!currentUser;

    // Sincronizar con el SharedService si hay discrepancia
    if (this.isAuthenticated !== wasAuthenticated) {
      this.sharedService.setAuthenticated(this.isAuthenticated);

      if (currentUser) {
        try {
          const user = JSON.parse(currentUser);
          this.sharedService.setUser(user);
        } catch (error) {
        }
      }
    }

    // Log para debug
    if (wasAuthenticated !== this.isAuthenticated) {
    }
  }

  // Método para forzar la verificación del estado de autenticación
  public forceCheckAuthState(): void {
    this.checkAuthState();
  }


  loadMembresia(id: number): void {
    if (id) {
      // Llamar al servicio para obtener el documento por ID
      this.membresiaService.getMembresiaById(id).subscribe((response) => {

        this.membresia = response.data;

        // 🔒 SEGURIDAD: Obtener descuento histórico del backend (no de URL)
        this.descuentoHistorico = this.membresia.descuentoUnidadesPasadas || 0;
        

        // Cachear valores que se usan frecuentemente en el template
        const nombreLower = this.membresia.nombre?.toLowerCase() || '';
        this.isAnualMembresia = nombreLower.includes('anual');
        this.isPrimariaMembresia = nombreLower.includes('primaria');
        this.isEspecialMembresia = nombreLower.includes('especial');

        if (this.membresia.nombre === 'Membresía Mensual Inicial') {
          this.membresia.materias[0].opciones[3].exclusivo = true;
        }

        // Cargar las unidades disponibles para esta suscripción
        this.loadAvailableUnits(id);

      }, (error) => {
      });
    } else {
    }
  }

  /**
   * Carga las unidades/proyectos disponibles para el tipo de suscripción
   */
  loadAvailableUnits(subscriptionTypeId: number): void {
    this.loadingUnits = true;
    // No especificamos año para obtener todas las unidades disponibles

    this.unitScheduleService.getBySubscriptionType(subscriptionTypeId).subscribe({
      next: (units) => {
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalizar a inicio del día

        // Filtrar solo unidades que ya están disponibles (fecha de inicio <= hoy)
        const availableUnits = units.filter(unit => {
          const fechaInicio = new Date(unit.fechaInicio);
          fechaInicio.setHours(0, 0, 0, 0);
          return fechaInicio <= today;
        });

        // Ordenar unidades por fecha de inicio (más antigua primero)
        const sortedUnits = availableUnits.sort((a, b) => {
          const dateA = new Date(a.fechaInicio).getTime();
          const dateB = new Date(b.fechaInicio).getTime();
          return dateA - dateB;
        });

        // Para inicial, agrupar unidades con el mismo unidadNumero
        let processedUnits: UnitSchedule[];
        if (this.membresia?.nombre?.toLowerCase().includes('inicial')) {
          // Agrupar por unidadNumero
          const groupedMap = new Map<number, UnitSchedule[]>();
          sortedUnits.forEach(unit => {
            if (!groupedMap.has(unit.unidadNumero)) {
              groupedMap.set(unit.unidadNumero, []);
            }
            groupedMap.get(unit.unidadNumero).push(unit);
          });

          // Crear unidades representativas (tomar la primera de cada grupo)
          processedUnits = Array.from(groupedMap.values()).map(group => {
            const representative = { ...group[0] };
            if (group.length > 1) {
              representative.titulo = group.map(u => u.titulo).join(' + ');
            }
            (representative as any).groupedUnits = group;
            return representative;
          });
        } else {
          processedUnits = sortedUnits;
        }

        // Guardar todas las unidades procesadas
        this.allUnits = processedUnits;
        

        // Encontrar la unidad actual (fecha actual dentro del rango)
        const currentUnit = processedUnits.find(unit => {
          const fechaInicio = new Date(unit.fechaInicio);
          const fechaFin = new Date(unit.fechaFin);
          fechaInicio.setHours(0, 0, 0, 0);
          fechaFin.setHours(23, 59, 59, 999);
          return today >= fechaInicio && today <= fechaFin;
        });

        // Verificar si es membresía anual (debe mostrar todas las unidades siempre)
        const isAnual = this.membresia?.nombre?.toLowerCase().includes('anual');
        const isEspecial = this.isEspecialMembresia;

        // NUEVA LÓGICA: Filtrar según tipo de visualización
        if (this.tipoVisualizacion === 'historico') {
          // MODO HISTÓRICO: Mostrar solo unidades pasadas (fechaFin < hoy)
          
          const unidadesPasadas = processedUnits.filter(unit => {
            const fechaFin = new Date(unit.fechaFin);
            fechaFin.setHours(23, 59, 59, 999);
            return fechaFin < today; // Solo unidades ya finalizadas
          });

          // Agrupar unidades pasadas por año
          this.unidadesPorAnio.clear();
          unidadesPasadas.forEach(unit => {
            if (!this.unidadesPorAnio.has(unit.anio)) {
              this.unidadesPorAnio.set(unit.anio, []);
            }
            this.unidadesPorAnio.get(unit.anio)!.push(unit);
          });

          // Ordenar años de más reciente a más antiguo
          this.availableYears = Array.from(this.unidadesPorAnio.keys()).sort((a, b) => b - a);

          // NO seleccionar año ni unidad automáticamente - esperar a que el usuario lo haga
          this.selectedYear = null;
          this.availableUnits = [];
          this.selectedUnitId = null;
          this.selectedUnit = null;

          this.showAllUnits = true; // Siempre mostrar todas las del año seleccionado
          this.hasOlderUnits = false; // No mostrar botón de expandir
        } else if (isAnual) {
          // Para membresías ANUALES: mostrar TODAS las unidades disponibles
          this.availableUnits = processedUnits;
          this.showAllUnits = true;
          this.hasOlderUnits = false; // No mostrar botón de expandir/colapsar

          // Seleccionar la unidad actual si existe, sino la primera
          if (currentUnit) {
            this.updateSelectedUnit(currentUnit.id, currentUnit);
          } else if (processedUnits.length > 0) {
            this.updateSelectedUnit(processedUnits[0].id, processedUnits[0]);
          }
        } else if (isEspecial) {
          // Para membresías ESPECIALES: mostrar SOLO la unidad vigente, sin lista
          if (currentUnit) {
            this.availableUnits = [currentUnit];
            this.updateSelectedUnit(currentUnit.id, currentUnit);
            this.showAllUnits = false; // No mostrar lista de unidades
            this.hasOlderUnits = false; // No mostrar botón de expandir
          } else {
            // Si no hay unidad vigente, mostrar la más reciente
            if (processedUnits.length > 0) {
              const lastUnit = processedUnits[processedUnits.length - 1];
              this.availableUnits = [lastUnit];
              this.updateSelectedUnit(lastUnit.id, lastUnit);
              this.showAllUnits = false;
              this.hasOlderUnits = false;
            } else {
              this.availableUnits = [];
              this.hasOlderUnits = false;
            }
          }
        } else {
          // Para membresías MENSUALES (modo vigente): mostrar solo unidad actual
          if (currentUnit) {
            // Mostrar solo la unidad actual por defecto
            this.availableUnits = [currentUnit];
            this.updateSelectedUnit(currentUnit.id, currentUnit);
            // Verificar si hay más unidades disponibles además de la actual
            this.hasOlderUnits = processedUnits.length > 1;
          } else {
            // Si no hay unidad actual, mostrar la más reciente (última disponible)
            if (processedUnits.length > 0) {
              // Mostrar solo la última unidad disponible (la más reciente)
              const lastUnit = processedUnits[processedUnits.length - 1];
              this.availableUnits = [lastUnit];
              this.updateSelectedUnit(lastUnit.id, lastUnit);
              this.hasOlderUnits = processedUnits.length > 1;
            } else {
              // No hay unidades disponibles en absoluto
              this.availableUnits = [];
              this.hasOlderUnits = false;
            }
          }
        }

        this.loadingUnits = false;
      },
      error: (error) => {
        console.error('Error al cargar unidades:', error);
        this.loadingUnits = false;
        this.notificationService.showError('Error al cargar los proyectos disponibles', 'Error');
      }
    });
  }

  /**
   * Alterna entre mostrar solo la unidad actual o todas las unidades disponibles
   */
  toggleShowAllUnits(): void {
    this.showAllUnits = !this.showAllUnits;

    if (this.showAllUnits) {
      // Mostrar todas las unidades
      this.availableUnits = this.allUnits;
    } else {
      // Volver a mostrar solo la unidad principal (actual o la más reciente)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Buscar la unidad actual (hoy está dentro del rango)
      const currentUnit = this.allUnits.find(unit => {
        const fechaInicio = new Date(unit.fechaInicio);
        const fechaFin = new Date(unit.fechaFin);
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin.setHours(23, 59, 59, 999);
        return today >= fechaInicio && today <= fechaFin;
      });

      if (currentUnit) {
        // Hay una unidad actual, mostrarla
        this.availableUnits = [currentUnit];
        if (!this.selectedUnitId || this.selectedUnitId !== currentUnit.id) {
          this.updateSelectedUnit(currentUnit.id, currentUnit);
        }
      } else if (this.allUnits.length > 0) {
        // No hay unidad actual, mostrar la última disponible (más reciente)
        const lastUnit = this.allUnits[this.allUnits.length - 1];
        this.availableUnits = [lastUnit];
        if (!this.selectedUnitId) {
          this.updateSelectedUnit(lastUnit.id, lastUnit);
        }
      }
    }
  }

  /**
   * Cambia el año seleccionado y actualiza las unidades disponibles
   */
  selectYear(year: number): void {
    // Si el año es el mismo y la lista está abierta, cerrar. Si no, abrir/cambiar.
    if (this.selectedYear === year && this.availableUnits.length > 0) {
      this.selectedYear = null;
      this.availableUnits = [];
    } else {
      this.selectedYear = year;
      this.availableUnits = this.unidadesPorAnio.get(year) || [];
    }
  }

  /**
   * Obtiene la unidad seleccionada completa
   */
  getSelectedUnit(): UnitSchedule | undefined {
    // Si la lista está vacía (modo histórico), buscar en allUnits
    if (this.availableUnits.length > 0) {
      return this.availableUnits.find(unit => unit.id === this.selectedUnitId);
    }
    // Fallback: buscar en allUnits
    return this.allUnits.find(unit => unit.id === this.selectedUnitId);
  }

  /**
   * Formatea una fecha para mostrarla en formato legible
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /**
   * Actualiza la unidad seleccionada (actualiza tanto el ID como el cache)
   */
  private updateSelectedUnit(unitId: number, unit?: UnitSchedule): void {
    this.selectedUnitId = unitId;
    this.selectedUnit = unit || this.availableUnits.find(u => u.id === unitId) || null;
  }

  /**
   * Maneja el cambio de selección de unidad por el usuario
   */
  onUnitSelectionChange(unitId: number): void {
    
    const unit = this.availableUnits.find(u => Number(u.id) === Number(unitId));

    if (unit) {
      this.updateSelectedUnit(unitId, unit);
      
      // Limpiar todas las opciones seleccionadas al cambiar de unidad
      this.clearAllSelections();
      
      // Si está en modo histórico, cerrar la lista después de seleccionar
      if (this.tipoVisualizacion === 'historico') {
        // Ocultar completamente la lista de unidades, pero NO limpiar selectedUnitId ni selectedYear
        this.availableUnits = [];
        // this.selectedYear = null; // NO limpiar el año seleccionado
        // Así, la unidad seleccionada permanece marcada
        
      }
    }
  }

  /**
   * Limpia todas las selecciones de opciones en todas las materias
   */
  private clearAllSelections(): void {
    if (this.membresia && this.membresia.materias) {
      this.membresia.materias.forEach(materia => {
        if (materia.opciones) {
          materia.opciones.forEach(opcion => {
            opcion.seleccionada = false;
          });
        }
      });
      // Recalcular el total después de limpiar
      this.calculateTotal();
    }
  }

  /**
   * Verifica si una unidad es la actual (fecha de hoy dentro del rango)
   */
  isCurrentUnit(unit: UnitSchedule): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fechaInicio = new Date(unit.fechaInicio);
    const fechaFin = new Date(unit.fechaFin);
    fechaInicio.setHours(0, 0, 0, 0);
    fechaFin.setHours(23, 59, 59, 999);
    return today >= fechaInicio && today <= fechaFin;
  }

  calculateTotal(): void {
    this.total = 0;
    if (!this.membresia) {
      return;
    }

    // Nueva lógica unificada: suma precios individuales + aplica descuento por cantidad
    this.membresia.materias.forEach((materia: any) => {
      const selectedOpciones = materia.opciones.filter((opcion: any) => opcion.seleccionada);
      const selectedCount = selectedOpciones.length;

      if (selectedCount === 0) {
        materia.total = 0;
        materia.precioOriginal = 0;
        materia.descuentoPorcentaje = 0;
        materia.descuentoMonto = 0;
        return;
      }

      // Excepción para materias básicas (id < 3): Membresía Básica y Avanzada
      if (materia.id < 3) {
        // Lógica de precio fijo sin descuento (misma que en backend)
        // Opción 4 (id=4) tiene precio especial S/55, el resto S/45
        materia.total = selectedOpciones.reduce((acc: number, opcion: any) => {
          return acc + (opcion.id === 4 ? 55 : 45);
        }, 0);
        materia.precioOriginal = materia.total;
        materia.descuentoPorcentaje = 0;
        materia.descuentoMonto = 0;
      } else {
        // Lógica estándar: Suma precios individuales + aplica descuento
        const precioSinDescuento = selectedOpciones.reduce((acc: number, opcion: any) => acc + opcion.ahora, 0);
        const discountPercentage = this.getDiscountPercentageByQuantity(selectedCount);
        const descuentoMonto = precioSinDescuento * (discountPercentage / 100);
        const precioFinal = precioSinDescuento - descuentoMonto;

        materia.precioOriginal = precioSinDescuento;
        materia.descuentoPorcentaje = discountPercentage;
        materia.descuentoMonto = descuentoMonto;
        materia.total = precioFinal;
      }
    });

    // Calcular el total general sumando los totales de cada materia
    this.total = this.membresia.materias.reduce((acc: number, materia: any) => acc + (materia.total || 0), 0);
    this.totalSinDescuentoHistorico = this.total; // Guardar total antes del descuento
    this.descuentoHistoricoAplicado = 0; // Resetear descuento

    // 🔒 SEGURIDAD: Aplicar descuento histórico solo si:
    // 1. Modo histórico activo
    // 2. Descuento configurado en backend (SubscriptionType.descuentoUnidadesPasadas > 0)
    // 3. Unidad seleccionada existe y es realmente pasada
    if (this.tipoVisualizacion === 'historico' && this.selectedUnit && this.descuentoHistorico > 0) {
      const fechaFin = new Date(this.selectedUnit.fechaFin);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // ✅ Validación adicional: Solo aplicar si la unidad YA finalizó
      if (fechaFin < hoy) {
        this.descuentoHistoricoAplicado = this.total * (this.descuentoHistorico / 100);
        this.total = this.total - this.descuentoHistoricoAplicado;
        
      } else {
        console.warn(`⚠️ Unidad aún vigente (fin: ${fechaFin.toLocaleDateString()}) - descuento NO aplicado`);
      }
    }

    // Actualizar installments si es Membresía Anual Secundaria
    if (this.membresia.nombre === 'Membresía Anual Secundaria') {
      this.installments = this.calculateInstallments(this.total);
      this.updateCaches(); // Actualizar caches cuando cambie el total

      if (this.selectedCuota && this.selectedCuota > this.installments.cuotas) {
        this.selectedCuota = null;
      }
    }
  }

  /**
   * Calcula el porcentaje de descuento según la cantidad de opciones seleccionadas
   * Misma lógica que SubscriptionDiscountService.java en el backend
   */
  private getDiscountPercentageByQuantity(quantity: number): number {
    switch (quantity) {
      case 2: return 10;
      case 3: return 16;
      case 4: return 20;
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
      case 10: return 29;
      default: return 0; // 1 opción o más de 10 sin descuento
    }
  }

  toggleOpcion(opcion: any, materia?: any) {
    // Si se proporciona la materia, validar restricciones específicas
    if (materia) {
      const materiaName = materia.nombre;
      const isComunicacion = materiaName === 'Comunicación';
      const isMatematica = materiaName === 'Matemática';

      // Si se está seleccionando una opción de Comunicación o Matemática,
      // deseleccionar automáticamente todas las opciones de la materia contraria
      if ((isComunicacion || isMatematica) && !opcion.seleccionada) {
        const otherMateria = isMatematica ? 'Comunicación' : 'Matemática';
        const otherMateriaObj = this.membresia.materias.find(m => m.nombre === otherMateria);

        if (otherMateriaObj) {
          // Deseleccionar todas las opciones de la materia contraria
          otherMateriaObj.opciones.forEach(o => o.seleccionada = false);

          // Mostrar notificación informativa
          // if (otherMateriaObj.opciones.some(o => o.seleccionada === false)) {
          //   this.notificationService.showInfo(
          //     `Se ha deseleccionado ${otherMateria} automáticamente`, 
          //     'Cambio automático'
          //   );
          // }
        }
      }
    }

    // Lógica original para opciones exclusivas
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

  // Nuevo método para verificar si una opción debe estar deshabilitada por conflicto de materias
  isOptionDisabledByMateriaConflict(opcion: any, materia: any): boolean {
    if (!materia || !this.membresia) return false;

    const materiaName = materia.nombre;
    const isComunicacion = materiaName === 'Comunicación';
    const isMatematica = materiaName === 'Matemática';

    // Solo aplicar esta lógica para Comunicación y Matemática
    if (!isComunicacion && !isMatematica) return false;

    // Si la opción ya está seleccionada, no debe estar deshabilitada
    if (opcion.seleccionada) return false;

    // Verificar si la materia contraria tiene opciones seleccionadas
    const otherMateria = isMatematica ? 'Comunicación' : 'Matemática';
    const otherMateriaObj = this.membresia.materias.find(m => m.nombre === otherMateria);

    if (otherMateriaObj && otherMateriaObj.opciones.some(o => o.seleccionada)) {
      return true; // Deshabilitar esta opción porque la materia contraria tiene selecciones
    }

    return false;
  }

  // Método para verificar si toda una materia debe estar deshabilitada
  isMateriaDisabled(materia: any): boolean {
    if (!materia || !this.membresia) return false;

    const materiaName = materia.nombre;
    const isComunicacion = materiaName === 'Comunicación';
    const isMatematica = materiaName === 'Matemática';

    // Solo aplicar esta lógica para Comunicación y Matemática
    if (!isComunicacion && !isMatematica) return false;

    // Si esta materia ya tiene opciones seleccionadas, no debe estar deshabilitada
    if (materia.opciones.some(o => o.seleccionada)) return false;

    // Verificar si la materia contraria tiene opciones seleccionadas
    const otherMateria = isMatematica ? 'Comunicación' : 'Matemática';
    const otherMateriaObj = this.membresia.materias.find(m => m.nombre === otherMateria);

    return otherMateriaObj && otherMateriaObj.opciones.some(o => o.seleccionada);
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
      return;
    }

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

  // Método para cerrar el modal al hacer clic fuera de él
  closeModalOnBackdrop(event: any): void {
    if (event.target.classList.contains('modern-modal')) {
      this.closeModal();
    }
  }

  // Método para manejar el escape key
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.selectedMateria) {
      this.closeModal();
    }
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
    return { cuotas, montoPorCuota };
  }

  selectCuota(cuota: number): void {
    this.selectedCuota = cuota;
    this.installments.montoPorCuota = this.montoPorCuotaCache[cuota] || (this.total / cuota);
    this.isValid = true;
    this.validationMessage = null;
    this.totalCuotas = this.total / cuota;
    this.updatePaymentSchedule(); // Actualizar calendario cuando se selecciona una cuota
  }

  toggleInstallments(): void {
    this.showInstallments = !this.showInstallments;

    if (!this.showInstallments) {
      // Restablece los valores si se cancela el fraccionamiento
      this.selectedCuota = null;
      this.installments = { cuotas: 1, montoPorCuota: this.total };
      this.isValid = true;
      this.validationMessage = null;
      this.paymentSchedule = []; // Limpiar calendario
    } else {
      // Recalcula las cuotas disponibles al activar el fraccionamiento
      this.installments = this.calculateInstallments(this.total);
      this.updateCaches(); // Actualizar caches
    }
  }

  private updateCaches(): void {
    // Actualizar cache de cuotas
    this.cuotasArray = Array.from({ length: this.installments.cuotas }, (_, i) => i + 1);

    // Limpiar cache de montos por cuota
    this.montoPorCuotaCache = {};

    // Llenar cache de montos por cuota
    for (let i = 1; i <= this.installments.cuotas; i++) {
      this.montoPorCuotaCache[i] = this.total / i;
    }

    // Actualizar calendario de pagos si hay una cuota seleccionada
    if (this.selectedCuota) {
      this.updatePaymentSchedule();
    }
  }

  private updatePaymentSchedule(): void {
    if (!this.selectedCuota || this.total === 0) {
      this.paymentSchedule = [];
      return;
    }

    const schedule = [];
    const cuotaMonto = this.total / this.selectedCuota;
    const today = new Date();

    for (let i = 0; i < this.selectedCuota; i++) {
      const paymentDate = new Date(today);
      paymentDate.setMonth(today.getMonth() + i);

      schedule.push({
        monto: cuotaMonto,
        fecha: paymentDate.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' }),
      });
    }

    this.paymentSchedule = schedule;
  }

  goToCheckout(): void {
    // Clear the cart before adding the subscription
    this.cartService.clearCart();

    const selectedUnit = this.getSelectedUnit();
    

    if (!selectedUnit) {
      this.notificationService.showError('Debes seleccionar un proyecto/unidad', 'Error');
      return;
    }

    const subscriptionItem: CartItem = {
      id: Number(this.id), // Usa el ID real de la membresía
      title: this.membresia.nombre, // Título de la suscripción
      description: this.membresia.descripcion, // Descripción de la suscripción
      price: this.selectedCuota > 1 ? this.total / this.selectedCuota : this.total, // Precio total calculado de la suscripción
      imagenUrlPublic: `assets/images/${Number(this.id)}.PNG`, // Usa la imagen basada en el ID de la membresía
      isSubscription: true, // Indica que es una suscripción
      totalCuotas: this.selectedCuota || 1, // Número total de cuotas seleccionadas
      montoPorCuota: this.installments.montoPorCuota || this.total, // Monto por cada cuota
      montoTotal: this.total, // Monto total de la suscripción
      unitScheduleId: selectedUnit.id, // ID único del UnitSchedule seleccionado (sin ambigüedad)
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
      this.notificationService.showSuccess('Suscripción añadida al carrito', 'Éxito');
      this.router.navigate(['/site/checkout']); // Redirige al checkout
    } else {
      this.notificationService.showWarning('La suscripción ya está en el carrito', 'Información');
    }
  }


  getCuotasArray(): number[] {
    return this.cuotasArray;
  }

  getMontoPorCuota(cuota: number): number {
    return this.montoPorCuotaCache[cuota] || (this.total / cuota);
  }

  getPaymentSchedule(): { monto: number; fecha: string }[] {
    return this.paymentSchedule;
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

    // Verificar el estado de autenticación de forma más robusta
    this.checkAuthState();

    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser || !this.isAuthenticated) {
      this.openAuthModal();
      return;
    }

    // Validar revendedor antes de proceder al checkout
    this.validateResellerAndProceed();
  }

  private validateResellerAndProceed(): void {
    // Mostrar estado de carga
    this.isValidatingReseller = true;
    this.validationMessage = 'Validando información...';
    this.isValid = true;

    // Obtener las materias seleccionadas
    const selectedMaterias = this.membresia.materias.filter(
      materia => materia.opciones.some(opcion => opcion.seleccionada)
    );

    if (selectedMaterias.length === 0) {
      this.isValidatingReseller = false;
      this.validationMessage = 'Por favor, selecciona al menos una opción para continuar.';
      this.isValid = false;
      return;
    }

    // Filtrar solo las materias que necesitan validación (Comunicación o Matemática)
    const materiasToValidate = selectedMaterias.filter(
      materia => materia.nombre === 'Comunicación' || materia.nombre === 'Matemática'
    );

    // Verificar que no se seleccionen ambas materias al mismo tiempo
    const hasComunicacion = materiasToValidate.some(m => m.nombre === 'Comunicación');
    const hasMatematica = materiasToValidate.some(m => m.nombre === 'Matemática');

    if (hasComunicacion && hasMatematica) {
      this.isValidatingReseller = false;
      this.showConflictAlert();
      return;
    }

    // Si no hay materias que validar, proceder directamente al checkout
    if (materiasToValidate.length === 0) {
      this.isValidatingReseller = false;
      this.validationMessage = null;
      this.isValid = true;
      this.goToCheckout();
      return;
    }

    // Validar las materias que requieren validación
    this.validateMateriasSequentially(materiasToValidate, 0);
  }

  private validateMateriasSequentially(materias: any[], index: number): void {
    if (index >= materias.length) {
      // Todas las materias han sido validadas exitosamente
      this.isValidatingReseller = false;
      this.validationMessage = null;
      this.isValid = true;
      this.goToCheckout();
      return;
    }

    const materia = materias[index];
    const selectedOptions = materia.opciones.filter(opcion => opcion.seleccionada);

    if (selectedOptions.length === 0) {
      // Si no hay opciones seleccionadas en esta materia, pasar a la siguiente
      this.validateMateriasSequentially(materias, index + 1);
      return;
    }

    // Obtener el ID del usuario desde localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser.id || currentUser.userId;

    if (!userId) {
      this.isValidatingReseller = false;
      this.validationMessage = 'Error: No se pudo obtener la información del usuario.';
      this.isValid = false;
      return;
    }


    // Llamar al servicio de validación con userId y nombre de la materia
    this.membresiaService.getValidateRevendedor(userId, materia.nombre)
      .subscribe({
        next: (response) => {

          if (response.result === true) {
            // Validación exitosa, continuar con la siguiente materia
            this.validateMateriasSequentially(materias, index + 1);
          } else {
            // Validación fallida, verificar el tipo de error
            this.isValidatingReseller = false;

            // Verificar si es un conflicto específico de Matemática y Comunicación
            const responseData = response.data || '';
            const isConflict = responseData.includes('both Matemática and Comunicación') ||
              responseData.includes('cannot subscribe to both') ||
              responseData.includes('Conflict detected');

            if (isConflict) {
              this.showConflictAlert();
            } else {
              // Mostrar modal de alerta normal para revendedor
              this.showResellerAlert(materia.nombre, selectedOptions);
            }
          }
        },
        error: (error) => {

          // En caso de error, verificar si es un error 400 con mensaje de conflicto
          if (error.status === 400 && error.error && error.error.data) {
            const errorData = error.error.data;
            const isConflict = errorData.includes('both Matemática and Comunicación') ||
              errorData.includes('cannot subscribe to both') ||
              errorData.includes('Conflict detected');

            this.isValidatingReseller = false;

            if (isConflict) {
              this.showConflictAlert();
              return;
            }
          }

          // Error genérico
          this.isValidatingReseller = false;
          this.validationMessage = 'Error al validar la información. Por favor, intenta nuevamente.';
          this.isValid = false;
          this.showErrorToast('Error al validar la información');
        }
      });
  }

  private showErrorToast(message: string): void {
    this.notificationService.showError(message, 'Error de Validación');
  }

  private showResellerAlert(materiaNombre: string, selectedOptions?: any[]): void {
    const isMobile = window.innerWidth <= 768;
    const isSmallHeight = window.innerHeight <= 600;

    const dialogRef = this.dialog.open(ResellerAlertModalComponent, {
      width: isMobile ? '95vw' : '500px',
      maxWidth: isMobile ? '95vw' : '500px',
      maxHeight: isSmallHeight ? '95vh' : '90vh',
      data: {
        materiaNombre: materiaNombre,
        selectedOptions: selectedOptions || []
      },
      disableClose: true,
      panelClass: ['custom-dialog-container', 'scrollable-dialog'],
      hasBackdrop: true,
      autoFocus: false,
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Usuario decidió contactar soporte
        this.notificationService.showInfo('Te recomendamos contactar con soporte para más información', 'Información');
      }
      // En ambos casos, no continuar con el checkout
      this.validationMessage = 'Validación de revendedor no superada. Contacta con soporte si necesitas ayuda.';
      this.isValid = false;
    });
  }

  private showConflictAlert(): void {
    const isMobile = window.innerWidth <= 768;
    const isSmallHeight = window.innerHeight <= 600;

    const dialogRef = this.dialog.open(ResellerAlertModalComponent, {
      width: isMobile ? '95vw' : '500px',
      maxWidth: isMobile ? '95vw' : '500px',
      maxHeight: isSmallHeight ? '95vh' : '90vh',
      data: {
        materiaNombre: 'Matemática y Comunicación',
        selectedOptions: [],
        isConflict: true,
        conflictMessage: 'No puedes suscribirte a ambas materias (Matemática y Comunicación) al mismo tiempo.'
      },
      disableClose: true,
      panelClass: ['custom-dialog-container', 'scrollable-dialog'],
      hasBackdrop: true,
      autoFocus: false,
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Usuario decidió contactar soporte
        this.notificationService.showInfo('Te recomendamos contactar con soporte para más información', 'Información');
      }
      // En ambos casos, no continuar con el checkout
      this.validationMessage = 'No puedes suscribirte a Matemática y Comunicación al mismo tiempo.';
      this.isValid = false;
    });
  }

  openAuthModal(): void {
    const isMobile = window.innerWidth <= 768;
    const isSmallHeight = window.innerHeight <= 600;
    const isVerySmallHeight = window.innerHeight <= 500;

    let dialogConfig: any = {
      width: isMobile ? '95vw' : '500px',
      maxWidth: isMobile ? '95vw' : '500px',
      panelClass: ['custom-dialog-container'],
      data: { returnUrl: this.router.url },
      disableClose: false,
      hasBackdrop: true,
      backdropClass: 'auth-modal-backdrop',
      autoFocus: false,
      restoreFocus: false
    };

    // Solo aplicar configuraciones especiales para dispositivos móviles con pantallas pequeñas
    if (isMobile && isVerySmallHeight) {
      dialogConfig.maxHeight = 'calc(100vh - 20px)';
      dialogConfig.position = { top: '10px' };
    } else if (isMobile && isSmallHeight) {
      dialogConfig.maxHeight = 'calc(100vh - 40px)';
      dialogConfig.position = { top: '20px' };
    }
    // Para desktop, NUNCA aplicar restricciones de altura o posición

    if (isMobile) {
      dialogConfig.panelClass.push('mobile-dialog');
    } else {
      dialogConfig.panelClass.push('desktop-dialog');
    }

    const dialogRef = this.dialog.open(AuthModalComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      // Verificar si el usuario se logueó exitosamente
      this.checkAuthState();

      // Dar un tiempo para que el SharedService se actualice
      setTimeout(() => {
        this.checkAuthState();

        // Si ahora está autenticado, proceder con la validación
        if (this.isAuthenticated) {
          this.validateAndProceed();
        }
      }, 300);
    });
  }

  trackByCuota(index: number, cuota: number): number {
    return cuota;
  }

  trackByMateria(index: number, materia: any): any {
    return materia.id || index;
  }

  // Nuevas funciones para el resumen mejorado
  hasSelectedItems(): boolean {
    return this.membresia && this.membresia.materias &&
      this.membresia.materias.some(materia => (materia as any).total > 0);
  }

  getSelectedOptionsCount(materia: any): number {
    if (!materia || !materia.opciones) return 0;
    return materia.opciones.filter((opcion: any) => opcion.seleccionada).length;
  }

  // Función para obtener el nombre personalizado de las muestras
  getSampleName(index: number): string {
    const sampleNames = [
      'Plan anual',
      'Unidad de aprendizaje',
      'Sesión de aprendizaje',
      'Ficha de aprendizaje'
    ];
    return sampleNames[index] || `Muestra ${index + 1}`;
  }

}
