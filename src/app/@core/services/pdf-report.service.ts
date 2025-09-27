import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as Chart from 'chart.js';

export interface ReportData {
  promotor: any;
  ventas: any[];
  totalPagado: number;
  totalDeuda: number;
  fechaReporte: Date;
  fechasVentas: Date[];
  paymentId: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfReportService {

  constructor() {}

  async generarReportePago(data: ReportData): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Configuración del PDF
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = 15;

    try {
      // 1. Agregar encabezado con estilo de la plantilla
      currentY = await this.agregarEncabezadoConPlantilla(pdf, pageWidth, currentY);
      
      // 2. Agregar información del pago en formato organizado
      currentY = this.agregarInformacionPagoOrganizada(pdf, data, pageWidth, currentY);
      
      // 3. Agregar tabla de ventas
      currentY = this.agregarTablaVentas(pdf, data, pageWidth, currentY);
      
      // 4. Generar y agregar gráficos en nueva página si es necesario
      if (currentY > pageHeight - 80) {
        pdf.addPage();
        currentY = 20;
      }
      
      const graficos = await this.generarGraficos(data);
      currentY = await this.agregarGraficos(pdf, graficos, pageWidth, currentY);

      // 5. Agregar resumen financiero organizado
      if (currentY > pageHeight - 60) {
        pdf.addPage();
        currentY = 20;
      }
      currentY = this.agregarResumenFinanciero(pdf, data, pageWidth, currentY);

      // 6. Agregar pie de página con estilo de plantilla
      this.agregarPiePaginaConPlantilla(pdf, pageWidth, pageHeight);

      // 7. Descargar el PDF
      const fileName = `Reporte_Pago_${data.promotor.name.replace(/\s+/g, '_')}_${this.formatearFechaArchivo(data.fechaReporte)}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  }

  private async agregarEncabezadoConPlantilla(pdf: jsPDF, pageWidth: number, y: number): Promise<number> {
    // Fondo azul para el encabezado (similar a la plantilla)
    pdf.setFillColor(63, 81, 181); // Color azul corporativo
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    // Cargar y agregar el logo real a la izquierda
    try {
      const logoImg = await this.cargarImagen('assets/images/LOGOTIPO_OFICIAL.webp');
      // Logo en la esquina izquierda, más pequeño
      pdf.addImage(logoImg, 'PNG', 8, 6, 40, 22);
    } catch (error) {
      // Fallback: usar solo texto sin fondo
      console.warn('No se pudo cargar el logo, usando texto de respaldo:', error);
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LOGOTIPO_OFICIAL', 28, 18, { align: 'center' });
    }

    // Título principal en el centro (evitando superposición con logo y contacto)
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPORTE DE PAGO A PROMOTOR', pageWidth / 2, 16, { align: 'center' });
    
    // Subtítulo en el centro con más separación
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Carpeta Digital - Sistema de Comisiones', pageWidth / 2, 26, { align: 'center' });

    // Información de contacto en la esquina derecha (mejor posicionada)
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Jr. Grau 439 - OF 204', pageWidth - 15, 14, { align: 'right' });
    pdf.text('+ 51 940 098 245', pageWidth - 15, 20, { align: 'right' });
    pdf.text('www.carpetadigital.net', pageWidth - 15, 26, { align: 'right' });

    return 45;
  }

  private async cargarImagen(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // No agregar fondo blanco, mantener transparencia
        ctx.drawImage(img, 0, 0);
        
        // Convertir a PNG para mejor compatibilidad con transparencias en PDF
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  private agregarInformacionPagoOrganizada(pdf: jsPDF, data: ReportData, pageWidth: number, y: number): number {
    // Sección de información del pago con bordes
    pdf.setDrawColor(63, 81, 181);
    pdf.setLineWidth(0.5);
    pdf.rect(15, y, pageWidth - 30, 50);

    // Título de la sección
    pdf.setFillColor(240, 248, 255);
    pdf.rect(15, y, pageWidth - 30, 8, 'F');
    pdf.setFontSize(12);
    pdf.setTextColor(63, 81, 181);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INFORMACIÓN DEL REPORTE DE PAGOS', 20, y + 6);

    // Datos organizados en columnas
    pdf.setFontSize(9);
    pdf.setTextColor(51, 51, 51);
    pdf.setFont('helvetica', 'normal');

    const col1X = 20;
    const col2X = pageWidth / 2 + 10;
    let infoY = y + 15;

    // Columna 1
    pdf.setFont('helvetica', 'bold');
    pdf.text('Promotor:', col1X, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.promotor.name, col1X + 25, infoY);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Email:', col1X, infoY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.promotor.email, col1X + 25, infoY + 6);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Teléfono:', col1X, infoY + 12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.promotor.telefono || 'No especificado', col1X + 25, infoY + 12);

    // Columna 2
    pdf.setFont('helvetica', 'bold');
    pdf.text('Fecha del Reporte:', col2X, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(this.formatearFecha(data.fechaReporte), col2X + 35, infoY);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Total de Ventas:', col2X, infoY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${data.ventas.length} facturas`, col2X + 35, infoY + 6);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Período de Ventas:', col2X, infoY + 12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(this.obtenerPeriodoVentas(data.fechasVentas), col2X + 35, infoY + 12);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Monto Total del Pago:', col2X, infoY + 18);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(220, 53, 69); // Rojo para monto
    pdf.text(`S/ ${data.totalDeuda.toFixed(2)}`, col2X + 35, infoY + 18);

    return y + 60;
  }

  private agregarTablaVentas(pdf: jsPDF, data: ReportData, pageWidth: number, y: number): number {
    // Título de la tabla
    pdf.setFontSize(12);
    pdf.setTextColor(63, 81, 181);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DETALLE DE VENTAS', 20, y);

    y += 10;

    // Configuración de la tabla reordenada (sin columna Monto)
    const tableStartY = y;
    const colWidths = [30, 60, 50, 35]; // Payment ID, Descripción, Fecha (con hora), Estado
    const colX = [20, 50, 110, 160];
    const rowHeight = 8;

    // Encabezados de la tabla
    pdf.setFillColor(63, 81, 181);
    pdf.rect(15, y, pageWidth - 30, rowHeight, 'F');
    
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    
    pdf.text('Payment ID', colX[0], y + 5);
    pdf.text('Descripción', colX[1], y + 5);
    pdf.text('Fecha', colX[2], y + 5);
    pdf.text('Estado', colX[3], y + 5);

    y += rowHeight;

    // Datos de las ventas
    pdf.setTextColor(51, 51, 51);
    pdf.setFont('helvetica', 'normal');

    data.ventas.forEach((venta, index) => {
      // Verificar si necesitamos nueva página
      if (y > 250) {
        pdf.addPage();
        y = 20;
        // Repetir encabezados en nueva página
        pdf.setFillColor(63, 81, 181);
        pdf.rect(15, y, pageWidth - 30, rowHeight, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Payment ID', colX[0], y + 5);
        pdf.text('Descripción', colX[1], y + 5);
        pdf.text('Fecha', colX[2], y + 5);
        pdf.text('Estado', colX[3], y + 5);
        y += rowHeight;
      }

      // Fondo alternado para las filas
      if (index % 2 === 0) {
        pdf.setFillColor(248, 249, 250);
        pdf.rect(15, y, pageWidth - 30, rowHeight, 'F');
      }

      pdf.setFontSize(7);
      pdf.setTextColor(51, 51, 51);

      // Payment ID (truncado si es muy largo)
      const paymentId = venta.idPayment ? (venta.idPayment.length > 15 ? venta.idPayment.substring(0, 12) + '...' : venta.idPayment) : 'N/A';
      pdf.text(paymentId, colX[0], y + 5);

      // Descripción (truncada para dar más espacio)
      const descripcion = venta.name.length > 25 ? venta.name.substring(0, 22) + '...' : venta.name;
      pdf.text(descripcion, colX[1], y + 5);

      // Fecha con hora (formato compacto)
      if (venta.paymentDate) {
        const fechaVenta = new Date(venta.paymentDate);
        const fechaConHora = fechaVenta.toLocaleString('es-PE', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        pdf.text(fechaConHora, colX[2], y + 5);
      } else {
        pdf.text('N/A', colX[2], y + 5);
      }

      // Estado basado en el campo status
      let estadoTexto = '';
      let estadoColor = [51, 51, 51]; // Color por defecto (gris)
      
      if (venta.status === "1") {
        estadoTexto = 'PENDIENTE';
        estadoColor = [255, 193, 7]; // Amarillo
      } else if (venta.status === "2") {
        estadoTexto = 'PAGADO';
        estadoColor = [40, 167, 69]; // Verde
      } else {
        // Mostrar el valor tal como llega si es diferente
        estadoTexto = venta.status ? venta.status.toString() : 'N/A';
        estadoColor = [108, 117, 125]; // Gris
      }
      
      pdf.setTextColor(estadoColor[0], estadoColor[1], estadoColor[2]);
      pdf.text(estadoTexto, colX[3], y + 5);

      pdf.setTextColor(51, 51, 51); // Resetear color
      y += rowHeight;
    });

    // Borde de la tabla
    pdf.setDrawColor(63, 81, 181);
    pdf.setLineWidth(0.5);
    pdf.rect(15, tableStartY, pageWidth - 30, y - tableStartY);

    return y + 10;
  }

  private agregarResumenFinanciero(pdf: jsPDF, data: ReportData, pageWidth: number, y: number): number {
    // Título del resumen
    pdf.setFontSize(12);
    pdf.setTextColor(63, 81, 181);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESUMEN FINANCIERO', 20, y);

    y += 10;

    // Caja de resumen con bordes
    const boxHeight = 40;
    pdf.setDrawColor(63, 81, 181);
    pdf.setLineWidth(0.5);
    pdf.rect(15, y, pageWidth - 30, boxHeight);

    // Fondo del resumen
    pdf.setFillColor(240, 248, 255);
    pdf.rect(15, y, pageWidth - 30, boxHeight, 'F');

    // Datos del resumen en formato organizado
    pdf.setFontSize(10);
    pdf.setTextColor(51, 51, 51);

    const col1X = 25;
    const col2X = pageWidth / 2 + 10;
    let resY = y + 10;

    // Columna 1 - Estadísticas
    pdf.setFont('helvetica', 'bold');
    pdf.text('Documentos Vendidos:', col1X, resY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.ventas.length.toString(), col1X + 50, resY);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Documentos Pagados:', col1X, resY + 7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.ventas.filter(v => v.paidPromotor).length.toString(), col1X + 50, resY + 7);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Documentos Pendientes:', col1X, resY + 14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.ventas.filter(v => !v.paidPromotor).length.toString(), col1X + 50, resY + 14);

    // Columna 2 - Montos
    pdf.setFont('helvetica', 'bold');
    pdf.text('Comisión Acumulada:', col2X, resY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`S/ ${(data.totalPagado + data.totalDeuda).toFixed(2)}`, col2X + 45, resY);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Ya Pagado:', col2X, resY + 7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(40, 167, 69); // Verde
    pdf.text(`S/ ${data.totalPagado.toFixed(2)}`, col2X + 45, resY + 7);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 51, 51);
    pdf.text('Este Pago:', col2X, resY + 14);
    pdf.setFont('helvetica', 'bold'); // Destacar el monto del pago actual
    pdf.setTextColor(220, 53, 69); // Rojo
    pdf.text(`S/ ${data.totalDeuda.toFixed(2)}`, col2X + 45, resY + 14);

    return y + boxHeight + 15;
  }

  private agregarPiePaginaConPlantilla(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    const y = pageHeight - 20;
    
    // Línea separadora
    pdf.setDrawColor(63, 81, 181);
    pdf.setLineWidth(0.5);
    pdf.line(15, y - 5, pageWidth - 15, y - 5);
    
    // Información de la empresa (estilo plantilla)
    pdf.setFontSize(9);
    pdf.setTextColor(63, 81, 181);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CARPETA DIGITAL', pageWidth / 2, y, { align: 'center' });
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(102, 102, 102);
    pdf.text('Jr. Grau 439 - OF 204 - Trujillo, Perú | + 51 940 098 245 | www.carpetadigital.net', pageWidth / 2, y + 5, { align: 'center' });
    
    pdf.text(`Documento generado el ${this.formatearFecha(new Date())}`, pageWidth / 2, y + 10, { align: 'center' });
  }

  private formatearFechaArchivo(fecha: Date): string {
    return fecha.toISOString().slice(0, 10).replace(/-/g, '');
  }

  private agregarResumenVentas(pdf: jsPDF, data: ReportData, pageWidth: number, y: number): number {
    // Este método se mantiene como respaldo, pero se usa agregarResumenFinanciero
    return this.agregarResumenFinanciero(pdf, data, pageWidth, y);
  }

  private agregarPiePagina(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    // Este método se mantiene como respaldo, pero se usa agregarPiePaginaConPlantilla
    this.agregarPiePaginaConPlantilla(pdf, pageWidth, pageHeight);
  }

  private async generarGraficos(data: ReportData): Promise<any[]> {
    const graficos = [];

    try {
      // 1. Gráfico de distribución por fecha (cantidad de ventas)
      const graficoFechas = await this.crearGraficoFechas(data);
      graficos.push(graficoFechas);

      // 2. Gráfico de volumen de ventas por día
      const graficoVolumen = await this.crearGraficoVolumen(data);
      graficos.push(graficoVolumen);

    } catch (error) {
      console.warn('Error generando gráficos:', error);
    }

    return graficos;
  }

  private async crearGraficoEstado(data: ReportData): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');

      // Usar el campo status correcto del API
      const pagadas = data.ventas.filter(v => v.status === "2").length;
      const pendientes = data.ventas.filter(v => v.status === "1").length;
      const otros = data.ventas.filter(v => v.status !== "1" && v.status !== "2").length;

      // Preparar datos y labels dinámicamente
      const chartData = [];
      const chartLabels = [];
      const chartColors = [];

      if (pagadas > 0) {
        chartData.push(pagadas);
        chartLabels.push('Ventas Pagadas');
        chartColors.push('#28a745'); // Verde
      }

      if (pendientes > 0) {
        chartData.push(pendientes);
        chartLabels.push('Ventas Pendientes');
        chartColors.push('#ffc107'); // Amarillo
      }

      if (otros > 0) {
        chartData.push(otros);
        chartLabels.push('Otros Estados');
        chartColors.push('#6c757d'); // Gris
      }

      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: chartLabels,
          datasets: [{
            data: chartData,
            backgroundColor: chartColors,
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: false,
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Estado de las Ventas'
          }
        }
      });

      setTimeout(() => {
        resolve(canvas.toDataURL('image/png'));
      }, 500);
    });
  }

  private async crearGraficoFechas(data: ReportData): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');

      // Agrupar ventas por fecha (solo cantidades, no precios)
      const ventasPorFecha = this.agruparVentasPorFecha(data.ventas);
      const fechas = Object.keys(ventasPorFecha);
      const cantidades = Object.values(ventasPorFecha);

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: fechas,
          datasets: [{
            label: 'Cantidad de Ventas',
            data: cantidades,
            backgroundColor: '#007bff',
            borderColor: '#0056b3',
            borderWidth: 1
          }]
        },
        options: {
          responsive: false,
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true,
                stepSize: 1
              }
            }]
          },
          title: {
            display: true,
            text: 'Distribución de Ventas por Fecha'
          }
        }
      });

      setTimeout(() => {
        resolve(canvas.toDataURL('image/png'));
      }, 500);
    });
  }

  private async crearGraficoVolumen(data: ReportData): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');

      // Mostrar solo tendencia de volumen sin valores específicos
      const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const ventasPorDia = this.agruparVentasPorDiaSemana(data.ventas);

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: diasSemana,
          datasets: [{
            label: 'Tendencia de Ventas',
            data: ventasPorDia,
            fill: false,
            borderColor: '#28a745',
            backgroundColor: '#28a745',
            tension: 0.1
          }]
        },
        options: {
          responsive: false,
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true,
                stepSize: 1
              }
            }]
          },
          title: {
            display: true,
            text: 'Tendencia de Ventas por Día de la Semana'
          }
        }
      });

      setTimeout(() => {
        resolve(canvas.toDataURL('image/png'));
      }, 500);
    });
  }

  private async agregarGraficos(pdf: jsPDF, graficos: string[], pageWidth: number, y: number): Promise<number> {
    let currentY = y;

    pdf.setFontSize(14);
    pdf.setTextColor(63, 81, 181);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ANÁLISIS GRÁFICO DE VENTAS', 20, currentY);
    currentY += 20;

    for (let i = 0; i < graficos.length; i++) {
      const grafico = graficos[i];
      if (grafico) {
        // Verificar si hay espacio suficiente en la página
        if (currentY + 80 > pdf.internal.pageSize.getHeight() - 30) {
          pdf.addPage();
          currentY = 20;
        }

        // Gráficos más grandes y mejor centrados
        const imgWidth = 120;  // Aumentado de 80 a 120
        const imgHeight = 60;  // Aumentado de 40 a 60
        const x = (pageWidth - imgWidth) / 2;
        
        // Agregar un marco sutil alrededor del gráfico
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.rect(x - 2, currentY - 2, imgWidth + 4, imgHeight + 4);
        
        pdf.addImage(grafico, 'PNG', x, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 20; // Más espacio entre gráficos
      }
    }

    return currentY;
  }

  // Métodos auxiliares
  private formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatearFechaSolo(fecha: Date): string {
    return fecha.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  private obtenerPeriodoVentas(fechas: Date[]): string {
    if (!fechas || fechas.length === 0) return 'No especificado';
    
    const fechasOrdenadas = fechas.sort((a, b) => a.getTime() - b.getTime());
    const primera = fechasOrdenadas[0];
    const ultima = fechasOrdenadas[fechasOrdenadas.length - 1];
    
    if (primera.toDateString() === ultima.toDateString()) {
      return this.formatearFechaSolo(primera);
    }
    
    return `${this.formatearFechaSolo(primera)} - ${this.formatearFechaSolo(ultima)}`;
  }

  private agruparVentasPorFecha(ventas: any[]): { [key: string]: number } {
    const agrupadas: { [key: string]: number } = {};
    
    ventas.forEach(venta => {
      const fecha = new Date(venta.paymentDate || Date.now());
      const fechaStr = fecha.toLocaleDateString('es-PE');
      agrupadas[fechaStr] = (agrupadas[fechaStr] || 0) + 1;
    });
    
    return agrupadas;
  }

  private agruparVentasPorDiaSemana(ventas: any[]): number[] {
    const ventasPorDia = [0, 0, 0, 0, 0, 0, 0]; // Lun-Dom
    
    ventas.forEach(venta => {
      const fecha = new Date(venta.paymentDate || Date.now());
      const dia = fecha.getDay();
      const diaIndex = dia === 0 ? 6 : dia - 1; // Convertir domingo (0) a índice 6
      ventasPorDia[diaIndex]++;
    });
    
    return ventasPorDia;
  }
}