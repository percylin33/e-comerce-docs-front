import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SelectedUser, UserData } from '../../../@core/interfaces/users';

@Component({
  selector: 'ngx-form-users',
  templateUrl: './form-users.component.html',
  styleUrls: ['./form-users.component.scss']
})
export class FormUsersComponent implements OnInit {
  selectedUsers: SelectedUser[] = [];
  mode: 'delete' | 'changeRole';
  roles: string[] = ['ADMIN', 'SUPADMIN', 'PROMOTOR'];
  selectedRole: string = '';
  idAdmin: string = '';
  descuento: string = ''; // Propiedad para el primer número
  abono: string = ''; // Propiedad para el segundo número

  constructor(protected ref: MatDialogRef<FormUsersComponent>,
              @Inject(MAT_DIALOG_DATA) public dialogData: { selectedUsers: SelectedUser[], mode: 'delete' | 'changeRole' },
              private users: UserData
  ) { }

  ngOnInit(): void {
    this.selectedUsers = this.dialogData.selectedUsers;
    this.mode = this.dialogData.mode;
  }

  confirmDelete() {
    for (let user of this.selectedUsers) {
      this.users.delete(user.id).subscribe((response) => {
        if (response.status === 200) {
          this.ref.close();
        }
      });
    }
  }

  confirmChangeRole() {
    const admin = localStorage.getItem('currentUser');
    this.idAdmin = JSON.parse(admin).id;
   
    for (let user of this.selectedUsers) {
      const updatedData = {
        id : user.id,
        rol: this.selectedRole, 
        descuento: this.descuento, 
        abono: this.abono 
      };
      this.users.updateRoles(this.idAdmin, updatedData).subscribe((response) => {
        if (response.status === 200) {
          this.ref.close();
        }
      });
    }
  }

  cancel() {
    this.ref.close();
  }
}