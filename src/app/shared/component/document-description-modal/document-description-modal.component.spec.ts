import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestProviders } from '../../../testing/test-providers';

import { DocumentDescriptionModalComponent } from './document-description-modal.component';

describe('DocumentDescriptionModalComponent', () => {
  let component: DocumentDescriptionModalComponent;
  let fixture: ComponentFixture<DocumentDescriptionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [DocumentDescriptionModalComponent],
      providers: [...commonTestProviders()]
})
    .compileComponents();

    fixture = TestBed.createComponent(DocumentDescriptionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
