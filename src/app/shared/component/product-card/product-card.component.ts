import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export type ProductCardVariant = 'default' | 'horizontal';

export interface ProductCardBadge {
  label: string;
  /** 'primary' | 'success' | 'warning' | 'danger' | 'neutral' */
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

export interface ProductCardItem {
  id: string | number;
  title: string;
  image: string;
  category?: string;
  level?: string;
  rating?: number;
  reviews?: number;
  price?: number;       // 0 = gratis
  free?: boolean;
  route?: string | any[];
}

@Component({
  selector: 'ngx-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent {
  @Input({ required: true }) item!: ProductCardItem;
  @Input() variant: ProductCardVariant = 'default';
  @Input() badge?: ProductCardBadge;

  @Output() addToCart = new EventEmitter<ProductCardItem>();
  @Output() openDetail = new EventEmitter<ProductCardItem>();

  onAddToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.addToCart.emit(this.item);
  }

  onOpenDetail(): void {
    this.openDetail.emit(this.item);
  }

  get isFree(): boolean {
    return !!this.item?.free || this.item?.price === 0;
  }
}
