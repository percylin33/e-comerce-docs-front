import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { SelectedUser, UserData } from '../../@core/interfaces/users';
import { User } from '../../@core/interfaces/users';
import { UsersService } from '../../@core/backend/services/users.service';
import { catchError, debounceTime, distinctUntilChanged, switchMap, take, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { FormUsersComponent } from './form-users/form-users.component';
import { MatPaginator } from '@angular/material/paginator';
import { of, Subject } from 'rxjs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CustomTableComponent } from '../../shared/component/custom-table/custom-table.component';

@Component({
    selector: 'ngx-users-management',
    templateUrl: './users-management.component.html',
    styleUrls: ['./users-management.component.scss'],
    standalone: true,
    imports: [MatFormField, MatLabel, MatInput, MatProgressSpinner, MatButton, MatIcon, CustomTableComponent, MatPaginator]
})
export class UsersManagementComponent implements OnInit {
  private users = inject(UserData);
  private usersService = inject(UsersService);
  private dialogService = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  user!: User[];
  padre: string = "users-management"
  userSelection: SelectedUser[] = [];
  enableDelete: boolean = false;
  enableChangeRole: boolean = false;
  countDelete: number = 0;
  ready: boolean = false;
  isSupAdmin: boolean = false; 
  currentUser: any = null; // Nueva propiedad para el usuario actual 

  // Propiedades para ordenamiento
  currentSortBy: string = 'id';
  currentSortDirection: string = 'DESC';

  dataSource: MatTableDataSource<User> = new MatTableDataSource<User>();
  totalItems: number = 0;
  currentPage: number = 1;
  pageSize: number = 6;

  private searchSubject = new Subject<string>(); // Subject para manejar las búsquedas
  isLoading: boolean = false; // Indicador de carga

  structTable = [
    {title: "Usuario", column: "name", sortable: true},
    {title: "Email", column: "email", sortable: true},
    {title: "Teléfono", column: "phone", sortable: false},
    { title: "Rol", column: "roles", sortable: true },
    {title: "Total compras", column: "totalFacturas", sortable: true},
    {title: "Total pagado", column: "totalPagado", sortable: true},
    {title: "", column: "id", sortable: false}
  ]

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;

    // Configura el flujo de búsqueda
    this.searchSubject.pipe(
      debounceTime(500), // Espera 300ms después de que el usuario deje de escribir
      distinctUntilChanged(), // Evita solicitudes si el término no ha cambiado
      switchMap((searchTerm: string) => {
        if (searchTerm.trim() === '') {
          // Si el campo está vacío, devuelve la lista completa de usuarios
          this.currentPage = 1;
          return this.users.getUsers(this.currentPage, this.pageSize);
        } else {
          // Realiza la búsqueda
          this.isLoading = true;
          this.currentPage = 1;
          return this.users.searchUser(searchTerm).pipe(
            catchError((error) => {
              console.error('Error al buscar usuarios:', error);
              this.isLoading = false;
              return of({ data: [], pagination: { cantidadDeDocumentos: 0, paginaActual: 1 } }); // Devuelve un resultado vacío en caso de error
            })
          );
        }
      })
    ).subscribe((data) => {
      this.isLoading = false;
      this.user = data.data;
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


    this.getUsers(this.currentPage, this.pageSize);
  }

  getUsers(page: number, pageSize: number): void {
    this.ready = false;
    this.usersService.getUsers(page, pageSize, this.currentSortBy, this.currentSortDirection).subscribe((data) => {
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
      this.currentUser = userData; // Almacenar el usuario completo
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
        name: selectedUser?.name ?? '',
        roles: selectedUser?.roles ?? []
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

  onEditUserClick(userId: any): void {
    if (!this.isSupAdmin) {
      return;
    }

    const user = this.user.find(u => String(u.id) === String(userId));
    if (!user) return;

    this.dialogService.open(FormUsersComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: { user, mode: 'edit' },
    }).afterClosed().subscribe((result: any) => {
      // Recargar la lista para reflejar cambios en nombre/email/país.
      this.getUsers(this.currentPage, this.pageSize);
    });
  }

  onSearch(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const searchTerm = inputElement.value;
    this.searchSubject.next(searchTerm); // Envía el término de búsqueda al Subject
  }

  onSortChange(sortEvent: Sort): void {
    
    if (sortEvent.active && sortEvent.direction) {
      // Mapear los nombres de columnas del frontend al backend para usuarios
      const fieldMapping: { [key: string]: string } = {
        'name': 'firstname',        // name del frontend -> firstname en UserEntity
        'email': 'email',           // email ya es correcto
        'roles': 'roles',           // roles para ordenamiento por rol
        'totalFacturas': 'paymentCount',     // totalFacturas -> paymentCount
        'totalPagado': 'totalAmountPaid'     // totalPagado -> totalAmountPaid
      };

      this.currentSortBy = fieldMapping[sortEvent.active] || sortEvent.active;
      this.currentSortDirection = sortEvent.direction.toUpperCase();
      
      // Resetear a la primera página cuando cambie el ordenamiento
      this.currentPage = 1;
      
      // Recargar datos con nuevo ordenamiento
      this.getUsers(this.currentPage, this.pageSize);
    }
  }

}
