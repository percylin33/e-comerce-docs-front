import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { UserDto, UserUpdateDto } from '../../@core/interfaces/users';
import { SharedService } from '../../@auth/components/shared.service';
import { UsersService } from '../../@core/backend/services/users.service';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('newPassword');
  const confirm = group.get('confirmPassword');
  if (!pass || !confirm) {
    return null;
  }
  const pv = pass.value as string;
  const cv = confirm.value as string;
  if (cv == null || cv === '') {
    return null;
  }
  return pv === cv ? null : { passwordMismatch: true };
}

@Component({
  selector: 'ngx-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    ReactiveFormsModule,
  ],
})
export class PerfilComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private sharedService = inject(SharedService);
  private usersService = inject(UsersService);
  private snackBar = inject(MatSnackBar);

  private userSubscription: Subscription;

  user: UserDto = {
    id: 0,
    name: '',
    lastname: '',
    email: '',
    roles: [],
    picture: 'https://i.pravatar.cc/150?img=3',
    phone: '',
  };

  editando = false;
  selectedAvatarFile: File | null = null;
  profileSaving = false;
  passwordSaving = false;

  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;

  profileForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.maxLength(30)]],
  });

  passwordForm: FormGroup = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: [
        '',
        [Validators.required, Validators.minLength(8), Validators.pattern(STRONG_PASSWORD)],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  constructor() {
    this.loadUserData();
    this.userSubscription = this.sharedService.user$.subscribe((userData) => {
      if (userData && Object.keys(userData).length > 0) {
        this.updateUserFromSharedService(userData);
      }
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.patchProfileFormFromUser();
    setTimeout(() => {
      if (this.isUserEmpty()) {
        this.loadUserData();
        this.patchProfileFormFromUser();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  get newPasswordCtrl(): AbstractControl | null {
    return this.passwordForm.get('newPassword');
  }

  passwordStrengthPercent(): number {
    const v = (this.newPasswordCtrl?.value as string) || '';
    if (!v.length) {
      return 0;
    }
    let score = 0;
    if (v.length >= 8) {
      score++;
    }
    if (/[a-z]/.test(v)) {
      score++;
    }
    if (/[A-Z]/.test(v)) {
      score++;
    }
    if (/\d/.test(v)) {
      score++;
    }
    if (/[^A-Za-z0-9]/.test(v)) {
      score++;
    }
    return Math.min(100, Math.round((score / 5) * 100));
  }

  passwordStrengthLabel(): string {
    const p = this.passwordStrengthPercent();
    if (p === 0) {
      return '';
    }
    if (p < 40) {
      return 'Débil';
    }
    if (p < 70) {
      return 'Aceptable';
    }
    return 'Fuerte';
  }

  private isUserEmpty(): boolean {
    return !this.user.name && !this.user.email && !this.user.phone;
  }

  private updateUserFromSharedService(userData: Record<string, unknown>): void {
    this.user.id = (userData['id'] as number) || 0;
    this.user.name = (userData['name'] as string) || '';
    this.user.lastname = (userData['lastname'] as string) || '';
    this.user.email = (userData['sub'] as string) || (userData['email'] as string) || '';
    this.user.roles = (userData['roles'] as string[]) || [];
    this.user.picture = (userData['picture'] as string) || 'https://i.pravatar.cc/150?img=3';
    this.user.phone = (userData['phone'] as string) || '';
    if (!this.editando) {
      this.patchProfileFormFromUser();
    }
  }

  private loadUserData(): void {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      return;
    }
    try {
      const userData = JSON.parse(currentUser) as Record<string, unknown>;
      this.user.id = (userData['id'] as number) || 0;
      this.user.name = (userData['name'] as string) || '';
      this.user.lastname = (userData['lastname'] as string) || '';
      this.user.email = (userData['sub'] as string) || (userData['email'] as string) || '';
      this.user.roles = (userData['roles'] as string[]) || [];
      this.user.picture = (userData['picture'] as string) || 'https://i.pravatar.cc/150?img=3';
      this.user.phone = (userData['phone'] as string) || '';
    } catch {
      this.snackBar.open('No se pudieron leer los datos de sesión.', 'Cerrar', { duration: 5000 });
    }
  }

  private patchProfileFormFromUser(): void {
    this.profileForm.patchValue({
      firstName: this.user.name,
      lastName: this.user.lastname,
      email: this.user.email,
      phone: this.user.phone,
    });
  }

  editarPerfil(): void {
    this.editando = true;
    this.selectedAvatarFile = null;
    this.patchProfileFormFromUser();
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.selectedAvatarFile = null;
    this.loadUserData();
    this.patchProfileFormFromUser();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }
    const file = input.files[0];
    this.selectedAvatarFile = file;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.user.picture = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  guardarCambios(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const v = this.profileForm.getRawValue() as {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };

    const userUpdatePayload = {
      id: String(this.user.id),
      email: v.email.trim(),
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      phoneNumber: (v.phone || '').trim(),
    };

    const formData = new FormData();
    formData.append(
      'userUpdate',
      new Blob([JSON.stringify(userUpdatePayload)], { type: 'application/json' }),
    );
    if (this.selectedAvatarFile) {
      formData.append('file', this.selectedAvatarFile, this.selectedAvatarFile.name);
    }

    this.profileSaving = true;
    this.usersService.postUpdateUser(formData).subscribe({
      next: (response) => {
        if (response?.result && response.data) {
          this.applyUserUpdateDto(response.data);
          this.updateLocalStorageFromBackend(response.data);
          this.sharedService.setUser(this.buildSharedUserPayload());
          this.editando = false;
          this.selectedAvatarFile = null;
          this.snackBar.open('Perfil actualizado correctamente.', 'Cerrar', { duration: 4000 });
        } else {
          this.snackBar.open('No se pudo guardar el perfil.', 'Cerrar', { duration: 5000 });
        }
        this.profileSaving = false;
      },
      error: () => {
        this.snackBar.open('Error al guardar. Intenta de nuevo.', 'Cerrar', { duration: 5000 });
        this.profileSaving = false;
      },
    });
  }

  private applyUserUpdateDto(data: UserUpdateDto): void {
    this.user.name = data.firstName ?? this.user.name;
    this.user.lastname = data.lastName ?? this.user.lastname;
    this.user.email = data.email ?? this.user.email;
    this.user.phone = data.phoneNumber ?? this.user.phone;
    if (data.image) {
      this.user.picture = data.image;
    }
    this.patchProfileFormFromUser();
  }

  private buildSharedUserPayload(): Record<string, unknown> {
    return {
      id: this.user.id,
      name: this.user.name,
      lastname: this.user.lastname,
      email: this.user.email,
      sub: this.user.email,
      phone: this.user.phone,
      picture: this.user.picture,
      roles: this.user.roles,
    };
  }

  private updateLocalStorageFromBackend(backendData: UserUpdateDto): void {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      return;
    }
    try {
      const userData = JSON.parse(currentUser) as Record<string, unknown>;
      userData['name'] = backendData.firstName ?? userData['name'];
      userData['lastname'] = backendData.lastName ?? userData['lastname'];
      userData['email'] = backendData.email ?? userData['email'];
      userData['sub'] = backendData.email ?? userData['sub'];
      userData['phone'] = backendData.phoneNumber ?? userData['phone'];
      userData['picture'] = backendData.image ?? userData['picture'];
      localStorage.setItem('currentUser', JSON.stringify(userData));
    } catch {
      /* ignore */
    }
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const raw = this.passwordForm.getRawValue() as {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    };
    if (raw.currentPassword === raw.newPassword) {
      this.snackBar.open('La nueva contraseña debe ser distinta a la actual.', 'Cerrar', { duration: 5000 });
      return;
    }

    this.passwordSaving = true;
    this.usersService
      .changePassword(raw.currentPassword, raw.newPassword)
      .pipe(finalize(() => (this.passwordSaving = false)))
      .subscribe({
        next: (res) => {
          if (res?.result) {
            this.passwordForm.reset();
            Object.keys(this.passwordForm.controls).forEach((k) => {
              this.passwordForm.get(k)?.setErrors(null);
            });
            this.passwordForm.setErrors(null);
            this.snackBar.open('Contraseña actualizada. Usa la nueva en tu próximo inicio de sesión.', 'Cerrar', {
              duration: 6000,
            });
          } else {
            this.snackBar.open(res?.message || 'No se pudo actualizar la contraseña.', 'Cerrar', { duration: 5000 });
          }
        },
        error: (err: { error?: { message?: string } }) => {
          const msg =
            err?.error?.message ||
            (typeof err?.error === 'string' ? err.error : null) ||
            'Error al cambiar la contraseña. Verifica la contraseña actual.';
          this.snackBar.open(msg, 'Cerrar', { duration: 6000 });
        },
      });
  }

  fieldError(form: FormGroup, name: string): string | null {
    const c = form.get(name);
    if (!c || !c.errors || !c.touched) {
      return null;
    }
    if (c.errors['required']) {
      return 'Campo obligatorio';
    }
    if (c.errors['email']) {
      return 'Correo no válido';
    }
    if (c.errors['minlength']) {
      return `Mínimo ${c.errors['minlength'].requiredLength} caracteres`;
    }
    if (c.errors['pattern'] && name === 'newPassword') {
      return 'Debe incluir mayúscula, minúscula y número (mín. 8 caracteres)';
    }
    if (c.errors['maxlength']) {
      return 'Texto demasiado largo';
    }
    return null;
  }

  passwordMismatchError(): boolean {
    return (
      this.passwordForm.touched &&
      this.passwordForm.hasError('passwordMismatch') &&
      !!this.passwordForm.get('confirmPassword')?.value
    );
  }
}
