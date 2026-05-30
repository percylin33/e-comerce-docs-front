import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuditSummaryWidgetComponent } from './audit-summary-widget.component';
import { AuditApiService, AuditSummary } from '../../../@core/backend/services/audit.service';

class MockApi {
  summary: AuditSummary = {
    totalEvents24h: 10,
    totalEvents7d: 50,
    criticalEvents24h: 0,
    errorEvents24h: 0,
    warnEvents24h: 0,
    failedLogins24h: 0,
    bruteForce24h: 0,
    activeSessions: 3,
    integrityFindings7d: 0,
    integrityCritical7d: 0,
    byCategory: {},
    bySeverity: {},
    topActions: [],
    topActors: [],
    hourlyHistogram: [],
  };
  shouldFail = false;
  getSummary() {
    return this.shouldFail ? throwError(() => new Error('boom')) : of(this.summary);
  }
}

describe('AuditSummaryWidgetComponent', () => {
  let fixture: ComponentFixture<AuditSummaryWidgetComponent>;
  let component: AuditSummaryWidgetComponent;
  let api: MockApi;

  beforeEach(async () => {
    api = new MockApi();
    await TestBed.configureTestingModule({
      imports: [AuditSummaryWidgetComponent],
      providers: [
        provideRouter([]),
        { provide: AuditApiService, useValue: api },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AuditSummaryWidgetComponent);
    component = fixture.componentInstance;
  });

  it('carga el resumen y lo expone al template', () => {
    fixture.detectChanges();
    expect(component.summary).toBeTruthy();
    expect(component.summary?.totalEvents24h).toBe(10);
    expect(component.loading).toBe(false);
    expect(component.errored).toBe(false);
  });

  it('healthBadge=saludable si todo en cero', () => {
    fixture.detectChanges();
    expect(component.healthBadge.status).toBe('success');
  });

  it('healthBadge=danger si hay eventos criticos', () => {
    api.summary = { ...api.summary, criticalEvents24h: 2 };
    fixture.detectChanges();
    expect(component.healthBadge.status).toBe('danger');
  });

  it('healthBadge=warning si hay errores u oleada de fallidos', () => {
    api.summary = { ...api.summary, errorEvents24h: 1 };
    fixture.detectChanges();
    expect(component.healthBadge.status).toBe('warning');
  });

  it('marca errored=true si la llamada falla', () => {
    api.shouldFail = true;
    fixture.detectChanges();
    expect(component.errored).toBe(true);
    expect(component.loading).toBe(false);
  });
});
