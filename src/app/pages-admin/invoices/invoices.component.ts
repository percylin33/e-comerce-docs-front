import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { Payment, PaymentData } from '../../@core/interfaces/payments';
import { MatPaginator } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { GraphicsData } from '../../@core/interfaces/graphics';
import { NbSidebarService, NbToastrService, NbPopoverModule, NbIconModule, NbSpinnerModule, NbSidebarModule } from '@nebular/theme';
import { MatDialog } from '@angular/material/dialog';
import { PaymentDocumentsModalComponent } from '../../shared/component/payment-documents-modal/payment-documents-modal.component';
import { PaymentService } from '../../@core/backend/services/payment.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { PaymentsTableComponent } from './payments-table/payments-table.component';
import { DynamicChartComponent } from '../../shared/component/dynamic-chart/dynamic-chart.component';

@Component({
    selector: 'ngx-invoices',
    templateUrl: './invoices.component.html',
    styleUrls: ['./invoices.component.scss'],
    standalone: true,
    imports: [NbPopoverModule, NbIconModule, NbSpinnerModule, PaymentsTableComponent, MatPaginator, NbSidebarModule, DynamicChartComponent]
})
export class InvoicesComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  chartSidebarState: string = 'collapsed';

  // Ordenamiento
  currentSortBy: string = 'paymentDate';
  currentSortDirection: string = 'DESC';
  loading: boolean = false;

  // Búsqueda y filtro de estado
  searchTerm: string = '';
  currentStatus: string = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  readonly statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'PAGADO', label: 'Pagado' },
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'VENCIDO', label: 'Vencido' },
  ];

  constructor(
              private payments: PaymentData,
              private graphicsService: GraphicsData,
              private sidebarService: NbSidebarService,
              private dialog: MatDialog,
              private toastr: NbToastrService,
              private paymentService: PaymentService
  ) { }

  paymentsList: Payment[] = [];
  totalItems: number = 0;
  currentPage: number = 1;
  pageSize: number = 6;

  // Gráfico
  chartData: number[] = [];
  chartLabels: string[] = [];

  // Gráfico mensual
  monthlyChartData: number[] = [];
  monthlyChartLabels: string[] = [];

  ngOnInit(): void {
    // Debounce de búsqueda: esperar 400 ms, ignorar repetidos
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.getPayments(this.currentPage, this.pageSize);
    });

    this.getPayments(this.currentPage, this.pageSize);

    // Obtener datos para los gráficos
    this.graphicsService.getGraphics().subscribe((response) => {
      // Crear array de los últimos 5 meses (2 antes, actual, 2 después)
      const today = new Date();
      const months = [];
      const salesData = [];

      // Generar los últimos 5 meses
      for (let i = -2; i <= 2; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        months.push(monthYear);

        // Buscar si hay datos para este mes
        const monthData = response.data.dataPayment.find(
          item => item.month === (date.getMonth() + 1) && item.year === date.getFullYear()
        );

        // Si hay datos usar el valor, si no hay usar 0
        salesData.push(monthData ? monthData.salesCount : 0);
      }

      this.monthlyChartData = salesData;
      this.monthlyChartLabels = months;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getPayments(pagina: number, cantElementos: number): void {
    // Solo poner loading si no estamos en la primera carga (para evitar parpadeo si es muy rápida) o si se requiere
    this.loading = true;
    
    this.paymentService.getPayments(pagina, cantElementos, this.currentSortBy, this.currentSortDirection, true, this.searchTerm || undefined, this.currentStatus || undefined).subscribe({
      next: (data) => {
        this.loading = false;
        // Normalize backend response: `data.data` can be an array OR an object
        // containing multiple arrays (e.g., { subscriptions: [...], documents: [...] }).
        let normalized: any[] = [];

        if (Array.isArray(data.data)) {
          normalized = data.data;
        } else if (data.data && typeof data.data === 'object') {
          // concat all array values found inside data.data in a stable order
          for (const v of Object.values(data.data)) {
            if (Array.isArray(v)) normalized = normalized.concat(v as any[]);
          }
        }

        this.paymentsList = normalized;
        this.totalItems = data.pagination.cantidadDeDocumentos;
        this.paginator.length = this.totalItems;
        this.paginator.pageIndex = data.pagination.paginaActual - 1;

        // Procesar datos para el gráfico
        this.processChartData();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading payments:', err);
        this.toastr.danger('Error al cargar pagos', 'Error');
      }
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getPayments(this.currentPage, this.pageSize);
  }

  private processChartData(): void {
    const dailyTotals = new Map<string, {count: number, amount: number}>();

    // Obtener fecha actual y fecha 30 días atrás
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.paymentsList.forEach(payment => {
      const date = new Date(payment.paymentDate);
      // Solo procesar pagos de los últimos 30 días
      if (date >= thirtyDaysAgo) {
        const dayMonthYear = date.toLocaleDateString('es-PE', {
          day: '2-digit',
          month: '2-digit',
        });

        const current = dailyTotals.get(dayMonthYear) || { count: 0, amount: 0 };
        dailyTotals.set(dayMonthYear, {
          count: current.count + 1,  // Incrementamos el contador
          amount: current.amount + Number(payment.amount || 0)
        });
      }
    });

    // Convertir y ordenar por fecha
    const sortedEntries = Array.from(dailyTotals.entries())
      .sort((a, b) => {
        const [dayA, monthA] = a[0].split('/').map(Number);
        const [dayB, monthB] = b[0].split('/').map(Number);
        return monthA === monthB ? dayA - dayB : monthA - monthB;
      });

    this.chartLabels = sortedEntries.map(([date]) => date);
    // Puedes elegir mostrar el conteo (count) o el monto (amount)
    this.chartData = sortedEntries.map(([, data]) => data.count); // Cambia a data.amount si prefieres ver montos
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Cerrar el sidebar si se hace clic fuera de él
    const sidebar = document.querySelector('.chart-sidebar');
    const button = document.querySelector('.chart-toggle-btn');

    if (sidebar && button &&
        !sidebar.contains(event.target as Node) &&
        !button.contains(event.target as Node)) {
      this.closeSidebar();
    }
  }

  toggleChartSidebar() {
    this.chartSidebarState = this.chartSidebarState === 'expanded' ? 'collapsed' : 'expanded';
    this.sidebarService.toggle(true, 'chart-sidebar');

    // Añadir/remover clase para el overlay
    if (this.chartSidebarState === 'expanded') {
      document.body.classList.add('sidebar-overlay');
    } else {
      document.body.classList.remove('sidebar-overlay');
    }
  }

  closeSidebar() {
    this.chartSidebarState = 'collapsed';
    this.sidebarService.collapse('chart-sidebar');
    document.body.classList.remove('sidebar-overlay');
  }

  /**
   * Maneja el cambio de ordenamiento desde la tabla
   */
  onSortChange(sortEvent: Sort): void {
    if (sortEvent.active && sortEvent.direction) {
      const fieldMapping: { [key: string]: string } = {
        'firstName': 'name',
        'email': 'email',
        'paymentDate': 'paymentDate',
        'state': 'paymentStatus'
      };

      this.currentSortBy = fieldMapping[sortEvent.active] || sortEvent.active;
      this.currentSortDirection = sortEvent.direction.toUpperCase();
      this.currentPage = 1;
      this.getPayments(this.currentPage, this.pageSize);
    }
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
  }

  onStatusChange(status: string): void {
    this.currentStatus = status;
    this.currentPage = 1;
    this.getPayments(this.currentPage, this.pageSize);
  }

  showPaymentDetails(paymentId: string): void {
    const paymentInfo = this.paymentsList.find(p => p.paymentId === paymentId);

    // Verificar si el usuario es SUPADMIN
    let isSupAdmin = false;
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        isSupAdmin = userData.roles && userData.roles.includes('SUPADMIN');
      }
    } catch (e) { }

    // 1. Open Modal Immediately with Loading State
    const dialogRef = this.dialog.open(PaymentDocumentsModalComponent, {
      width: '90%',
      maxWidth: '1000px',
      maxHeight: '80vh',
      position: { top: '80px' },
      data: {
        paymentDetails: {} as any, // Empty Initially
        paymentInfo: paymentInfo,
        isLoading: true,
        isSupAdmin: isSupAdmin
      },
      disableClose: false,
      autoFocus: false
    });

    // 2. Fetch Data
    this.paymentService.getPaymentDocuments(paymentId).subscribe({
      next: (response) => {
        if (response.result && response.data) {
          // 3. Update Modal with Data
          dialogRef.componentInstance.updateData({
            paymentDetails: response.data,
            paymentInfo: paymentInfo
          });
        } else {
          this.toastr.warning('No se encontraron detalles para este pago', 'Sin información');
          dialogRef.close();
        }
      },
      error: (error) => {
        console.error('Error loading payment details:', error);
        this.toastr.danger('Error al cargar los detalles del pago', 'Error');
        dialogRef.close();
      }
    });

  }
}
