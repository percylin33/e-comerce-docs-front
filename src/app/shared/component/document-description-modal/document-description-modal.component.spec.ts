import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentDescriptionModalComponent } from './document-description-modal.component';

describe('DocumentDescriptionModalComponent', () => {
  let component: DocumentDescriptionModalComponent;
  let fixture: ComponentFixture<DocumentDescriptionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocumentDescriptionModalComponent ]
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
