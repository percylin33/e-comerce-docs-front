import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';

export interface LegalText {
  id: number;
  content: string;
  versionLabel: string;
  type: string;
  isActive: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

@Injectable()
export class LegalTextApi {
  private readonly apiController: string = 'api/v1/promotores/legal-texts';

  constructor(private api: HttpService) {}

  getPublishedByType(type: 'TERMS' | 'PRIVACY'): Observable<LegalText> {
    return this.api.get(`${this.apiController}/public?type=${type}`);
  }
}
