import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Payment, PaymentData } from '../../@core/interfaces/payments';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { GraphicsData } from '../../@core/interfaces/graphics';
import { NbSidebarService } from '@nebular/theme';

@Component({
  selector: 'ngx-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss']
})
export class InvoicesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  chartSidebarState: string = 'collapsed';

  constructor(
              private payments: PaymentData,
              private graphicsService: GraphicsData,
              private sidebarService: NbSidebarService
  ) { }

  paymentsList: Payment[];
  dataSource: MatTableDataSource<Payment> = new MatTableDataSource<Payment>();
  totalItems: number = 0; // Total de elementos disponibles
  currentPage: number = 1;
  pageSize: number = 6;

  // Agregar propiedades para el gráfico
  chartData: number[] = [];
  chartLabels: string[] = [];

  // Agregar propiedades para ambos gráficos
  monthlyChartData: number[] = [];
  monthlyChartLabels: string[] = [];

  structTable = [
    {
      title: "Usuario",
      column: "firstName",
    },
    {
      title: "Email",
      column: "email",
    },
    {
      title: "Montos",
      column: "amount",
    },
    {
      title: "Fecha",
      column: "paymentDate",
    },
    {
      title: "Estado",
      column: "state",
    },
  ]

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
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

  getPayments(pagina: number, cantElementos: number): void {
    this.payments.getPayments(pagina, cantElementos).subscribe((data) => {
      this.paymentsList = data.data;
      this.totalItems = data.pagination.cantidadDeDocumentos;
      this.dataSource.data = this.paymentsList;
      this.paginator.length = this.totalItems;
      this.paginator.pageIndex = data.pagination.paginaActual - 1;

      // Procesar datos para el gráfico
      this.processChartData();
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
          amount: current.amount + payment.amount
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
}
