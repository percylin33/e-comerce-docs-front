import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmbajadoresComponent } from './embajadores.component';

describe('EmbajadoresComponent', () => {
  let component: EmbajadoresComponent;
  let fixture: ComponentFixture<EmbajadoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmbajadoresComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmbajadoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
