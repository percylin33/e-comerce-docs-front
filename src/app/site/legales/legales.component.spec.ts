import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestProviders } from '../../testing/test-providers';

import { LegalesComponent } from './legales.component';

describe('LegalesComponent', () => {
  let component: LegalesComponent;
  let fixture: ComponentFixture<LegalesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [LegalesComponent],
      providers: [...commonTestProviders()]
})
    .compileComponents();

    fixture = TestBed.createComponent(LegalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
