import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NbToastrService } from '@nebular/theme';
import { CreadoresAuditComponent } from './creadores-audit.component';
import {
  AuditApiService,
  CreatorAuditEventDto,
  PageResponse,
} from '../../../@core/backend/services/audit.service';

/**
 * Tests minimos del componente (Opcion A del sprint C).
 *
 * <p>Verifica los caminos sensibles:</p>
 * <ul>
 *   <li>Listado con severities vacias no rompe.</li>
 *   <li>Cambio de tab resetea paginacion.</li>
 *   <li>Export CSV crea un anchor con el blob.</li>
 *   <li>Error del backend muestra toastr.danger.</li>
 * </ul>
 */
describe('CreadoresAuditComponent (Opcion A)', () => {
  let fixture: ComponentFixture<CreadoresAuditComponent>;
  let component: CreadoresAuditComponent;
  let apiStub: jasmine.SpyObj<AuditApiService>;
  let toastrStub: jasmine.SpyObj<NbToastrService>;
  let routerStub: jasmine.SpyObj<Router>;
  let createObjectURLSpy: jasmine.Spy;
  let revokeObjectURLSpy: jasmine.Spy;

  const fakePage: PageResponse<CreatorAuditEventDto> = {
    content: [
      {
        id: 1,
        action: 'CREATOR_COMMISSION_EARNED',
        targetId: 100,
        targetTable: 'commissions',
        actorEmail: 'sys@x.com',
        severity: 'INFO',
        category: 'CREATOR',
        timestampTs: '2026-07-01T10:00:00Z',
        creatorId: 7,
        paymentId: 99,
        commissionAmount: 60.0,
      },
    ],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 25,
    first: true,
    last: true,
  };

  beforeEach(async () => {
    apiStub = jasmine.createSpyObj<AuditApiService>('AuditApiService', [
      'listCreatorActions',
      'listCreatorCommissionEvents',
      'getCreatorTimeline',
      'exportCreatorCommissionsCsv',
    ]);
    toastrStub = jasmine.createSpyObj<NbToastrService>('NbToastrService', [
      'success', 'danger', 'warning', 'info',
    ]);
    routerStub = jasmine.createSpyObj<Router>('Router', ['navigate']);

    apiStub.listCreatorActions.and.returnValue(of(fakePage));
    apiStub.listCreatorCommissionEvents.and.returnValue(of(fakePage));
    apiStub.getCreatorTimeline.and.returnValue(of(fakePage));
    apiStub.exportCreatorCommissionsCsv.and.returnValue(of(new Blob(['id,action\n1,EARNED'])));

    // Stub createObjectURL / revokeObjectURL.
    createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
    revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL');

    // Stub anchor click.
    const origCreate = document.createElement.bind(document);
    spyOn(document, 'createElement').and.callFake((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'a') {
        (el as HTMLAnchorElement).click = jasmine.createSpy('click');
      }
      return el;
    });

    await TestBed.configureTestingModule({
      imports: [CreadoresAuditComponent, CommonModule],
      providers: [
        { provide: AuditApiService, useValue: apiStub },
        { provide: NbToastrService, useValue: toastrStub },
        { provide: Router, useValue: routerStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreadoresAuditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('carga acciones de creadores por defecto (tab ACCIONES)', () => {
    expect(apiStub.listCreatorActions).toHaveBeenCalledTimes(1);
    expect(component.activeTab).toBe('ACCIONES');
    expect(component.data?.totalElements).toBe(1);
  });

  it('muestra error del backend via toastr.danger', () => {
    apiStub.listCreatorActions.and.returnValue(throwError(() => ({ error: { message: 'boom' } })));
    component.reload();
    expect(toastrStub.danger).toHaveBeenCalledWith('boom', 'Error');
    expect(component.loading).toBe(false);
  });

  it('cambio de tab a COMISIONES dispara listCreatorCommissionEvents', () => {
    component.onTabChange('COMISIONES');
    expect(apiStub.listCreatorCommissionEvents).toHaveBeenCalled();
    expect(component.filter.page).toBe(0);
  });

  it('cambio de tab a POR_CREADOR no llama backend hasta tener creatorId', () => {
    const callsAntes = apiStub.getCreatorTimeline.calls.count();
    component.onTabChange('POR_CREADOR');
    expect(apiStub.getCreatorTimeline.calls.count()).toBe(callsAntes);
  });

  it('loadTimeline con creatorId valido dispara getCreatorTimeline', () => {
    component.timelineCreatorId = 7;
    component.loadTimeline();
    expect(apiStub.getCreatorTimeline).toHaveBeenCalledWith(
      7,
      jasmine.objectContaining({ page: 0, size: 25 }),
    );
  });

  it('loadTimeline sin creatorId muestra warning y no llama backend', () => {
    const callsAntes = apiStub.getCreatorTimeline.calls.count();
    component.timelineCreatorId = null;
    component.loadTimeline();
    expect(apiStub.getCreatorTimeline.calls.count()).toBe(callsAntes);
    expect(toastrStub.warning).toHaveBeenCalled();
  });

  it('exportCsv invoca exportCreatorCommissionsCsv y dispara download', () => {
    component.exportCsv();
    expect(apiStub.exportCreatorCommissionsCsv).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(toastrStub.success).toHaveBeenCalled();
  });

  it('severityClass mapea correctamente', () => {
    expect(component.severityClass('CRITICAL')).toBe('sev-critical');
    expect(component.severityClass('WARN')).toBe('sev-warn');
    expect(component.severityClass('INFO')).toBe('sev-info');
    expect(component.severityClass('')).toBe('sev-info');
    expect(component.severityClass(null)).toBe('sev-info');
  });

  it('humanAction quita prefijo CREATOR_ y guiones', () => {
    expect(component.humanAction('CREATOR_COMMISSION_EARNED')).toBe('COMMISSION EARNED');
    expect(component.humanAction('CREATOR_ROLE_ASSIGNED')).toBe('ROLE ASSIGNED');
    expect(component.humanAction(null)).toBe('');
  });

  it('isCommission detecta prefijo correcto', () => {
    expect(component.isCommission({ action: 'CREATOR_COMMISSION_EARNED' } as any)).toBe(true);
    expect(component.isCommission({ action: 'CREATOR_WITHDRAWAL_REQUESTED' } as any)).toBe(false);
    expect(component.isCommission({ action: 'CREATOR_COMMISSION_BACKFILL_BATCH' } as any)).toBe(true);
  });

  it('tracking row por id', () => {
    expect(component.trackById(0, { id: 99 } as any)).toBe(99);
  });

  // ======================== Opcion B: drill-down ========================

  it('openDetail navega al detalle del log con el id de la fila (Opcion B)', () => {
    component.openDetail({ id: 42 } as any);
    expect(routerStub.navigate).toHaveBeenCalledWith([
      '/pages-admin/auditoria/log', 42,
    ]);
  });

  it('openDetail con id null no navega', () => {
    component.openDetail({ id: null } as any);
    expect(routerStub.navigate).not.toHaveBeenCalled();
  });

  it('openDetail con id 0 no navega (defensivo)', () => {
    component.openDetail({ id: 0 } as any);
    expect(routerStub.navigate).not.toHaveBeenCalled();
  });

  it('exportCsvCsv llama al endpoint de export y crea anchor para descargar', () => {
    component.exportCsv();
    expect(apiStub.exportCreatorCommissionsCsv).toHaveBeenCalled();
    expect((document.createElement as jasmine.Spy)).toHaveBeenCalledWith('a');
    expect(toastrStub.success).toHaveBeenCalledWith('Exportacion lista.', 'CSV');
  });
});
