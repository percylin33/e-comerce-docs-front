import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LegalTextApi, LegalText } from '../backend/api/legal-text.api';

@Injectable()
export class LegalTextService {
  constructor(private api: LegalTextApi) {}

  getTermsAndConditions(): Observable<LegalText> {
    return this.api.getPublishedByType('TERMS');
  }

  getPrivacyPolicy(): Observable<LegalText> {
    return this.api.getPublishedByType('PRIVACY');
  }
}
