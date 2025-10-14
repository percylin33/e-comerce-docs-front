import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TutorialApi {
  private baseUrl = 'http://localhost:8080/auth/user'; // Ajusta si tu backend usa otro puerto

  getUserById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  constructor(private http: HttpClient) {}
}
