import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'ngx-error-dialog',
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.scss']
})
export class ErrorDialogComponent {
  constructor(public dialogRef: MatDialogRef<ErrorDialogComponent>, private router: Router) {}

  redirectToRegister() {
    this.dialogRef.close();
    this.router.navigate(['/autenticacion/register']);
  }

  redirectToLogin() {
    this.dialogRef.close();
    this.router.navigate(['/autenticacion/login']);
  }
}