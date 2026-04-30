import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductCardComponent, ProductCardItem } from './product-card.component';

describe('ProductCardComponent', () => {
  let fixture: ComponentFixture<ProductCardComponent>;
  let component: ProductCardComponent;

  const baseItem: ProductCardItem = {
    id: 1,
    title: 'Curso de matemáticas',
    image: '/assets/images/default-product.jpg',
    category: 'Primaria',
    level: '4to grado',
    rating: 4.5,
    reviews: 12,
    price: 29.9,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.item = baseItem;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the title and image', () => {
    component.item = baseItem;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.product-card__title')?.textContent).toContain('Curso de matemáticas');
    const img = el.querySelector('.product-card__img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/assets/images/default-product.jpg');
    expect(img.getAttribute('alt')).toBe('Curso de matemáticas');
  });

  it('shows price formatted when not free', () => {
    component.item = { ...baseItem, price: 19.5, free: false };
    fixture.detectChanges();
    const price = fixture.nativeElement.querySelector('.product-card__price') as HTMLElement;
    expect(price.textContent).toContain('S/');
    expect(price.textContent).toContain('19.50');
    expect(price.classList.contains('product-card__price--free')).toBeFalsy();
  });

  it('shows GRATIS when item is free (free=true)', () => {
    component.item = { ...baseItem, free: true, price: 0 };
    fixture.detectChanges();
    const price = fixture.nativeElement.querySelector('.product-card__price--free') as HTMLElement;
    expect(price).not.toBeNull();
    expect(price.textContent).toContain('GRATIS');
  });

  it('isFree returns true when price is 0', () => {
    component.item = { ...baseItem, price: 0 };
    expect(component.isFree).toBeTruthy();
  });

  it('applies horizontal modifier class when variant="horizontal"', () => {
    component.item = baseItem;
    component.variant = 'horizontal';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.product-card--horizontal')).not.toBeNull();
  });

  it('renders provided badge over item.level', () => {
    component.item = baseItem;
    component.badge = { label: 'NUEVO', color: 'success' };
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.product-card__badge') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('NUEVO');
    expect(badge.classList.contains('product-card__badge--success')).toBeTruthy();
  });

  it('falls back to item.level badge when no badge input', () => {
    component.item = baseItem;
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.product-card__badge') as HTMLElement;
    expect(badge.textContent).toContain('4to grado');
    expect(badge.classList.contains('product-card__badge--neutral')).toBeTruthy();
  });

  it('emits openDetail when card is clicked', () => {
    component.item = baseItem;
    fixture.detectChanges();
    const spy = spyOn(component.openDetail, 'emit');
    (fixture.nativeElement.querySelector('.product-card') as HTMLElement).click();
    expect(spy).toHaveBeenCalledWith(baseItem);
  });

  it('emits addToCart and stops propagation on cart click', () => {
    component.item = baseItem;
    fixture.detectChanges();
    const addSpy = spyOn(component.addToCart, 'emit');
    const openSpy = spyOn(component.openDetail, 'emit');
    const btn = fixture.nativeElement.querySelector('.product-card__cart') as HTMLButtonElement;
    btn.click();
    expect(addSpy).toHaveBeenCalledWith(baseItem);
    expect(openSpy).not.toHaveBeenCalled();
  });
});
