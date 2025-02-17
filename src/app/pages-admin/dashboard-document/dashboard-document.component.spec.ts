import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardDocumentComponent } from './dashboard-document.component';

describe('DashboardDocumentComponent', () => {
  let component: DashboardDocumentComponent;
  let fixture: ComponentFixture<DashboardDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DashboardDocumentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
