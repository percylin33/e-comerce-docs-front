import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SectionHeaderComponent } from './section-header.component';

describe('SectionHeaderComponent', () => {
  let fixture: ComponentFixture<SectionHeaderComponent>;
  let component: SectionHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionHeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.title = 'Cursos';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the title', () => {
    component.title = 'Recursos destacados';
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.section-header__title')?.textContent).toContain('Recursos destacados');
  });

  it('renders subtitle when provided', () => {
    component.title = 'A';
    component.subtitle = 'Sub';
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.section-header__subtitle')?.textContent).toContain('Sub');
  });

  it('does not render subtitle when omitted', () => {
    component.title = 'A';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.section-header__subtitle')).toBeNull();
  });

  it('applies center modifier when align="center"', () => {
    component.title = 'A';
    component.align = 'center';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.section-header--center')).not.toBeNull();
  });

  it('renders action link when actionLabel and actionRoute are provided', () => {
    component.title = 'A';
    component.actionLabel = 'Ver todo';
    component.actionRoute = '/cursos';
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('.section-header__action') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.textContent).toContain('Ver todo');
  });

  it('does not render action link when missing inputs', () => {
    component.title = 'A';
    component.actionLabel = 'Ver todo';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.section-header__action')).toBeNull();
  });
});
