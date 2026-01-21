import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
}
