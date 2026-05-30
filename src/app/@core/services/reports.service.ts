import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ReportsApi, PromotorReportData } from '../backend/api/reports.api';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private reportsApi = inject(ReportsApi);


  /**
   * Get report data
   */
  getReportData(userId: number, desde: string, hasta: string): Observable<PromotorReportData> {
    return this.reportsApi.getReportData(userId, desde, hasta).pipe(
      map((response: any) => {
        const data = response?.data || null;
        return data;
      })
    );
  }

  /**
   * Generate HTML report that can be printed as PDF
   */
  generateHTMLReport(reportData: PromotorReportData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte de Ventas - ${reportData.cuponCodigo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; background: #f5f7fa; }
    .report-container { max-width: 1000px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 20px; }
    .header h1 { color: #2c3e50; font-size: 28px; margin-bottom: 10px; }
    .info-section { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .info-item { font-size: 14px; color: #7f8c8d; }
    .info-item strong { color: #2c3e50; }
    .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
    .summary-card { padding: 20px; border-radius: 8px; text-align: center; color: white; }
    .summary-card.ventas { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .summary-card.recaudado { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .summary-card.comisiones { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    .summary-card p { font-size: 12px; margin-bottom: 5px; opacity: 0.9; }
    .summary-card h2 { font-size: 24px; font-weight: 700; }
    .section-title { font-size: 18px; color: #2c3e50; margin-bottom: 15px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    table thead { background: #667eea; color: white; }
    table th, table td { padding: 12px; text-align: left; border-bottom: 1px solid #ecf0f1; font-size: 13px; }
    table tbody tr:hover { background: #f8f9fa; }
    table .amount { text-align: right; font-weight: 600; color: #27ae60; }
    .footer { text-align: center; color: #95a5a6; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ecf0f1; }
    @media print {
      body { background: white; padding: 0; }
      .report-container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <h1>Reporte de Ventas</h1>
    </div>
    
    <div class="info-section">
      <div class="info-item"><strong>Promotor:</strong> ${reportData.promotorNombre}</div>
      <div class="info-item"><strong>Email:</strong> ${reportData.promotorEmail}</div>
      <div class="info-item"><strong>Cupón:</strong> ${reportData.cuponCodigo}</div>
      <div class="info-item"><strong>Período:</strong> ${reportData.periodoDesde} - ${reportData.periodoHasta}</div>
    </div>
    
    <div class="summary-cards">
      <div class="summary-card ventas">
        <p>Total Ventas</p>
        <h2>${reportData.totalVentas}</h2>
      </div>
      <div class="summary-card recaudado">
        <p>Total Recaudado</p>
        <h2>S/ ${reportData.totalRecaudado.toFixed(2)}</h2>
      </div>
      <div class="summary-card comisiones">
        <p>Mis Comisiones</p>
        <h2>S/ ${reportData.totalComisiones.toFixed(2)}</h2>
      </div>
    </div>
    
    ${reportData.estadisticasMensuales && reportData.estadisticasMensuales.length > 0 ? `
    <div class="section-title">Estadísticas Mensuales</div>
    <table>
      <thead>
        <tr>
          <th>Mes</th>
          <th style="text-align: center;">Cantidad</th>
          <th style="text-align: right;">Total Ventas</th>
          <th style="text-align: right;">Total Comisiones</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.estadisticasMensuales.map(e => `
        <tr>
          <td>${e.mes}</td>
          <td style="text-align: center;">${e.cantidadVentas}</td>
          <td class="amount">S/ ${e.totalVentas.toFixed(2)}</td>
          <td class="amount">S/ ${e.totalComisiones.toFixed(2)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}
    
    ${reportData.ventas && reportData.ventas.length > 0 ? `
    <div class="section-title">Detalle de Ventas</div>
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Cliente</th>
          <th>Documento</th>
          <th style="text-align: right;">Monto</th>
          <th style="text-align: right;">Comisión</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.ventas.map(v => `
        <tr>
          <td>${v.fecha}</td>
          <td>${v.cliente}</td>
          <td>${v.documento}</td>
          <td class="amount">S/ ${v.monto.toFixed(2)}</td>
          <td class="amount">S/ ${v.comision.toFixed(2)}</td>
          <td>${v.estado}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}
    
    <div class="footer">
      <p>Reporte generado el ${new Date().toLocaleString('es-PE')}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Open report in new window for printing/PDF
   */
  printReport(reportData: PromotorReportData): void {
    const html = this.generateHTMLReport(reportData);
    
    // Método 1: Intentar abrir en nueva ventana
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      // Método 2: Si falla (popup bloqueado), crear iframe oculto
      console.warn('⚠️ Popup bloqueado, usando método alternativo (iframe)');
      this.printUsingIframe(html);
    }
  }

  /**
   * Alternative method using hidden iframe when popup is blocked
   */
  private printUsingIframe(html: string): void {
    
    // Crear iframe oculto
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
      
      // Esperar a que se cargue el contenido y luego imprimir
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Remover iframe después de imprimir
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    } else {
      console.error('❌ No se pudo crear el documento del iframe');
    }
  }
}
