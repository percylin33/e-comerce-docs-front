import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  SubscriptionTypesData,
  SubscriptionType,
  MembresiaCard,
  NivelEducativo
} from '../../@core/data/subscription-types';

@Component({
  selector: 'ngx-membresia',
  templateUrl: './membresia.component.html',
  styleUrls: ['./membresia.component.scss']
})
export class MembresiaComponent implements OnInit {

  // Estado de carga y errores
  isLoading = false;
  error: string | null = null;

  // Datos dinámicos desde el backend
  todasMembresias: MembresiaCard[] = [];
  membresias: MembresiaCard[] = []; // Filtradas por nivel

  // Nivel educativo seleccionado
  nivelSeleccionado: NivelEducativo = 'INICIAL';
  nivelesDisponibles: NivelEducativo[] = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];

  constructor(
    private router: Router,
    private subscriptionService: SubscriptionTypesData
  ) { }

  ngOnInit(): void {
    this.loadMembresias();
  }

  /**
   * Cargar membresías desde el backend
   */
  loadMembresias(): void {
    this.isLoading = true;
    this.error = null;

    this.subscriptionService.getAllActive().subscribe({
      next: (data: SubscriptionType[]) => {
        if (!data || !Array.isArray(data)) {
          this.error = 'Formato de respuesta inválido del servidor.';
          this.isLoading = false;
          return;
        }

        this.todasMembresias = this.mapToCards(data);
        this.filterByNivel(this.nivelSeleccionado);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando membresías:', err);
        this.error = 'Lo sentimos, no podemos cargar las membresías en este momento. Por favor, intenta de nuevo más tarde.';
        this.todasMembresias = [];
        this.membresias = [];
        this.isLoading = false;
      }
    });
  }

  /**
   * Cambiar nivel educativo
   */
  onNivelChange(nivel: NivelEducativo): void {
    this.nivelSeleccionado = nivel;
    this.filterByNivel(nivel);
  }

  /**
   * Filtrar membresías por nivel
   */
  private filterByNivel(nivel: NivelEducativo): void {
    this.membresias = this.todasMembresias.filter(m =>
      m.nivel === nivel || m.nivel === 'TODOS'
    );
  }

  /**
   * Mapear respuesta del backend a tarjetas de membresía
   */
  private mapToCards(data: SubscriptionType[]): MembresiaCard[] {
    return data
      .map(item => ({
        id: item.id,
        titulo: item.nombre,
        descuento: item.textoDescuento || '',
        precio: item.textoPrecio || '',
        descripcion: item.notaPrecio || item.descripcion,
        isRecommended: item.esRecomendada,
        popular: item.esPopular,
        nivel: item.nivel,
        colorBadge: item.colorBadge,
        beneficios: item.beneficiosGenerales || [],
        esVersionHistorica: false,
        tieneUnidadesVigentes: item.tieneUnidadesVigentes,
        posicion: item.posicion,
        permiteCuotas: item.tipoPeriodo === 'A'
      } as MembresiaCard))
      .sort((a, b) => (a.posicion || 0) - (b.posicion || 0));
  }

  trackByMembresiaId(_: number, membresia: MembresiaCard): number {
    return membresia.id;
  }

  onViewBenefits(membresia: MembresiaCard): void {
    this.router.navigate(['/site/membresia-detail', membresia.id], {
      queryParams: { tipo: 'vigente' }
    });
  }

  hasUnidadesVigentes(membresia: MembresiaCard): boolean {
    return membresia.tieneUnidadesVigentes || false;
  }

  getMensajeDisponibilidad(membresia: MembresiaCard): string {
    return this.hasUnidadesVigentes(membresia)
      ? 'Ver Beneficios Completos'
      : 'No hay unidades vigentes';
  }
}
