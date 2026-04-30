import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CtaBannerComponent } from './cta-banner.component';

describe('CtaBannerComponent', () => {
  let fixture: ComponentFixture<CtaBannerComponent>;
  let component: CtaBannerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CtaBannerComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CtaBannerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.title = 'Únete';
    component.primaryAction = { label: 'Registrarse', route: '/register' };
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders title and primary action', () => {
    component.title = '¿Listo?';
    component.primaryAction = { label: 'Empezar', route: '/start' };
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.cta-banner__title')?.textContent).toContain('¿Listo?');
    const primary = el.querySelector('.cta-banner__btn--primary') as HTMLAnchorElement;
    expect(primary.textContent?.trim()).toBe('Empezar');
  });

  it('renders subtitle when provided', () => {
    component.title = 'A';
    component.subtitle = 'Texto';
    component.primaryAction = { label: 'Go', route: '/' };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cta-banner__subtitle')?.textContent).toContain('Texto');
  });

  it('does not render subtitle when omitted', () => {
    component.title = 'A';
    component.primaryAction = { label: 'Go', route: '/' };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cta-banner__subtitle')).toBeNull();
  });

  it('renders secondary action when provided', () => {
    component.title = 'A';
    component.primaryAction = { label: 'P', route: '/p' };
    component.secondaryAction = { label: 'Saber más', route: '/info' };
    fixture.detectChanges();
    const ghost = fixture.nativeElement.querySelector('.cta-banner__btn--ghost') as HTMLAnchorElement;
    expect(ghost).not.toBeNull();
    expect(ghost.textContent?.trim()).toBe('Saber más');
  });

  it('does not render secondary action when omitted', () => {
    component.title = 'A';
    component.primaryAction = { label: 'P', route: '/p' };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cta-banner__btn--ghost')).toBeNull();
  });
});
