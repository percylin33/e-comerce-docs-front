import { Observable } from "rxjs";

export interface Contact {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  mensaje: string;
}

export abstract class ContactData {
  abstract sendContact(contact: Contact): Observable<any>;
}
