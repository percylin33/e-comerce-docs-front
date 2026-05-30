import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardSkeletonComponent } from './card-skeleton.component';

describe('CardSkeletonComponent', () => {
  let fixture: ComponentFixture<CardSkeletonComponent>;
  let component: CardSkeletonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardSkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardSkeletonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders default variant with shimmer pieces', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.skeleton-card')).not.toBeNull();
    expect(el.querySelector('.skeleton-card--horizontal')).toBeNull();
    expect(el.querySelectorAll('.skeleton-shimmer').length).toBeGreaterThan(0);
  });

  it('applies horizontal modifier when variant="horizontal"', () => {
    component.variant = 'horizontal';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.skeleton-card--horizontal')).not.toBeNull();
  });

  it('is hidden from accessibility tree', () => {
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.skeleton-card') as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBe('true');
  });
});
