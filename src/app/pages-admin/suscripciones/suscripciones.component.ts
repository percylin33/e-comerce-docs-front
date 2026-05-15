import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SuscripcionesData, SuscripcionEnhanced } from '../../@core/interfaces/suscripciones';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent, MatTabGroup, MatTab } from '@angular/material/tabs';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { ConfirmDialogComponent } from './dialogs/confirm-dialog.component';
import { PagosDialogComponent } from './dialogs/pagos-dialog.component';
import { ActivarDialogComponent } from './dialogs/activar-dialog.component';
import { DocumentosDialogComponent } from './dialogs/documentos-dialog.component';
import { DetalleDialogComponent } from './dialogs/detalle-dialog.component';
import { ActionReasonDialogComponent, ActionReasonDialogData, ActionReasonDialogResult } from './dialogs/action-reason-dialog.component';
import { ActionLogDialogComponent, ActionLogDialogData } from './dialogs/action-log-dialog.component';
import { SubscriptionAdminService } from '../../@core/backend/services/subscription-admin.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatCard, MatCardHeader, MatCardAvatar, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { SlicePipe, DatePipe } from '@angular/common';

@Component({
    selector: 'ngx-suscripciones',
    templateUrl: './suscripciones.component.html',
    styleUrls: ['./suscripciones.component.scss'],
    standalone: true,
    imports: [MatFormField, MatLabel, MatInput, FormsModule, MatIcon, MatPrefix, MatIconButton, MatSuffix, MatSelect, MatOption, MatButton, MatProgressSpinner, MatTabGroup, MatTab, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatPaginator, MatCard, MatCardHeader, MatCardAvatar, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions, SlicePipe, DatePipe]
})
export class SuscripcionesComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private suscripcionesService = inject(SuscripcionesData);
  private subscriptionAdminService = inject(SubscriptionAdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);


  ngOnInit(): void {
    // Restaurar filtros si venimos de la página de edición
    this.restoreFilterState();

    // Cargar TODOS los tipos de suscripción disponibles para el filtro
    this.loadSubscriptionTypes();

    // Cargar activas (o inactivas si el tab guardado era el de inactivas)
    if (this.selectedTabIndex === 1) {
      this.cargarActivas();
      this.cargarInactivas();
    } else {
      this.cargarActivas();
    }
    
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
  selectedMateria: string = '';
  subscriptionTypes: string[] = [];
  availableMaterias: string[] = [];
  loadingMaterias: boolean = false;
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
  // private useOptimizedService = true; // eliminado — siempre usa el servicio optimizado

  // ========== LAZY LOADING DE DATOS ==========

  /**
   * Carga los tipos de suscripción únicos usando el endpoint dedicado.
   * Evita descargar la lista completa solo para poblar el dropdown.
   */
  private loadSubscriptionTypes(): void {
    this.subscriptionAdminService.getSubscriptionTypes().subscribe({
      next: (types) => {
        this.subscriptionTypes = types;
        console.log(`[SuscripcionesComponent] ${types.length} tipos de suscripción cargados`);
      },
      error: (error: any) => {
        console.error('Error al cargar tipos de suscripción:', error);
      }
    });
  }

  /**
   * Carga SOLO suscripciones activas al inicio (Server-Side Pagination)
   */
  cargarActivas(): void {
    if (this.activasLoaded && !this.searchTerm && !this.selectedSubscriptionType && !this.selectedMateria) {
      return; // Ya cargadas sin filtros
    }

    this.loadingActivas = true;
    
    // Hacer request server-side paginado
    this.subscriptionAdminService.getAllPaginated({
      status: 'ACTIVA',
      search: this.searchTerm,
      type: this.selectedSubscriptionType,
      materia: this.selectedMateria,
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
    if (this.inactivasLoaded && !this.searchTerm && !this.selectedSubscriptionType && !this.selectedMateria) {
      return; // Ya cargadas sin filtros
    }

    this.loadingInactivas = true;
    
    // Hacer request server-side paginado
    this.subscriptionAdminService.getAllPaginated({
      status: 'INACTIVA',
      search: this.searchTerm,
      type: this.selectedSubscriptionType,
      materia: this.selectedMateria,
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

    // Al cambiar el tipo, recargar materias y resetear selección de materia
    if (this.selectedSubscriptionType) {
      this.loadMateriasForType(this.selectedSubscriptionType);
    } else {
      this.availableMaterias = [];
      this.selectedMateria = '';
    }

    this.applyFilters();
  }

  /**
   * Handler para cambio en el dropdown de materia
   */
  onMateriaChange(): void {
    this.pageIndexActivas = 0;
    this.pageIndexInactivas = 0;
    this.applyFilters();
  }

  /**
   * Carga las materias disponibles para el tipo de suscripción seleccionado
   */
  private loadMateriasForType(typeName: string): void {
    this.loadingMaterias = true;
    this.selectedMateria = '';
    this.subscriptionAdminService.getMateriasByTypeName(typeName).subscribe({
      next: (materias) => {
        this.availableMaterias = materias;
        this.loadingMaterias = false;
      },
      error: () => {
        this.availableMaterias = [];
        this.loadingMaterias = false;
      }
    });
  }

  /**
   * Aplica búsqueda y filtros con server-side request
   */
  applyFilters(): void {
    // Resetear índices de página
    this.pageIndexActivas = 0;
    this.pageIndexInactivas = 0;
    
    // Siempre recargar activas
    this.activasLoaded = false;
    this.cargarActivas();

    // Recargar inactivas si hay algún filtro activo o si ya habían sido cargadas (tab visitada)
    if (this.searchTerm || this.selectedSubscriptionType || this.selectedMateria || this.inactivasLoaded) {
      this.inactivasLoaded = false;
      this.cargarInactivas();
    }
  }

  /**
   * Limpia búsqueda y filtros
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedSubscriptionType = '';
    this.selectedMateria = '';
    this.availableMaterias = [];
    sessionStorage.removeItem(this.FILTER_STATE_KEY);
    this.applyFilters();
  }

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

  /**
   * Procesa suscripciones de una página del servidor (Server-Side Pagination)
   * Solo procesa los items de la página actual, no separa en activas/inactivas
   */
  procesarSuscripcionesPaginadas(suscripciones: SuscripcionEnhanced[], targetStatus: 'ACTIVA' | 'INACTIVA'): void {
    const processed = suscripciones.map(suscripcion => ({
      id: suscripcion.id,
      usuario: suscripcion.userName,
      userPhone: suscripcion.userPhone ?? null,
      nombre: suscripcion.subscriptionType,
      materias: this.procesarMaterias(suscripcion.materiasOpcionesJson ?? ''),
      fechaInicio: suscripcion.startDate,
      fechaFin: suscripcion.endDate,
      endDate: suscripcion.endDate,
      status: suscripcion.status,
      subscriptionTypeId: 1, // Default (propiedad no viene en SuscripcionEnhanced)
      subscriptionType: suscripcion.subscriptionType,
      counts: {
        totalPayments: suscripcion.counts?.totalPayments || 0,
        pendingPayments: suscripcion.counts?.pendingPayments || 0,
        overduePayments: suscripcion.counts?.overduePayments || 0,
        // Backend sends "documentsCount"; template reads "totalDocuments" — normalize here
        totalDocuments: suscripcion.counts?.documentsCount ?? suscripcion.counts?.totalDocuments ?? 0
      },
      links: suscripcion.links,
      cancelReason: suscripcion.cancelReason ?? null,
      canceledBy: suscripcion.canceledBy ?? null,
      canceledAt: suscripcion.canceledAt ?? null
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

  /**
   * Guarda el estado de filtros y paginación en sessionStorage antes de navegar.
   */
  private readonly FILTER_STATE_KEY = 'suscripciones_filter_state';

  private saveFilterState(): void {
    const state = {
      searchTerm: this.searchTerm,
      selectedSubscriptionType: this.selectedSubscriptionType,
      selectedMateria: this.selectedMateria,
      availableMaterias: this.availableMaterias,
      selectedTabIndex: this.selectedTabIndex,
      pageIndexActivas: this.pageIndexActivas,
      pageIndexInactivas: this.pageIndexInactivas,
      pageSize: this.pageSize
    };
    sessionStorage.setItem(this.FILTER_STATE_KEY, JSON.stringify(state));
  }

  private restoreFilterState(): void {
    const saved = sessionStorage.getItem(this.FILTER_STATE_KEY);
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      this.searchTerm = state.searchTerm || '';
      this.selectedSubscriptionType = state.selectedSubscriptionType || '';
      this.selectedMateria = state.selectedMateria || '';
      this.availableMaterias = state.availableMaterias || [];
      this.selectedTabIndex = state.selectedTabIndex || 0;
      this.pageIndexActivas = state.pageIndexActivas || 0;
      this.pageIndexInactivas = state.pageIndexInactivas || 0;
      this.pageSize = state.pageSize || 10;
    } catch {
      // ignore corrupt state
    } finally {
      sessionStorage.removeItem(this.FILTER_STATE_KEY);
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
    
    // Guardar filtros antes de salir
    this.saveFilterState();

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
    const suscripcion = this.suscripcionesActivas.find(s => s.id === id)
      || this.suscripcionesInactivas.find(s => s.id === id);

    const dialogData: ActionReasonDialogData = { mode: 'CANCELAR', suscripcionId: id };
    const dialogRef = this.dialog.open(ActionReasonDialogComponent, {
      width: '490px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: ActionReasonDialogResult | undefined) => {
      if (result) {
        this.ejecutarCancelacion(id, result.reason);
      }
    });
  }

  ejecutarCancelacion(id: number, reason: string): void {
    this.subscriptionAdminService.cancelarSuscripcion(id, reason).subscribe({
      next: (success) => {
        if (success) {
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

  verPagos(id: number) {
    this.subscriptionAdminService.getPaymentsWithCache(id).subscribe({
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
    const dialogRef = this.dialog.open(PagosDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { pagos: pagos }
    });

    dialogRef.afterClosed().subscribe((modified: boolean) => {
      if (modified) {
        this.recargarDespuesDeAccion();
      }
    });
  }

  activarSuscripcion(id: number, dias: number = 30, reason: string = 'Sin motivo especificado'): void {
    this.subscriptionAdminService.activarSuscripcion(id, dias, reason).subscribe({
      next: (success) => {
        if (success) {
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

  /**
   * Recarga datos después de una acción (cancelar/activar) y mantiene el tab activo.
   */
  private recargarDespuesDeAccion(): void {
    this.activasLoaded = false;
    this.inactivasLoaded = false;
    if (this.selectedTabIndex === 0) {
      this.cargarActivas();
    } else {
      this.cargarInactivas();
    }
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
    
    const dialogData: ActionReasonDialogData = {
      mode: 'ACTIVAR',
      suscripcionId: id,
      endDate: suscripcion.endDate,
      status: suscripcion.status
    };

    const dialogRef = this.dialog.open(ActionReasonDialogComponent, {
      width: '490px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: ActionReasonDialogResult | undefined) => {
      if (result !== undefined) {
        this.activarSuscripcion(id, result.dias ?? 0, result.reason);
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

  verHistorialAcciones(id: number): void {
    const suscripcion = this.suscripcionesActivas.find(s => s.id === id)
      || this.suscripcionesInactivas.find(s => s.id === id);
    const isMobile = window.innerWidth <= 768;
    this.dialog.open(ActionLogDialogComponent, {
      width: isMobile ? '100vw' : '640px',
      maxWidth: isMobile ? '100vw' : '95vw',
      maxHeight: isMobile ? '90dvh' : '80vh',
      data: { subscriptionId: id, userName: suscripcion?.userName } as ActionLogDialogData
    });
  }

  verDocumentos(suscripcion: any): void {
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
        this.mostrarDialogoDocumentos(suscripcion, {});
        this.mostrarMensaje('Error al cargar los documentos de la suscripción', 'error');
      }
    });
  }

  verDetalle(suscripcion: any): void {
    this.subscriptionAdminService.getSubscriptionDetails(suscripcion.id).subscribe({
      next: (details) => {
        const isMobile = window.innerWidth <= 768;
        const dialogRef = this.dialog.open(DetalleDialogComponent, {
          width: isMobile ? '100vw' : '700px',
          maxWidth: isMobile ? '100vw' : '95vw',
          maxHeight: isMobile ? '92dvh' : '90vh',
          data: { suscripcion, details },
          panelClass: 'detalle-dialog-panel',
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result?.action === 'pagos') {
            this.verPagos(result.id);
          } else if (result?.action === 'documentos') {
            this.verDocumentos(result.suscripcion);
          } else if (result?.action === 'historial') {
            this.verHistorialAcciones(result.id);
          }
        });
      },
      error: () => {
        this.mostrarMensaje('Error al cargar el detalle de la suscripci\u00f3n', 'error');
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
