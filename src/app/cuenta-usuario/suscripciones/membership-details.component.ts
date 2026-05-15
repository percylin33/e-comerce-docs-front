import { Component, Input, OnChanges } from '@angular/core';

@Component({
    selector: 'ngx-membership-details',
    template: `
    <div class="membership-details-container">
      <!-- Header con título y período de vigencia -->
      <div class="details-header">
        <div class="header-icon">📋</div>
        <div class="header-content">
          <h4>{{ details.subscriptionType }}</h4>
          <p class="header-subtitle">Desde {{ formatDate(details.fechaInicio) }} hasta {{ formatDate(details.fechaFin) }}</p>
        </div>
        <div class="status-indicator" [class]="getStatusClass(details.estado)">
          <span class="status-dot"></span>
          {{ details.estado || 'SIN ESTADO' }}
        </div>
      </div>
    
      <!-- Materias y Grados -->
      @if (parsedMaterias) {
        <div class="detail-card subjects-info">
          <div class="card-header">
            <div class="card-icon">📚</div>
            <h5>Materias y Grados</h5>
          </div>
          <div class="card-content">
            <div class="subjects-grid">
              @for (materia of parsedMaterias; track materia) {
                <div class="subject-item">
                  <div class="subject-name">
                    <span class="subject-icon">📖</span>
                    {{ materia.nombre || materia.materia }}
                  </div>
                  <div class="subject-grades">
                    @for (grado of materia.grados; track grado) {
                      <span class="grade-tag">
                        {{ grado }}
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
    `,
    styles: [`
    .membership-details-container {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 20px;
      padding: 2rem;
      margin-top: 1.5rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }

    .details-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .header-icon {
      font-size: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .header-content h4 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
      color: #1a202c;
      background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-subtitle {
      margin: 0.5rem 0 0 0;
      color: #718096;
      font-size: 0.95rem;
      font-weight: 500;
    }

    .status-indicator {
      margin-left: auto;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 2px solid;
    }

    .status-indicator.ACTIVA {
      background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
      color: white;
      border-color: #48bb78;
    }

    .status-indicator.INACTIVA,
    .status-indicator.VENCIDA {
      background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
      color: white;
      border-color: #f56565;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .detail-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      border: 1px solid #f1f5f9;
      transition: all 0.3s ease;
    }

    .detail-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .card-icon {
      font-size: 1.5rem;
      background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
      border-radius: 10px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-header h5 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #2d3748;
    }

    .subjects-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .subject-item {
      background: #f8fafc;
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid #e2e8f0;
    }

    .subject-name {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 0.5rem;
    }

    .subject-icon {
      font-size: 1.2rem;
    }

    .subject-grades {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .grade-tag {
      background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 600;
    }
  `],
    standalone: true
})
export class MembershipDetailsComponent implements OnChanges {
  @Input() details: any = null;

  parsedMaterias: any = null;

  ngOnChanges() {
    if (this.details?.materiasOpcionesJson) {
      this.parsedMaterias = this.parseMaterias(this.details.materiasOpcionesJson);
    }
  }

  parseMaterias(jsonStr: string) {
    try {
      const materias = JSON.parse(jsonStr);
      return Object.keys(materias).map((key) => ({
        materia: key,
        grados: materias[key]
      }));
    } catch {
      return null;
    }
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return date.toString();
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVA': return 'ACTIVA';
      case 'INACTIVA':
      case 'VENCIDA': return 'INACTIVA';
      default: return '';
    }
  }
}
