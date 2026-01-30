import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../utils/notification.service';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ForbiddenInterceptor implements HttpInterceptor {
  constructor(private notificationService: NotificationService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err && err.status === 403) {
          const message = err.error?.error?.message || err.error?.message || 'No tienes permisos para realizar esta acción.';
          this.notificationService.showWarning(message, 'Acceso denegado');
          // Optionally navigate to a safe page or login
          // this.router.navigate(['/']);
        }
        return throwError(() => err);
      })
    );
  }
}
