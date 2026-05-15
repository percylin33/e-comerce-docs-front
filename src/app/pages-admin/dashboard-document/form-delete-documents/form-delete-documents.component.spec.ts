import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestProviders } from '../../../testing/test-providers';

import { FormDeleteDocumentsComponent } from './form-delete-documents.component';

describe('FormDeleteDocumentsComponent', () => {
  let component: FormDeleteDocumentsComponent;
  let fixture: ComponentFixture<FormDeleteDocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [FormDeleteDocumentsComponent],
      providers: [...commonTestProviders()]
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
