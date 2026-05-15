import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestProviders } from '../../testing/test-providers';

import { SuscripcionesComponent } from './suscripciones.component';

describe('SuscripcionesComponent', () => {
  let component: SuscripcionesComponent;
  let fixture: ComponentFixture<SuscripcionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [SuscripcionesComponent],
      providers: [...commonTestProviders()]
})
    .compileComponents();

    fixture = TestBed.createComponent(SuscripcionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
