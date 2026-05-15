import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestProviders } from '../../testing/test-providers';

import { FormularioDocumentosComponent } from './formulario-documentos.component';

describe('FormularioDocumentosComponent', () => {
  let component: FormularioDocumentosComponent;
  let fixture: ComponentFixture<FormularioDocumentosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [FormularioDocumentosComponent],
      providers: [...commonTestProviders()]
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
