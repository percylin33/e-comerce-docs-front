import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'ngx-membresia',
  templateUrl: './membresia.component.html',
  styleUrls: ['./membresia.component.scss']
})
export class MembresiaComponent {
  
  membresias = [
    {
      titulo: 'Membresía Mensual Inicial',
      descuento: 'Ahora 28% de descuento',
      precio: 'Desde S/.50/mes*',
      descripcion: 'Los precios varían según el número de grados',
      isRecommended: false,
      popular: false,
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
    {
      titulo: 'Membresía Mensual Primaria',
      descuento: 'Ahora 28% de descuento',
      precio: 'Desde S/.50/mes*',
      descripcion: 'Los precios varían según el número de grados',
      isRecommended: true,
      popular: true,
      beneficios: [
        'Programación anual completa',
        '1 Unidad de aprendizaje detallada',
        '9 Sesiones de aprendizaje por semana',
        '9 Fichas de aprendizaje para cada sesión',
        '9 Instrumentos de evaluación especializados',
        'Secuencia de sesiones optimizada',
        'Kit de recursos didácticos premium',
        'Asesoría gratuita: Acceso a un grupo privado de WhatsApp',
        'Soporte prioritario'
      ]
    },
    {
      titulo: 'Membresía Mensual Secundaria',
      descuento: 'Ahora 10% de descuento',
      precio: 'Desde S/.32/mes*',
      descripcion: 'Los precios varían según el curso y el número de grados',
      isRecommended: false,
      popular: false,
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
      titulo: 'Membresía Anual Secundaria',
      descuento: 'Ahora 15% de descuento',
      precio: 'Desde S/.250/anual*',
      descripcion: 'Los precios varían según el curso y el número de grados',
      isRecommended: false,
      popular: false,
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
  
  
  constructor(private router: Router) {}

  onViewBenefits(index: number): void {
    const selectedMembresia = this.membresias[index];
    this.router.navigate(['/site/membresia-detail', index]);
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
}
