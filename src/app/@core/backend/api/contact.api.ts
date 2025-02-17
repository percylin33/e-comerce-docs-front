import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { Contact } from '../../interfaces/contact';

@Injectable({
  providedIn: 'root'
})
export class ContactApi {

  constructor(private api: HttpService) { }

  sendContact(data: Contact): Observable<any> {
    return this.api.post('api/v1/contactanos', data);
  }
}
