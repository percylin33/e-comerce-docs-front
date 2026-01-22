import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  SubscriptionTypesData,
  SubscriptionType,
  MembresiaCard,
  NivelEducativo
} from '../../@core/data/subscription-types';
import { forkJoin } from 'rxjs';

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

  // Datos estáticos de respaldo (fallback)
  membresiasFallback: MembresiaCard[] = [
    {
      id: 1,
      titulo: 'Membresía Mensual Inicial',
      descuento: 'Ahora 28% de descuento',
      precio: 'Desde S/.45/mes*',
      descripcion: 'Los precios varían según el número de grados',
      isRecommended: false,
      popular: false,
      nivel: 'INICIAL',
      beneficios: [
        '2 proyectos de aprendizaje',
        'Sesiones de aprendizaje estructuradas',
        'Soporte por chat en horario laboral',
        'Fichas de aprendizaje personalizadas',
        'Talleres educativos mensuales',
        'Planificadores por proyecto',
        'Instrumentos de evaluación básicos',
        'Kit de recursos (De acuerdo a la situación significativa)'
      ]
    },
    // {
    //   id: 2,
    //   titulo: 'Membresía Mensual Primaria',
    //   descuento: 'Ahora 28% de descuento',
    //   precio: 'Desde S/.50/mes*',
    //   descripcion: 'Los precios varían según el número de grados',
    //   isRecommended: true,
    //   popular: true,
    //   beneficios: [
    //     'Programación anual completa',
    //     '1 Unidad de aprendizaje detallada',
    //     '9 Sesiones de aprendizaje por semana',
    //     '9 Fichas de aprendizaje para cada sesión',
    //     '9 Instrumentos de evaluación especializados',
    //     'Secuencia de sesiones optimizada',
    //     'Kit de recursos didácticos premium',
    //     'Asesoría gratuita: Acceso a un grupo privado de WhatsApp',
    //     'Soporte prioritario'
    //   ]
    // },
    {
      id: 3,
      titulo: 'Membresía Mensual Secundaria',
      descuento: 'Ahora 10% de descuento',
      precio: 'Desde S/.32/mes*',
      descripcion: 'Los precios varían según el curso y el número de grados',
      isRecommended: false,
      popular: false,
      nivel: 'SECUNDARIA',
      beneficios: [
        '1 Programación anual especializada',
        '1 Unidad de aprendizaje por curso',
        'Soporte telefónico y por chat',
        '8 Sesiones de aprendizaje estructuradas',
        '8 Fichas de aprendizaje temáticas',
        '8 Instrumentos de evaluación avanzados',
        '1 Planificador de la unidad',
        'Recursos didácticos por situación significativa',
        'Seguimiento personalizado'
      ]
    },
    {
      id: 4,
      titulo: 'Membresía Anual Secundaria',
      descuento: 'Ahora 15% de descuento',
      precio: 'Desde S/.250/anual*',
      descripcion: 'Los precios varían según el curso y el número de grados',
      isRecommended: false,
      popular: false,
      nivel: 'SECUNDARIA',
      beneficios: [
        'Planificación completa de las 8 Unidades',
        'Programación anual personalizada',
        'Unidades de aprendizaje detalladas',
        'Sesiones de aprendizaje interactivas',
        'Fichas de aplicación práctica',
        'Instrumentos de evaluación completos',
        'Planificadores de la unidad',
        'Kit de Evaluación diagnóstica',
        'Kit de conclusiones descriptivas',
        'Kit de informes finales',
        'Rúbricas por competencia',
        'Kit de recursos para cada unidad',
        'Carpeta pedagógica completa',
        'Recursos para el día del logro',
        'Un kit de simulacros',
        'Registros de evaluación',
        'Registros de asistencia',
        'Agenda personalizada',
        'Acceso a grupo privado de WhatsApp',
        'Mentoría mensual con el especialista',
        'Sorteo de Gifcard por el día del maestro',
        '2 Medias becas para talleres',
        'Soporte premium 24/7'
      ]
    }
  ];

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
          console.error('❌ La respuesta no es un array válido:', data);
          throw new Error('Formato de respuesta inválido');
        }

        this.todasMembresias = this.mapToCards(data);

        this.filterByNivel(this.nivelSeleccionado);

        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Error cargando membresías:', err);
        this.error = 'No se pudieron cargar las membresías. Mostrando datos de respaldo.';
        this.todasMembresias = this.membresiasFallback;
        this.filterByNivel(this.nivelSeleccionado);
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
    

    const cards: MembresiaCard[] = [];

    data.forEach(item => {
      const beneficios = this.extractAllBeneficios(item.materias);
      

      // Tarjeta normal (vigente - unidad actual)
      const normalCard: MembresiaCard = {
        id: item.id,
        titulo: item.nombre,
        descuento: item.textoDescuento || '',
        precio: item.textoPrecio || '',
        descripcion: item.notaPrecio || item.descripcion,
        isRecommended: item.esRecomendada,
        popular: item.esPopular,
        nivel: item.nivel,
        colorBadge: item.colorBadge,
        beneficios: beneficios,
        esVersionHistorica: false,
        tieneUnidadesVigentes: item.tieneUnidadesVigentes,
        posicion: item.posicion // Guardar posición para ordenamiento
      };

      cards.push(normalCard);

      // Si es especial, generar tarjeta histórica adicional
      if (item.esEspecial) {
        const descuento = item.descuentoUnidadesPasadas || 0;
        

        const historicalCard: MembresiaCard = {
          id: item.id * 10000 + 9999, // ID temporal único
          titulo: `${item.nombre} - Catálogo Histórico`,
          descuento: descuento > 0
            ? `${descuento}% descuento en unidades pasadas`
            : 'Accede a unidades pasadas',
          precio: item.textoPrecio || '',
          descripcion: 'Accede a contenido de unidades anteriores con descuento',
          isRecommended: false,
          popular: false,
          nivel: item.nivel,
          colorBadge: 'warning', // Badge naranjo para diferenciar
          beneficios: beneficios,
          esVersionHistorica: true,
          subscriptionTypeOriginalId: item.id,
          descuentoHistorico: descuento,
          posicion: item.posicion // Misma posición que la normal para ordenamiento
        };

        cards.push(historicalCard);
      }
    });

    // Ordenar tarjetas: primero históricas, luego normales (ambas por posición)
    return cards.sort((a, b) => {
      // Si una es histórica y la otra no, la histórica va primero
      if (a.esVersionHistorica && !b.esVersionHistorica) return -1;
      if (!a.esVersionHistorica && b.esVersionHistorica) return 1;

      // Si ambas son del mismo tipo, ordenar por posición
      const posA = a.posicion || 0;
      const posB = b.posicion || 0;
      return posA - posB;
    });
  }

  /**
   * Extraer todos los beneficios únicos de todas las materias
   * Ignora campos innecesarios: beneficiosJson, muestraJson, afiche, muestra
   */
  private extractAllBeneficios(materias: any[]): string[] {
    if (!materias || materias.length === 0) {
      console.warn('⚠️ No hay materias para extraer beneficios');
      return [];
    }

    const allBeneficios = new Set<string>();

    materias.forEach((materia, index) => {
      // Solo usar el array 'beneficios', ignorar 'beneficiosJson'
      if (materia.beneficios && Array.isArray(materia.beneficios)) {
        materia.beneficios.forEach(b => {
          if (b && typeof b === 'string' && b.trim()) {
            allBeneficios.add(b.trim());
          }
        });
        
      }
    });

    const result = Array.from(allBeneficios);
    return result;
  }

  onViewBenefits(index: number): void {
    const selectedMembresia = this.membresias[index];

    if (selectedMembresia.esVersionHistorica) {
      // Navegación a versión histórica (unidades pasadas)
      
      this.router.navigate(['/site/membresia-detail', selectedMembresia.subscriptionTypeOriginalId], {
        queryParams: {
          tipo: 'historico',
          descuento: selectedMembresia.descuentoHistorico
        }
      });
    } else {
      // Navegación normal (unidad vigente)
      
      this.router.navigate(['/site/membresia-detail', selectedMembresia.id], {
        queryParams: { tipo: 'vigente' }
      });
    }
  }

  // Método para obtener la membresía más popular
  getMostPopularPlan(): any {
    return this.membresias.find(m => m.isRecommended);
  }

  // Método para obtener el precio numérico (útil para comparaciones)
  getNumericPrice(priceString: string): number {
    const match = priceString.match(/S\/\.(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  // Método para destacar beneficios únicos
  getUniqueFeatures(planIndex: number): string[] {
    const currentPlan = this.membresias[planIndex];
    const otherPlans = this.membresias.filter((_, i) => i !== planIndex);

    return currentPlan.beneficios.filter(benefit =>
      !otherPlans.some(plan =>
        plan.beneficios.some(otherBenefit =>
          otherBenefit.toLowerCase().includes(benefit.toLowerCase().split(' ')[0])
        )
      )
    );
  }

  // Método para contar beneficios
  getBenefitsCount(planIndex: number): number {
    return this.membresias[planIndex].beneficios.length;
  }

  /**
   * Verificar si una membresía tiene unidades vigentes
   */
  hasUnidadesVigentes(membresia: MembresiaCard): boolean {
    return membresia.tieneUnidadesVigentes || false;
  }

  /**
   * Obtener mensaje de disponibilidad
   */
  getMensajeDisponibilidad(membresia: MembresiaCard): string {
    if (membresia.esVersionHistorica) {
      return 'Ver Catálogo Histórico';
    }

    return this.hasUnidadesVigentes(membresia)
      ? 'Ver Beneficios Completos'
      : 'No hay unidades vigentes';
  }
}
