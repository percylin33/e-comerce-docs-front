import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitsChartComponent } from './visits-chart.component';

describe('VisitsChartComponent', () => {
  let component: VisitsChartComponent;
  let fixture: ComponentFixture<VisitsChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VisitsChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
