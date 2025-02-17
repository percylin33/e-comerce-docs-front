import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { title } from 'process';
import { SelectedUser, UserData } from '../../@core/interfaces/users';
import { User } from '../../@core/interfaces/users';
import { take } from 'rxjs-compat/operator/take';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { FormUsersComponent } from './form-users/form-users.component';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'ngx-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss']
})
export class UsersManagementComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  user: User[];
  padre: string = "users-management"
  userSelection: SelectedUser[] = [];
  enableDelete: boolean = false;
  enableChangeRole: boolean = false;
  countDelete: number = 0;
  ready: boolean = false;
  isSupAdmin: boolean = false; 

  dataSource: MatTableDataSource<User> = new MatTableDataSource<User>();
  totalItems: number = 0;
  currentPage: number = 1;
  pageSize: number = 6;

  structTable = [
    {title: "Usuario", column: "name"},
    {title: "Email", column: "email"},
    { title: "Rol", column: "roles" },
    {title: "Total compras", column: "totalFacturas"},
    {title: "Total pagado", column: "totalPagado"},
    {title: "", column: "id"}
  ]

  constructor(private users: UserData,
              private dialogService: MatDialog
  ) {}

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
    this.getUsers(this.currentPage, this.pageSize);
  }

  getUsers(page: number, pageSize: number): void {
    this.ready = false;
    this.users.getUsers(page, pageSize).subscribe((data) => {
      this.ready = true;

      // Transformamos el array de usuarios antes de asignarlo
      const transformedData = data.data.map(usuario => {
        const rolAdmin = usuario.roles.find(rol => rol.name === 'ADMIN');
        
          // Si hay más de dos roles, eliminamos 'USER'
          if (usuario.roles.length > 1) {
            return {
              ...usuario,
              roles: usuario.roles.filter(rol => rol.name !== 'USER'),
            };
          } else {
            // Si no hay 'ADMIN' y no hay más de dos roles, dejamos 'USER' (o lo que necesites conservar)
            const rolUser = usuario.roles.find(rol => rol.name === 'USER');
            return {
              ...usuario,
              roles: rolUser ? [rolUser] : usuario.roles,
            };
          }
        
      });

      console.log('transformedData', transformedData);
      
      this.user = transformedData;
      this.totalItems = data.pagination.cantidadDeDocumentos;
      this.dataSource.data = this.user;
      this.paginator.length = this.totalItems;
      this.paginator.pageIndex = data.pagination.paginaActual - 1;

      this.userSelection = this.user.map(usr => ({
        id: usr.id,
        checked: false,
        name: usr.name,
        roles: usr.roles,
      }));
    });

    // Verificar si el usuario actual tiene el rol SUPADMIN
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      this.isSupAdmin = userData.roles.includes('SUPADMIN');
    }
  }

  onCheckboxChangeInChild(event: { id: string; checked: boolean }) {
    const selectedUser = this.user.find(u => u.id === event.id);
    const item = this.userSelection.find(usr => usr.id === event.id);
    if (item) {
      item.checked = event.checked;
    } else {
      this.userSelection.push({
        id: event.id,
        checked: event.checked,
        name: selectedUser.name,
        roles: selectedUser.roles
      });
    }

    if (event.checked) {
      this.countDelete++;
    } else {
      this.countDelete--;
    }

    this.enableDelete = this.countDelete > 0;
    this.enableChangeRole = this.countDelete > 0;
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getUsers(this.currentPage, this.pageSize);
  }

  onDeleteClick() {
    const selectedUsers = this.userSelection
      .filter(doc => doc.checked === true)

    this.dialogService.open(FormUsersComponent, {
      width: '40%',
      height: '40%',
      data: {selectedUsers, mode: 'delete'},
    }).afterClosed().subscribe((result: any) => { this.getUsers(this.currentPage, this.pageSize); });
    this.enableDelete = false;
    this.enableChangeRole = false;
    this.countDelete = 0;
  }

  onChangeRoleClick() {
    const selectedUsers = this.userSelection
      .filter(usr => usr.checked)

    this.dialogService.open(FormUsersComponent, {
      width: '40%',
      height: '40%',
      data: { selectedUsers, mode: 'changeRole' }, // Pasa el modo 'changeRole'
    }).afterClosed().subscribe(() => {
      this.getUsers(this.currentPage, this.pageSize);
    });

    this.enableChangeRole = false;
    this.enableDelete = false;
    this.countDelete = 0;
    this.userSelection.forEach(usr => (usr.checked = false));
  }

  onSearch(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const userEmail = inputElement.value;

    if (userEmail) {
      this.users.searchUser(userEmail).subscribe((data) => {
        this.user = data.data;
        this.totalItems = data.pagination.cantidadDeDocumentos;
        this.dataSource.data = this.user;
        this.paginator.length = this.totalItems;
        this.paginator.pageIndex = data.pagination.paginaActual - 1;
      });
    } else {
      this.getUsers(this.currentPage, this.pageSize);
    }
  }

}
