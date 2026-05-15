import { Injectable, inject } from '@angular/core';
import { ContactApi } from '../api/contact.api';
import { Contact, ContactData } from '../../interfaces/contact';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContactService extends ContactData {
  private api = inject(ContactApi);


  sendContact(data: Contact): Observable<any> {
    return this.api.sendContact(data);
  }
}
