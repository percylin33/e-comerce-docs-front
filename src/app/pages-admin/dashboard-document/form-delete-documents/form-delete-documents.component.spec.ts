import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDeleteDocumentsComponent } from './form-delete-documents.component';

describe('FormDeleteDocumentsComponent', () => {
  let component: FormDeleteDocumentsComponent;
  let fixture: ComponentFixture<FormDeleteDocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormDeleteDocumentsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormDeleteDocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
