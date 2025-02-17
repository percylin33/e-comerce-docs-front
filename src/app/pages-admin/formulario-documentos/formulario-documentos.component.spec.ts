import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioDocumentosComponent } from './formulario-documentos.component';

describe('FormularioDocumentosComponent', () => {
  let component: FormularioDocumentosComponent;
  let fixture: ComponentFixture<FormularioDocumentosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormularioDocumentosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormularioDocumentosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
