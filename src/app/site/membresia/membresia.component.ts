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
      beneficios: [
        '2 proyectos de aprendizaje',
        'Sesiones de aprendizaje',
        'Chat support',
        'Fichas de aprendizaje',
        'Talleres',
        'Planificadores por proyecto',
        'Instrumentos de evaluación',
        'Kit de recursos (De acuerdo a la situación significativa)'
      ]
    },
    {
      titulo: 'Membresía Mensual Primaria',
      descuento: 'Ahora 28% de descuento',
      precio: 'Desde S/.70/mes*',
      descripcion: 'Los precios varían según el número de grados',
      beneficios: [
        'Programación anual',
        '1 Unidad de aprendizaje',
        '9 Sesiones de aprendizaje por semana',
        '9 Fichas de aprendizaje para cada sesión',
        '9 Instrumentos de evaluación',
        'Secuencia de sesiones',
        'Kit de recursos didácticos',
        'Asesoría gratuita: Acceso a un grupo privado de WhatsApp'
      ]
    },
    {
      titulo: 'Membresía Mensual Secundaria',
      descuento: 'Ahora 10% de descuento',
      precio: '$5.25/mo*',
      descripcion: 'Los precios varían según el curso y el número de grados',
      beneficios: [
        '1 Programación anual',
        '1 Unidad de aprendizaje',
        'Phone & Chat support',
        '8 Sesiones de aprendizaje',
        '8 Fichas de aprendizaje',
        '8 Instrumentos de evaluación',
        '1 Planificador de la unidad',
        'Recursos didácticos por situación significativa'
      ]
    },
    {
      titulo: 'Membresía Anual Secundaria',
      descuento: 'Now 76% off',
      precio: '$5.25/mo*',
      descripcion: 'Los precios varían según el curso y el número de grados',
      beneficios: [
        'Planificación completa de las 8 Unidades',
        'Programación anual',
        'Unidades de aprendizaje',
        'Sesiones de aprendizaje',
        'Fichas de aplicación',
        'Instrumentos de evaluación',
        'Planificadores de la unidad',
        'Kit de Evaluación diagnóstica',
        'Kit de conclusiones descriptivas',
        'Kit de informes finales',
        'Rúbricas por competencia',
        'Kit de recursos para cada unidad',
        'Carpeta pedagógica',
        'Recursos para el día del logro',
        'Un kit de simulacros',
        'Registros de evaluación',
        'Registros de asistencia',
        'Agenda personalizada',
        'Kit de conclusiones descriptivas',
        'Kit de informes finales',
        'Acceso a grupo privado de WhatsApp',
        'Mentoría mensual con el especialista',
        'Sorteo de Gifcard por el día del maestro',
        '2 Medias becas para talleres'
      ]
    }
  ];
  
  
  constructor(private router: Router) {}

  onViewBenefits(index: number): void {
    const selectedMembresia = this.membresias[index];
    console.log('Índice seleccionado:', index);
    console.log('Membresía seleccionada:', selectedMembresia);
    this.router.navigate(['/site/membresia-detail', index]);
  }
}
