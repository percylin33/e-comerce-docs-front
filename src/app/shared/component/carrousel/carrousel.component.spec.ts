import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestProviders } from '../../../testing/test-providers';

import { CarrouselComponent } from './carrousel.component';

describe('CarrouselComponent', () => {
  let component: CarrouselComponent;
  let fixture: ComponentFixture<CarrouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [CarrouselComponent],
      providers: [...commonTestProviders()]
})
    .compileComponents();

    fixture = TestBed.createComponent(CarrouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
