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
      console.log('🔍 DEBUG: Token raw:', token.substring(0, 50) + '...');
      
      try {
        const decoded: any = jwtDecode(token);
        console.log('🔍 DEBUG: Token decoded estructura completa:', decoded);
        console.log('🔍 DEBUG: Token properties:');
        console.log('  - sub (username):', decoded.sub);
        console.log('  - idUser:', decoded.idUser);
        console.log('  - name:', decoded.name);
        console.log('  - lastname:', decoded.lastname);
        console.log('  - picture:', decoded.picture);
        console.log('  - phone:', decoded.phone);
        console.log('  - roles:', decoded.roles);
        console.log('  - exp:', decoded.exp);
        console.log('  - iat:', decoded.iat);
      } catch (error) {
        console.error('🔍 DEBUG: Error decodificando token:', error);
      }
    } else {
      console.log('🔍 DEBUG: No token found in localStorage');
    }

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        console.log('🔍 DEBUG: CurrentUser estructura:', user);
      } catch (error) {
        console.error('🔍 DEBUG: Error parsing currentUser:', error);
      }
    } else {
      console.log('🔍 DEBUG: No currentUser found in localStorage');
    }
  }
}
