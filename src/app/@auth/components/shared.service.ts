import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  private isAuthenticatedSource = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSource.asObservable();

  private userSource = new BehaviorSubject<any>(null);
  user$ = this.userSource.asObservable();

  constructor() {}

  setAuthenticated(value: boolean) {
    this.isAuthenticatedSource.next(value);
  }

  setUser(user: any) {
    this.userSource.next(user);
    // También actualizar localStorage cuando se establece el usuario
    if (user && Object.keys(user).length > 0) {
      this.updateLocalStorage(user);
    }
  }

  getCurrentUser(): any {
    return this.userSource.value;
  }

  isCurrentlyAuthenticated(): boolean {
    return this.isAuthenticatedSource.value;
  }

  // Nuevo método para actualizar localStorage de manera centralizada
  private updateLocalStorage(user: any): void {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        
        // Actualizar solo los campos que vienen en el objeto user
        const updatedUser = {
          ...userData,
          ...user,
          // Asegurar que el email se actualice correctamente
          email: user.email || user.sub || userData.email,
          sub: user.sub || user.email || userData.sub
        };
        
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('❌ SharedService: Error al actualizar localStorage:', error);
      }
    }
  }

  // Método para refrescar el usuario desde localStorage
  refreshUserFromStorage(): void {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        this.userSource.next(userData);
      } catch (error) {
        console.error('❌ SharedService: Error al refrescar usuario:', error);
      }
    }
  }

  /**
   * Inicializa el estado de autenticación desde localStorage.
   * Llama a este método una sola vez al arrancar la app (ej. desde AppComponent o HeaderComponent).
   */
  initializeFromStorage(): void {
    if (this.getCurrentUser()) return; // Ya inicializado

    const currentUser = localStorage.getItem('currentUser');
    const token       = localStorage.getItem('auth_app_token');

    if (currentUser && token) {
      try {
        if (this.isTokenExpired(token)) {
          this.clearAuthData();
          return;
        }
        const userData = JSON.parse(currentUser);
        this.userSource.next(userData);
        this.isAuthenticatedSource.next(true);
      } catch (error) {
        console.error('SharedService: Error al inicializar auth desde storage:', error);
        this.clearAuthData();
      }
    } else {
      this.userSource.next(null);
      this.isAuthenticatedSource.next(false);
    }
  }

  clearAuthData(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_app_token');
    localStorage.removeItem('auth_app_refresh_token');
    this.userSource.next(null);
    this.isAuthenticatedSource.next(false);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }
}
