import {ChangeDetectionStrategy, Component, EventEmitter, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface ShowcaseCard {
  id: string;
  title: string;
  description: string;
  badge?: string;
  imageUrl?: string;
  ctaText: string;
  route?: string;
}

@Component({
  selector: 'ngx-showcase-section',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './showcase-section.component.html',
  styleUrls: ['./showcase-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowcaseSectionComponent {
  @Output() cardClick = new EventEmitter<string>();

  showcaseCards: ShowcaseCard[] = [
    // Card principal (grande) - izquierda
    {
      id: 'featured',
      title: 'Planificaciones con IA',
      description: 'Crea planificaciones automáticamente en segundos utilizando inteligencia artificial adaptada al currículum y necesidades de tu aula.',
      badge: 'NUEVO',
      imageUrl: 'assets/images/showcase/ia-planificacion.png',
      ctaText: 'Probar IA',
      route: '/site/ia-planificaciones'
    },
    // Card lateral superior - derecha
    {
      id: 'side1',
      title: 'Kits por Nivel',
      description: 'Colecciones completas organizadas por grado y asignatura.',
      imageUrl: 'assets/images/showcase/kits-nivel.png',
      ctaText: 'Explorar',
      route: '/site/categorias/KITS'
    },
    // Card lateral inferior - derecha
    {
      id: 'side2',
      title: 'Comunidad Docente',
      description: 'Conecta con colegas y accede a mentorías exclusivas.',
      imageUrl: 'assets/images/showcase/comunidad.png',
      ctaText: 'Unirse',
      route: '/site/comunidad'
    }
  ];

  onCardClick(cardId: string): void {
    this.cardClick.emit(cardId);
  }
}
