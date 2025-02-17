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
  }
}
