import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { SelectedUser, UserData } from '../../../@core/interfaces/users';
import { forkJoin } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'ngx-form-users',
    templateUrl: './form-users.component.html',
    styleUrls: ['./form-users.component.scss'],
    standalone: true,
    imports: [MatIcon, CdkScrollable, MatDialogContent, MatFormField, MatLabel, MatPrefix, MatSelect, FormsModule, MatOption, MatInput, MatSuffix, MatDialogActions, MatButton, MatProgressSpinner]
})
export class FormUsersComponent implements OnInit {
  selectedUsers: SelectedUser[] = [];
  mode: 'delete' | 'changeRole';
  roles: string[] = ['ADMIN', 'SUPADMIN', 'PROMOTOR'];
  selectedRole: string = '';
  idAdmin: string = '';
  descuento: string = '';
  abono: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(protected ref: MatDialogRef<FormUsersComponent>,
              @Inject(MAT_DIALOG_DATA) public dialogData: { selectedUsers: SelectedUser[], mode: 'delete' | 'changeRole' },
              private users: UserData
  ) { }

  ngOnInit(): void {
    this.selectedUsers = this.dialogData.selectedUsers;
    this.mode = this.dialogData.mode;
  }

  confirmDelete() {
    this.isLoading = true;
    this.errorMessage = '';
    const requests = this.selectedUsers.map(user => this.users.delete(user.id));
    forkJoin(requests).subscribe({
      next: () => {
        this.isLoading = false;
        this.ref.close();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error al eliminar usuarios. Intenta de nuevo.';
        console.error('Error al eliminar:', err);
      }
    });
  }

  confirmChangeRole() {
    if (!this.selectedRole) return;
    this.isLoading = true;
    this.errorMessage = '';

    const requests = this.selectedUsers.map(user => {
      const updatedData = {
        id: Number(user.id),
        rol: this.selectedRole,
        descuento: this.descuento,
        abono: this.abono
      };
      return this.users.updateRoles(user.id, updatedData);
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.isLoading = false;
        this.ref.close();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error al cambiar el rol. Intenta de nuevo.';
        console.error('Error al cambiar rol:', err);
      }
    });
  }

  cancel() {
    this.ref.close();
  }
}