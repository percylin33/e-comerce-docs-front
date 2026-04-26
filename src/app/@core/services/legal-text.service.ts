import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LegalTextApi, LegalText } from '../backend/api/legal-text.api';

@Injectable()
export class LegalTextService {
  private api = inject(LegalTextApi);


  getTermsAndConditions(): Observable<LegalText> {
    return this.api.getPublishedByType('TERMS');
  }

  getPrivacyPolicy(): Observable<LegalText> {
    return this.api.getPublishedByType('PRIVACY');
  }
}
