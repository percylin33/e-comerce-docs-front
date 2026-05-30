import { TestBed } from '@angular/core/testing';
import { DownloadFeaturesService } from './download-features.service';
import { environment } from '../../../environments/environment';

describe('DownloadFeaturesService', () => {
  let service: DownloadFeaturesService;
  let originalConfig: any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DownloadFeaturesService);
    originalConfig = { ...environment.downloadsV2 };
    sessionStorage.removeItem('downloadsV2.enabled');
    sessionStorage.removeItem('downloadsV2.frontendPercent');
  });

  afterEach(() => {
    Object.assign(environment.downloadsV2, originalConfig);
    sessionStorage.removeItem('downloadsV2.enabled');
    sessionStorage.removeItem('downloadsV2.frontendPercent');
  });

  it('default is disabled in environment', () => {
    expect(service.isV2Enabled()).toBe(false);
    expect(service.shouldUseV2(1)).toBe(false);
  });

  it('sessionStorage override turns it on/off', () => {
    sessionStorage.setItem('downloadsV2.enabled', 'true');
    sessionStorage.setItem('downloadsV2.frontendPercent', '100');
    expect(service.isV2Enabled()).toBe(true);
    expect(service.shouldUseV2(42)).toBe(true);
  });

  it('decision is deterministic per userId', () => {
    sessionStorage.setItem('downloadsV2.enabled', 'true');
    sessionStorage.setItem('downloadsV2.frontendPercent', '50');

    const decisions = new Set<boolean>();
    for (let i = 0; i < 5; i++) decisions.add(service.shouldUseV2(7));
    expect(decisions.size).toBe(1);
  });

  it('frontendPercent=0 -> nadie usa v2', () => {
    sessionStorage.setItem('downloadsV2.enabled', 'true');
    sessionStorage.setItem('downloadsV2.frontendPercent', '0');
    for (let i = 0; i < 50; i++) {
      expect(service.shouldUseV2(i)).toBe(false);
    }
  });

  it('frontendPercent=100 -> todos usan v2', () => {
    sessionStorage.setItem('downloadsV2.enabled', 'true');
    sessionStorage.setItem('downloadsV2.frontendPercent', '100');
    for (let i = 0; i < 50; i++) {
      expect(service.shouldUseV2(i)).toBe(true);
    }
  });

  it('clampea valores fuera de rango', () => {
    sessionStorage.setItem('downloadsV2.enabled', 'true');
    sessionStorage.setItem('downloadsV2.frontendPercent', '200');
    expect(service.getV2FrontendPercent()).toBe(100);
    sessionStorage.setItem('downloadsV2.frontendPercent', '-25');
    expect(service.getV2FrontendPercent()).toBe(0);
  });

  it('usuario sin id NO usa v2 cuando hay bucketing parcial', () => {
    sessionStorage.setItem('downloadsV2.enabled', 'true');
    sessionStorage.setItem('downloadsV2.frontendPercent', '50');
    expect(service.shouldUseV2(null)).toBe(false);
    expect(service.shouldUseV2(undefined)).toBe(false);
    expect(service.shouldUseV2('')).toBe(false);
  });

  it('al 100% todos van por v2 incluso sin userId (no aplica bucketing)', () => {
    sessionStorage.setItem('downloadsV2.enabled', 'true');
    sessionStorage.setItem('downloadsV2.frontendPercent', '100');
    expect(service.shouldUseV2(null)).toBe(true);
    expect(service.shouldUseV2(undefined)).toBe(true);
    expect(service.shouldUseV2('')).toBe(true);
  });
});
