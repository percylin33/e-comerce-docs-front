import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class DebugTokenService {

  constructor() { }

  debugToken(): void {
    const token = localStorage.getItem('auth_app_token');
    if (token) {
      
      try {
        const decoded: any = jwtDecode(token);
   
      } catch (error) {
        console.error('🔍 DEBUG: Error decodificando token:', error);
      }
    } else {
    }

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
      } catch (error) {
        console.error('🔍 DEBUG: Error parsing currentUser:', error);
      }
    } else {
    }
  }
}
