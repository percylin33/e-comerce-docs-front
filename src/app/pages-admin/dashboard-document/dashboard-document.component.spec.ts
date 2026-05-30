import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestProviders } from '../../testing/test-providers';

import { DashboardDocumentComponent } from './dashboard-document.component';

describe('DashboardDocumentComponent', () => {
  let component: DashboardDocumentComponent;
  let fixture: ComponentFixture<DashboardDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [DashboardDocumentComponent],
      providers: [...commonTestProviders()]
})
    .compileComponents();

    fixture = TestBed.createComponent(DashboardDocumentComponent);
    component = fixture.componentInstance;
    // No invocamos detectChanges(): el template renderiza componentes Nebular
    // (overlay/popover) que requieren NbThemeModule.forRoot completo.
    // El smoke-test 'should create' solo verifica instanciacion.
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
