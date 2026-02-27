import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SuscripcionesData, SuscripcionEnhanced } from '../../@core/interfaces/suscripciones';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { PageEvent } from '@angular/material/paginator';
import { ConfirmDialogComponent } from './dialogs/confirm-dialog.component';
import { PagosDialogComponent } from './dialogs/pagos-dialog.component';
import { ActivarDialogComponent } from './dialogs/activar-dialog.component';
import { EditSubscriptionDialogComponent } from './dialogs/edit-subscription-dialog.component';
import { DocumentosDialogComponent } from './dialogs/documentos-dialog.component';
import { SubscriptionAdminService } from '../../@core/backend/services/subscription-admin.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'ngx-suscripciones',
  templateUrl: './suscripciones.component.html',
  styleUrls: ['./suscripciones.component.scss']
})
export class SuscripcionesComponent implements OnInit, OnDestroy {

  constructor(
    private router: Router,
    private suscripcionesService: SuscripcionesData,
    private subscriptionAdminService: SubscriptionAdminService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Cargar TODOS los tipos de suscripción disponibles para el filtro
    this.loadSubscriptionTypes();
    
    // Solo cargar activas al inicio (lazy loading)
    this.cargarActivas();
    
    // Configurar búsqueda con debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  // Método para detectar dispositivos móviles de manera más robusta
  private isMobileDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobileUserAgent || (isSmallScreen && isTouchDevice);
  }

  displayedColumns: string[] = ['usuario', 'nombre', 'materias', 'estadisticas', 'fechaInicio', 'fechaFin', 'acciones'];

  // ========== DATOS ORIGINALES ==========
  suscripcionesActivas: any[] = [];
  suscripcionesInactivas: any[] = [];
  allSuscripciones: any[] = []; // Todas las suscripciones sin filtrar
  
  // ========== LOADING STATES ==========
  cargando: boolean = false;
  loadingActivas: boolean = false;
  loadingInactivas: boolean = false;
  activasLoaded: boolean = false;
  inactivasLoaded: boolean = false;
  
  // ========== BÚSQUEDA Y FILTROS ==========
  searchTerm: string = '';
  selectedSubscriptionType: string = '';
  subscriptionTypes: string[] = [];
  private searchSubject = new Subject<string>();
  
  // ========== PAGINACIÓN ==========
  // Activas
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  pageIndexActivas: number = 0;
  filteredActivas: any[] = [];
  displayedActivas: any[] = [];
  totalActivasCount: number = 0; // Total de elementos en servidor
  
  // Inactivas
  pageIndexInactivas: number = 0;
  filteredInactivas: any[] = [];
  displayedInactivas: any[] = [];
  totalInactivasCount: number = 0; // Total de elementos en servidor
  
  // ========== TABS ==========
  selectedTabIndex: number = 0;
  
  // Flag para usar el servicio optimizado con caché
  private useOptimizedService = true;

  // ========== LAZY LOADING DE DATOS ==========

  /**
   * Carga TODOS los tipos de suscripción disponibles para el dropdown del filtro.
   * Usa getAllWithCache() que tiene cache de 2 minutos, solo para extraer tipos únicos.
   */
  private loadSubscriptionTypes(): void {
    this.subscriptionAdminService.getAllWithCache().subscribe({
      next: (suscripciones) => {
        // Extraer tipos únicos y ordenarlos
        const types = new Set<string>();
        suscripciones.forEach(sub => {
          if (sub.subscriptionType) {
            types.add(sub.subscriptionType);
          }
        });
        this.subscriptionTypes = Array.from(types).sort();
        console.log(`[SuscripcionesComponent] ${this.subscriptionTypes.length} tipos de suscripción cargados:`, this.subscriptionTypes);
      },
      error: (error) => {
        console.error('Error al cargar tipos de suscripción:', error);
      }
    });
  }

  /**
   * Carga SOLO suscripciones activas al inicio (Server-Side Pagination)
   */
  cargarActivas(): void {
    if (this.activasLoaded && !this.searchTerm && !this.selectedSubscriptionType) {
      return; // Ya cargadas sin filtros
    }

    this.loadingActivas = true;
    
    // Hacer request server-side paginado
    this.subscriptionAdminService.getAllPaginated({
      status: 'ACTIVA',
      search: this.searchTerm,
      type: this.selectedSubscriptionType,
      page: this.pageIndexActivas,
      size: this.pageSize,
      sort: 'fechaInicio,desc'
    }).subscribe({
      next: (pagedData) => {
        if (pagedData) {
          console.log('[SuscripcionesComponent] Activas cargadas - Página:', pagedData.number + 1, '/', pagedData.totalPages);
          
          // Procesar solo los items de esta página
          this.procesarSuscripcionesPaginadas(pagedData.content, 'ACTIVA');
          
          // Usar los datos PROCESADOS (con estructura correcta: usuario, nombre, materias)
          this.filteredActivas = this.suscripcionesActivas; 
          this.displayedActivas = this.suscripcionesActivas;
          
          // Guardar el total de elementos del servidor para el paginator
          this.totalActivasCount = pagedData.totalElements;
        } else {
          this.filteredActivas = [];
          this.displayedActivas = [];
          this.totalActivasCount = 0;
        }
        
        this.loadingActivas = false;
        this.activasLoaded = true;
      },
      error: (error) => {
        console.error('Error al cargar suscripciones activas:', error);
        this.mostrarMensaje('Error al cargar las suscripciones activas', 'error');
        this.loadingActivas = false;
      }
    });
  }

  /**
   * Carga inactivas solo cuando el usuario hace click en tab (Server-Side Pagination)
   */
  cargarInactivas(): void {
    if (this.inactivasLoaded && !this.searchTerm && !this.selectedSubscriptionType) {
      return; // Ya cargadas sin filtros
    }

    this.loadingInactivas = true;
    
    // Hacer request server-side paginado
    this.subscriptionAdminService.getAllPaginated({
      status: 'INACTIVA',
      search: this.searchTerm,
      type: this.selectedSubscriptionType,
      page: this.pageIndexInactivas,
      size: this.pageSize,
      sort: 'fechaFin,desc'
    }).subscribe({
      next: (pagedData) => {
        if (pagedData) {
          console.log('[SuscripcionesComponent] Inactivas cargadas - Página:', pagedData.number + 1, '/', pagedData.totalPages);
          
          // Procesar solo los items de esta página
          this.procesarSuscripcionesPaginadas(pagedData.content, 'INACTIVA');
          
          // Usar los datos PROCESADOS (con estructura correcta: usuario, nombre, materias)
          this.filteredInactivas = this.suscripcionesInactivas;
          this.displayedInactivas = this.suscripcionesInactivas;
          
          // Guardar el total de elementos del servidor para el paginator
          this.totalInactivasCount = pagedData.totalElements;
        } else {
          this.filteredInactivas = [];
          this.displayedInactivas = [];
          this.totalInactivasCount = 0;
        }
        
        this.loadingInactivas = false;
        this.inactivasLoaded = true;
      },
      error: (error) => {
        console.error('Error al cargar suscripciones inactivas:', error);
        this.mostrarMensaje('Error al cargar las suscripciones inactivas', 'error');
        this.loadingInactivas = false;
      }
    });
  }

  /**
   * Handler para cambio de tab (lazy loading de inactivas)
   */
  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex = event.index;
    
    if (event.index === 1 && !this.inactivasLoaded) {
      // Tab de inactivas, cargar si no están cargadas
      this.cargarInactivas();
    }
  }

  // ========== BÚSQUEDA Y FILTROS ==========

  /**
   * Handler para cambio en el input de búsqueda (con debounce)
   */
  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Handler para cambio en filtros
   */
  onFilterChange(): void {
    this.pageIndexActivas = 0;
    this.pageIndexInactivas = 0;
    this.applyFilters();
  }

  /**
   * Aplica búsqueda y filtros con server-side request
   */
  applyFilters(): void {
    // Resetear índices de página
    this.pageIndexActivas = 0;
    this.pageIndexInactivas = 0;
    
    // Recargar con filtros aplicados
    if (this.selectedTabIndex === 0) {
      // Tab activas
      this.activasLoaded = false; // Forzar recarga
      this.cargarActivas();
    } else {
      // Tab inactivas
      this.inactivasLoaded = false; // Forzar recarga
      this.cargarInactivas();
    }
  }

  /**
   * Limpia búsqueda y filtros
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedSubscriptionType = '';
    this.applyFilters();
  }

  /**
   * Extrae tipos únicos de suscripción para el filtro
   */
  private extractSubscriptionTypes(suscripciones: any[]): void {
    const types = new Set<string>();
    suscripciones.forEach(sub => {
      if (sub.subscriptionType) {
        types.add(sub.subscriptionType);
      }
    });
    this.subscriptionTypes = Array.from(types).sort();
  }

  // ========== PAGINACIÓN ==========

  /**
   * Handler para cambio de página (activas) - hace request al backend
   */
  onPageChangeActivas(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndexActivas = event.pageIndex;
    
    // Recargar con nueva página
    this.activasLoaded = false;
    this.cargarActivas();
  }

  /**
   * Handler para cambio de página (inactivas) - hace request al backend
   */
  onPageChangeInactivas(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndexInactivas = event.pageIndex;
    
    // Recargar con nueva página
    this.inactivasLoaded = false;
    this.cargarInactivas();
  }

  procesarSuscripciones(suscripciones: any[]): void {
    this.suscripcionesActivas = [];
    this.suscripcionesInactivas = [];

    suscripciones.forEach(suscripcion => {
      const suscripcionProcesada = {
        id: suscripcion.id,
        usuario: suscripcion.userName,
        nombre: suscripcion.subscriptionType,
        materias: this.procesarMaterias(suscripcion.materiasOpcionesJson ?? ''),
        fechaInicio: suscripcion.startDate,
        fechaFin: suscripcion.endDate,
        // Mantener las propiedades originales para el modal
        endDate: suscripcion.endDate,
        status: suscripcion.status,
        // Agregar propiedades adicionales para el modal de edición
        subscriptionTypeId: suscripcion.subscriptionTypeId || 1, // Valor por defecto si no viene
        subscriptionType: suscripcion.subscriptionType,
        // Inicializar contadores vacíos (para compatibilidad)
        counts: {
          totalPayments: 0,
          pendingPayments: 0,
          overduePayments: 0,
          totalDocuments: 0
        }
      };

      if (suscripcion.status === 'ACTIVA') {
        this.suscripcionesActivas.push(suscripcionProcesada);
      } else {
        this.suscripcionesInactivas.push(suscripcionProcesada);
      }
    });
  }

  /**
   * NUEVO: Procesa suscripciones con contadores pre-calculados del backend.
   * Incluye información de pagos, pagos pendientes, vencidos y documentos.
   */
  procesarSuscripcionesOptimizadas(suscripciones: SuscripcionEnhanced[]): void {
    this.suscripcionesActivas = [];
    this.suscripcionesInactivas = [];

    suscripciones.forEach(suscripcion => {
      const suscripcionProcesada = {
        id: suscripcion.id,
        usuario: suscripcion.userName,
        nombre: suscripcion.subscriptionType,
        materias: this.procesarMaterias(suscripcion.materiasOpcionesJson ?? ''),
        fechaInicio: suscripcion.startDate,
        fechaFin: suscripcion.endDate,
        endDate: suscripcion.endDate,
        status: suscripcion.status,
        subscriptionTypeId: 1, // Default
        subscriptionType: suscripcion.subscriptionType,
        // NUEVO: Contadores pre-calculados desde backend
        counts: suscripcion.counts || {
          totalPayments: 0,
          pendingPayments: 0,
          overduePayments: 0,
          totalDocuments: 0
        },
        // NUEVO: Links HATEOAS
        links: suscripcion.links
      };

      if (suscripcion.status === 'ACTIVA') {
        this.suscripcionesActivas.push(suscripcionProcesada);
      } else {
        this.suscripcionesInactivas.push(suscripcionProcesada);
      }
    });

    console.log(
      `[SuscripcionesComponent] Procesadas ${this.suscripcionesActivas.length} activas, ` +
      `${this.suscripcionesInactivas.length} inactivas`
    );
  }

  /**
   * Procesa suscripciones de una página del servidor (Server-Side Pagination)
   * Solo procesa los items de la página actual, no separa en activas/inactivas
   */
  procesarSuscripcionesPaginadas(suscripciones: SuscripcionEnhanced[], targetStatus: 'ACTIVA' | 'INACTIVA'): void {
    const processed = suscripciones.map(suscripcion => ({
      id: suscripcion.id,
      usuario: suscripcion.userName,
      nombre: suscripcion.subscriptionType,
      materias: this.procesarMaterias(suscripcion.materiasOpcionesJson ?? ''),
      fechaInicio: suscripcion.startDate,
      fechaFin: suscripcion.endDate,
      endDate: suscripcion.endDate,
      status: suscripcion.status,
      subscriptionTypeId: 1, // Default (propiedad no viene en SuscripcionEnhanced)
      subscriptionType: suscripcion.subscriptionType,
      counts: suscripcion.counts || {
        totalPayments: 0,
        pendingPayments: 0,
        overduePayments: 0,
        totalDocuments: 0
      },
      links: suscripcion.links
    }));

    if (targetStatus === 'ACTIVA') {
      this.suscripcionesActivas = processed;
    } else {
      this.suscripcionesInactivas = processed;
    }

    console.log(`[SuscripcionesComponent] Procesadas ${processed.length} suscripciones ${targetStatus}s de la página actual`);
  }

  procesarMaterias(materiasJson: string): string[] {
    // Validar que materiasJson sea un valor válido
    if (!materiasJson || materiasJson === 'undefined' || materiasJson === 'null' || materiasJson.trim() === '') {
      console.warn('[SuscripcionesComponent] materiasJson inválido:', materiasJson);
      return [];
    }

    try {
      const materias = JSON.parse(materiasJson);
      
      // Validar que el resultado del parse sea un objeto válido
      if (!materias || typeof materias !== 'object') {
        console.warn('[SuscripcionesComponent] JSON parseado no es un objeto:', materias);
        return [];
      }
      
      const materiasArray: string[] = [];
      
      for (const nivel in materias) {
        if (materias.hasOwnProperty(nivel)) {
          materiasArray.push(nivel);
          if (Array.isArray(materias[nivel])) {
            materiasArray.push(...materias[nivel]);
          }
        }
      }
      
      return materiasArray;
    } catch (error) {
      console.error('Error al procesar materias:', error, 'Input:', materiasJson);
      return [];
    }
  }

  editarSuscripcion(suscripcion: any): void {
    console.log('=== DEBUG editarSuscripcion ===');
    console.log('Suscripcion completa:', suscripcion);
    console.log('ID de suscripción:', suscripcion.id);
    console.log('subscriptionTypeId:', suscripcion.subscriptionTypeId);
    console.log('subscriptionType:', suscripcion.subscriptionType);
    
    // Verificar que existe el ID
    if (!suscripcion.id) {
      console.error('❌ ERROR: No se encontró ID en la suscripción');
      this.mostrarMensaje('Error: No se puede editar la suscripción sin ID', 'error');
      return;
    }
    
    console.log('🔄 Navegando a:', `/pages-admin/suscriptores/editar/${suscripcion.id}`);
    
    // Navegar a la página de edición
    this.router.navigate(['/pages-admin/suscriptores/editar', suscripcion.id])
      .then(success => {
        console.log('✅ Navegación exitosa:', success);
      })
      .catch(error => {
        console.error('❌ Error en navegación:', error);
        this.mostrarMensaje('Error al intentar navegar a la página de edición', 'error');
      });
  }

  cancelarSuscripcion(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      data: {
        title: 'Confirmar Cancelación',
        message: '¿Estás seguro de que deseas cancelar esta suscripción?',
        confirmText: 'Cancelar Suscripción',
        cancelText: 'No, mantener'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ejecutarCancelacion(id);
      }
    });
  }

  ejecutarCancelacion(id: number): void {
    if (this.useOptimizedService) {
      // NUEVO: Usar servicio optimizado con actualización selectiva
      this.subscriptionAdminService.cancelarSuscripcion(id).subscribe({
        next: (success) => {
          if (success) {
            this.mostrarMensaje('Suscripción cancelada exitosamente', 'success');
            // Recargar datos y aplicar filtros/paginación
            this.recargarDespuesDeAccion();
          } else {
            this.mostrarMensaje('No se pudo cancelar la suscripción', 'error');
          }
        },
        error: (error) => {
          console.error('Error al cancelar suscripción:', error);
          this.mostrarMensaje('Error al cancelar la suscripción', 'error');
        }
      });
    } else {
      // LEGACY: Servicio original
      this.suscripcionesService.putCancelarSuscripcion(id).subscribe({
        next: (response) => {
          if (response.result && response.data) {
            this.mostrarMensaje('Suscripción cancelada exitosamente', 'success');
            this.recargarDespuesDeAccion();
          } else {
            this.mostrarMensaje('No se pudo cancelar la suscripción', 'error');
          }
        },
        error: (error) => {
          console.error('Error al cancelar suscripción:', error);
          this.mostrarMensaje('Error al cancelar la suscripción', 'error');
        }
      });
    }
  }

  verPagos(id: number) {
    this.suscripcionesService.getPaymentsBySuscripcionId(id).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.mostrarDialogoPagos(response.data);
        } else {
          this.mostrarMensaje('No se encontraron pagos para esta suscripción', 'info');
        }
      },
      error: (error) => {
        console.error('Error al obtener pagos:', error);
        this.mostrarMensaje('Error al cargar los pagos', 'error');
      }
    });
  }

  mostrarDialogoPagos(pagos: any[]): void {
    this.dialog.open(PagosDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { pagos: pagos }
    });
  }

  activarSuscripcion(id: number, dias: number = 30): void {
    if (this.useOptimizedService) {
      // NUEVO: Usar servicio optimizado con actualización selectiva
      this.subscriptionAdminService.activarSuscripcion(id, dias).subscribe({
        next: (success) => {
          if (success) {
            this.mostrarMensaje('Suscripción activada exitosamente', 'success');
            // Recargar datos y aplicar filtros/paginación
            this.recargarDespuesDeAccion();
          } else {
            this.mostrarMensaje('No se pudo activar la suscripción', 'error');
          }
        },
        error: (error) => {
          console.error('Error al activar suscripción:', error);
          this.mostrarMensaje('Error al activar la suscripción', 'error');
        }
      });
    } else {
      // LEGACY: Servicio original
      this.suscripcionesService.putActivarSuscripcion(id, dias).subscribe({
        next: (response) => {
          if (response.result && response.data) {
            this.mostrarMensaje('Suscripción activada exitosamente', 'success');
            this.recargarDespuesDeAccion();
          } else {
            this.mostrarMensaje('No se pudo activar la suscripción', 'error');
          }
        },
        error: (error) => {
          console.error('Error al activar suscripción:', error);
          this.mostrarMensaje('Error al activar la suscripción', 'error');
        }
      });
    }
  }

  /**
   * Recarga datos después de una acción (cancelar/activar) y mantiene filtros/paginación
   */
  private recargarDespuesDeAccion(): void {
    this.activasLoaded = false;
    this.inactivasLoaded = false;
    this.cargarActivas();
  }

  mostrarDialogoActivar(id: number): void {
    // Buscar la suscripción en ambas listas
    let suscripcion = this.suscripcionesActivas.find(s => s.id === id);
    if (!suscripcion) {
      suscripcion = this.suscripcionesInactivas.find(s => s.id === id);
    }
    
    if (!suscripcion) {
      this.mostrarMensaje('Suscripción no encontrada', 'error');
      return;
    }
    

    const dialogRef = this.dialog.open(ActivarDialogComponent, {
      width: '490px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      data: { 
        suscripcionId: id,
        endDate: suscripcion.endDate,
        status: suscripcion.status
      }
    });

    dialogRef.afterClosed().subscribe(dias => {
      if (dias !== undefined) { // Permitir valor 0 para activaciones sin días adicionales
        this.activarSuscripcion(id, dias);
      }
    });
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: [`snackbar-${tipo}`],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  verDocumentos(suscripcion: any): void {
    
    // Verificar que el servicio existe
    if (!this.suscripcionesService.getDocumentsBySubscription) {
      console.error('El método getDocumentsBySubscription no existe en el servicio');
      this.mostrarMensaje('Error: Método no implementado en el servicio', 'error');
      return;
    }
    
    this.suscripcionesService.getDocumentsBySubscription(suscripcion.id).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          this.mostrarDialogoDocumentos(suscripcion, response.data);
        } else {
          this.mostrarDialogoDocumentos(suscripcion, {});
        }
      },
      error: (error) => {
        console.error('Error al obtener documentos:', error);
        // Mostrar modal con error pero permitir ver la UI
        this.mostrarDialogoDocumentos(suscripcion, {});
        this.mostrarMensaje('Error al cargar los documentos de la suscripción', 'error');
      }
    });
  }

  mostrarDialogoDocumentos(suscripcion: any, documents: any): void {
    
    const dialogRef = this.dialog.open(DocumentosDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '85vh',
      position: { top: '80px' },
      data: {
        subscriptionId: suscripcion.id,
        subscriptionName: suscripcion.nombre + ' - ' + suscripcion.usuario,
        documents: documents
      }
    });

    dialogRef.afterClosed().subscribe(result => {
    });
  }
}
