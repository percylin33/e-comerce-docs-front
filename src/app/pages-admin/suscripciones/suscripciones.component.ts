import { Component } from '@angular/core';

@Component({
  selector: 'ngx-suscripciones',
  templateUrl: './suscripciones.component.html',
  styleUrls: ['./suscripciones.component.scss']
})
export class SuscripcionesComponent {
  displayedColumns: string[] = ['usuario', 'nombre', 'materias', 'fechaInicio', 'fechaFin', 'acciones'];

  suscripcionesActivas = [
    { id: 1, usuario: 'Juan Pérez', nombre: 'Suscripción Premium', materias: ['Matemáticas', 'Ciencias'], fechaInicio: '2025-01-01', fechaFin: '2025-12-31' },
    { id: 2, usuario: 'Ana López', nombre: 'Suscripción Básica', materias: ['Historia', 'Arte'], fechaInicio: '2025-02-01', fechaFin: '2025-08-31' }
  ];

  suscripcionesInactivas = [
    { id: 3, usuario: 'Carlos Gómez', nombre: 'Suscripción Estándar', materias: ['Física', 'Química'], fechaInicio: '2024-01-01', fechaFin: '2024-12-31' }
  ];

  cancelarSuscripcion(id: number) {
    console.log('Cancelar suscripción con ID:', id);
    // Lógica para cancelar la suscripción
  }

  verPagos(id: number) {
    console.log('Ver pagos de la suscripción con ID:', id);
    // Lógica para ver los pagos de la suscripción
  }
}
