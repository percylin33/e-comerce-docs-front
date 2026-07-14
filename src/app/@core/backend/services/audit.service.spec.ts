import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  AuditApiService,
  AuditLogDto,
  AuditSummary,
  PageResponse,
} from './audit.service';
import { environment } from '../../../../environments/environment';

describe('AuditApiService', () => {
  let service: AuditApiService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/api/v1/admin/audit`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuditApiService],
    });
    service = TestBed.inject(AuditApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getSummary hace GET a /summary', () => {
    const expected = { totalEvents24h: 10 } as AuditSummary;
    service.getSummary().subscribe(s => expect(s.totalEvents24h).toBe(10));

    const req = http.expectOne(`${base}/summary`);
    expect(req.request.method).toBe('GET');
    req.flush(expected);
  });

  it('listLogs envia los filtros como query params', () => {
    const expected = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 25 } as PageResponse<AuditLogDto>;
    service
      .listLogs({ search: 'login', category: 'SECURITY', severity: 'CRITICAL', page: 2, size: 25 })
      .subscribe(p => expect(p.content.length).toBe(0));

    const req = http.expectOne(r => r.url === `${base}/logs`);
    expect(req.request.params.get('search')).toBe('login');
    expect(req.request.params.get('category')).toBe('SECURITY');
    expect(req.request.params.get('severity')).toBe('CRITICAL');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('25');
    req.flush(expected);
  });

  it('listLogs ignora valores null o undefined o vacios', () => {
    service.listLogs({ search: '', actorEmail: undefined, category: 'USER' }).subscribe();

    const req = http.expectOne(r => r.url === `${base}/logs`);
    expect(req.request.params.has('search')).toBe(false);
    expect(req.request.params.has('actorEmail')).toBe(false);
    expect(req.request.params.get('category')).toBe('USER');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  });

  it('exportCsv usa responseType blob', () => {
    service.exportCsv({ severity: 'ERROR' }).subscribe();

    const req = http.expectOne(r => r.url === `${base}/export`);
    expect(req.request.responseType).toBe('blob');
    expect(req.request.params.get('severity')).toBe('ERROR');
    req.flush(new Blob(['id,action\n1,X'], { type: 'text/csv' }));
  });

  it('revokeSession hace POST con la razon', () => {
    service.revokeSession(7, 'compromised').subscribe();

    const req = http.expectOne(`${base}/security/sessions/7/revoke`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason: 'compromised' });
    req.flush({ id: 7 });
  });

  it('listLoginAttempts y listSessions usan parametros de paginacion', () => {
    service.listLoginAttempts('a@b.com', 1, 30).subscribe();
    const attemptsReq = http.expectOne(r => r.url === `${base}/security/login-attempts`);
    expect(attemptsReq.request.params.get('email')).toBe('a@b.com');
    expect(attemptsReq.request.params.get('page')).toBe('1');
    expect(attemptsReq.request.params.get('size')).toBe('30');
    attemptsReq.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 30 });

    service.listSessions(true, false, 0, 50).subscribe();
    const sessionsReq = http.expectOne(r => r.url === `${base}/security/sessions`);
    expect(sessionsReq.request.params.get('includeRevoked')).toBe('true');
    sessionsReq.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 });
  });

  // ========================================================================
  // Mejora v1.1: audit del modulo Creadores
  // ========================================================================

  it('listCreatorActions hace GET a /creators con filtros opcionales', () => {
    const expected = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 25 } as PageResponse<any>;
    service.listCreatorActions({ actionPrefix: 'CREATOR_DOC', severities: ['INFO', 'WARN'], page: 1, size: 10 })
      .subscribe(p => expect(p.content.length).toBe(0));
    const req = http.expectOne(r => r.url === `${base}/creators`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('actionPrefix')).toBe('CREATOR_DOC');
    expect(req.request.params.getAll('severities')).toEqual(['INFO', 'WARN']);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('10');
    req.flush(expected);
  });

  it('listCreatorActions omite filtros vacios', () => {
    service.listCreatorActions({ page: 0, size: 25 }).subscribe();
    const req = http.expectOne(r => r.url === `${base}/creators`);
    expect(req.request.params.has('actionPrefix')).toBe(false);
    expect(req.request.params.has('severities')).toBe(false);
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 25 });
  });

  it('getCreatorTimeline hace GET a /creators/{id}/timeline', () => {
    const expected = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 25 } as PageResponse<any>;
    service.getCreatorTimeline(7, { from: '2026-07-01T00:00:00Z', to: '2026-07-31T23:59:59Z', page: 0, size: 25 })
      .subscribe(p => expect(p.totalElements).toBe(0));
    const req = http.expectOne(r => r.url === `${base}/creators/7/timeline`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('from')).toBe('2026-07-01T00:00:00Z');
    expect(req.request.params.get('to')).toBe('2026-07-31T23:59:59Z');
    expect(req.request.params.get('page')).toBe('0');
    req.flush(expected);
  });

  it('listCreatorCommissionEvents filtra por creatorId y rango', () => {
    service.listCreatorCommissionEvents({ creatorId: 7, from: '2026-07-01T00:00:00Z', page: 0, size: 25 })
      .subscribe();
    const req = http.expectOne(r => r.url === `${base}/commissions`);
    expect(req.request.params.get('creatorId')).toBe('7');
    expect(req.request.params.get('from')).toBe('2026-07-01T00:00:00Z');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 25 });
  });

  it('listCreatorCommissionEvents omite creatorId cuando no se envia', () => {
    service.listCreatorCommissionEvents({ page: 0, size: 25 }).subscribe();
    const req = http.expectOne(r => r.url === `${base}/commissions`);
    expect(req.request.params.has('creatorId')).toBe(false);
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 25 });
  });

  it('exportCreatorCommissionsCsv hace GET a /commissions/export.csv con responseType blob', () => {
    service.exportCreatorCommissionsCsv({ from: '2026-07-01T00:00:00Z' }).subscribe();
    const req = http.expectOne(r => r.url === `${base}/commissions/export.csv`);
    expect(req.request.responseType).toBe('blob');
    expect(req.request.params.get('from')).toBe('2026-07-01T00:00:00Z');
    req.flush(new Blob(['id,action\n1,X'], { type: 'text/csv' }));
  });
});
