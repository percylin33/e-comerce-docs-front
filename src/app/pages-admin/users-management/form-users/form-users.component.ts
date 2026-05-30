import { Component, OnInit, inject } from '@angular/core';
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

type FormUsersMode = 'delete' | 'changeRole' | 'edit';

@Component({
    selector: 'ngx-form-users',
    templateUrl: './form-users.component.html',
    styleUrls: ['./form-users.component.scss'],
    standalone: true,
    imports: [MatIcon, CdkScrollable, MatDialogContent, MatFormField, MatLabel, MatPrefix, MatSelect, FormsModule, MatOption, MatInput, MatSuffix, MatDialogActions, MatButton, MatProgressSpinner]
})
export class FormUsersComponent implements OnInit {
  protected ref = inject<MatDialogRef<FormUsersComponent>>(MatDialogRef);
  dialogData = inject(MAT_DIALOG_DATA);
  private users = inject(UserData);

  selectedUsers: SelectedUser[] = [];
  mode: FormUsersMode = 'delete';
  roles: string[] = ['ADMIN', 'SUPADMIN', 'PROMOTOR'];
  selectedRole: string = '';
  idAdmin: string = '';
  descuento: string = '';
  abono: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  // ── Modo edición de campos seguros ────────────────────────────
  editingUserId: string = '';
  editingUserName: string = '';
  editFirstname: string = '';
  editLastname: string = '';
  editEmail: string = '';
  editCountry: string = '';
  loadingUserData: boolean = false;

  private readonly decimalRegex = /^\d+(\.\d+)?$/;

  ngOnInit(): void {
    this.selectedUsers = this.dialogData?.selectedUsers ?? [];
    this.mode = this.dialogData?.mode ?? 'delete';

    if (this.mode === 'edit') {
      this.initEditMode();
    }
  }

  private initEditMode(): void {
    const user = this.dialogData?.user;
    if (!user) return;

    this.editingUserId = String(user.id ?? '');
    this.editingUserName = user.name ?? '';
    this.editFirstname = user.name ?? '';
    this.editEmail = user.email ?? '';
    this.editCountry = user.country ?? '';

    // Cargar datos completos (apellido, etc.) desde el endpoint auth/user/{id}
    if (!this.editingUserId) return;
    const numericId = Number(this.editingUserId);
    if (Number.isNaN(numericId)) return;

    this.loadingUserData = true;
    this.users.getUserById(numericId).subscribe({
      next: (data: any) => {
        if (data) {
          this.editFirstname = data.nombre ?? data.firstname ?? this.editFirstname;
          this.editLastname = data.apellido ?? data.lastname ?? this.editLastname;
          this.editEmail = data.correo ?? data.email ?? this.editEmail;
          this.editCountry = data.country ?? this.editCountry;
        }
        this.loadingUserData = false;
      },
      error: () => {
        this.loadingUserData = false;
      }
    });
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
        this.errorMessage = this.extractErrorMessage(err) || 'Error al eliminar usuarios. Intenta de nuevo.';
        console.error('Error al eliminar:', err);
      }
    });
  }

  confirmChangeRole() {
    if (!this.selectedRole) return;
    this.isLoading = true;
    this.errorMessage = '';

    const requests = this.selectedUsers.map(user => {
      const updatedData: { [key: string]: any } = {
        id: Number(user.id),
        rol: this.selectedRole,
      };

      // Sólo enviar descuento/abono cuando el rol es PROMOTOR y son números válidos.
      // El backend valida estos campos con @Pattern y rechaza cadenas vacías.
      if (this.selectedRole === 'PROMOTOR') {
        const descuentoStr = (this.descuento ?? '').toString().trim();
        const abonoStr = (this.abono ?? '').toString().trim();
        if (descuentoStr !== '' && this.decimalRegex.test(descuentoStr)) {
          updatedData['descuento'] = descuentoStr;
        }
        if (abonoStr !== '' && this.decimalRegex.test(abonoStr)) {
          updatedData['abono'] = abonoStr;
        }
      }

      return this.users.updateRoles(user.id, updatedData);
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.isLoading = false;
        this.ref.close();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.extractErrorMessage(err) || 'Error al cambiar el rol. Intenta de nuevo.';
        console.error('Error al cambiar rol:', err);
      }
    });
  }

  confirmEditUser() {
    if (!this.editingUserId) return;

    const firstname = (this.editFirstname ?? '').trim();
    const lastname = (this.editLastname ?? '').trim();
    const email = (this.editEmail ?? '').trim();
    const country = (this.editCountry ?? '').trim();

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorMessage = 'El email no tiene un formato válido.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Sólo incluimos los campos seguros que el usuario haya proporcionado para
    // evitar sobrescribir con valores vacíos y para no disparar validaciones
    // de @Pattern del backend (descuento/abono no van aquí).
    const updatedData: { [key: string]: any } = {
      id: Number(this.editingUserId),
    };

    if (firstname) updatedData['firstname'] = firstname;
    if (lastname) updatedData['lastname'] = lastname;
    if (email) updatedData['email'] = email;
    if (country) updatedData['country'] = country;

    this.users.updateRoles(this.editingUserId, updatedData).subscribe({
      next: () => {
        this.isLoading = false;
        this.ref.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.extractErrorMessage(err) || 'Error al actualizar el usuario. Intenta de nuevo.';
        console.error('Error al actualizar usuario:', err);
      }
    });
  }

  private extractErrorMessage(err: any): string {
    const body = err?.error;
    if (!body) return '';
    if (typeof body === 'string') return body;
    const raw = body?.errorresponse?.message ?? body?.message;
    if (typeof raw !== 'string') return '';
    return raw.replace(/^[A-Z_]+_ERROR,?\s*/i, '').trim();
  }

  cancel() {
    this.ref.close();
  }
}
