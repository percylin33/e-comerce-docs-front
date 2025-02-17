import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDeleteFisicoComponent } from './form-delete-fisico.component';

describe('FormDeleteFisicoComponent', () => {
  let component: FormDeleteFisicoComponent;
  let fixture: ComponentFixture<FormDeleteFisicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormDeleteFisicoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormDeleteFisicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
