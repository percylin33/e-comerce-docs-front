import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MembershipCardComponent } from './membership-card.component';
import { MembershipService } from './membership.service';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('MembershipCardComponent', () => {
  let component: MembershipCardComponent;
  let fixture: ComponentFixture<MembershipCardComponent>;

  const mockMembershipService = {
    getPaymentsForSubscription: (id: number) => of([]),
    getDocumentsForSubscription: (id: number) => of({})
  } as Partial<MembershipService> as MembershipService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MembershipCardComponent],
      providers: [ { provide: MembershipService, useValue: mockMembershipService } ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MembershipCardComponent);
    component = fixture.componentInstance;
    component.subscription = { id: 123, membresiaNombre: 'Test', fechaInicio: '2024-01-01', fechaFin: '2024-12-31', estado: 'ACT' };
    fixture.detectChanges();
  });

  it('creates and prefills counts', (done) => {
    // ngOnInit should have subscribed and set counts
    setTimeout(() => {
      expect(component).toBeTruthy();
      expect(component.paymentsCount).toBeDefined();
      expect(component.documentsCount).toBeDefined();
      done();
    }, 10);
  });
});
