import { Component, ViewChild } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { User } from '../../shared/models/user';
import { UserService } from '../../Services/users/user.service';
import { SecureStorageService } from '../../Services/storage/secure-storage.service';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  providers: [MessageService, ConfirmationService],
})
export class UsersComponent {
  @ViewChild('dt1') dt1!: Table;
  users: User[] = [];
  loading: boolean = true;
  selectedUser: User | null = null;
  displayDialog: boolean = false;
  displayLinkDialog: boolean = false;
  isTechnical: any;
  isAdmin: any;
  searchValue: string | undefined;
  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private secureStorageService: SecureStorageService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
    this.initializeUserRole();
  }

  initializeUserRole(): void {
    const sessionData = this.secureStorageService.getDecryptedItem('sessionData');
    if (sessionData) {
      this.isAdmin = sessionData.administrator;
      this.isTechnical = sessionData.attributes.isTechnical;
    }
  }

ngOnChanges(): void {
  this.loadUsers();
}
  loadUsers(userId?: string): void {
    this.userService.getUsers(userId).subscribe(
      (data: User[]) => {
        this.users = data;
        this.loading = false;
      },
      (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users.',
        });
      }
    );
  }

  showDialogToAdd(): void {
    this.selectedUser = {
      id: 0,
      name: '',
      email: '',
      phone: '',
      readonly: false,
      administrator: false,
      map: null,
      latitude: 0,
      longitude: 0,
      zoom: 0,
      password: '',
      coordinateFormat: null,
      disabled: false,
      expirationTime: null,
      deviceLimit: -1,
      userLimit: 0,
      deviceReadonly: false,
      limitCommands: false,
      fixedEmail: false,
      poiLayer: null,
      attributes: { isTechnical: false }
    };
    this.displayDialog = true;
  }

  showDialogToEdit(user: User): void {
    this.selectedUser = { ...user };
    this.displayDialog = true;
  }

  saveUser(user: User): void {
    if (user.id === 0) {
      if (user.attributes['isTechnical'] === true) {
        user.administrator = true;
      }
      if (user.email === '' || user.email === null || user.email === undefined) {
        user.email = user.name + '@amena.com';
      }
      this.userService.createUser(user).subscribe(
        (newUser) => {
          this.users.unshift(newUser);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User added.',
          });
          this.clearFilter();
        },
        (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add user.',
          });
        }
      );
    } else {
      this.userService.updateUser(user.id, user).subscribe(
        (updatedUser) => {
          const index = this.users.findIndex(u => u.id === updatedUser.id);
          this.users[index] = updatedUser;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User updated.',
          });
          this.clearFilter();
        },
        (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update user.',
          });
        }
      );
    }
    this.displayDialog = false;
  }

  deleteUser(user: User): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${user.name}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.userService.deleteUser(user.id).subscribe(
          () => {
            this.users = this.users.filter(u => u.id !== user.id);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'User deleted.',
            });
          },
          (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete user.',
            });
          }
        );
      },
      reject: () => {
        this.messageService.add({ severity: 'info', summary: 'Cancelled', detail: 'You have cancelled the operation' });
      }
    });
  }

  linkUser(user: User): void {
    if (user.id !== undefined) {
      this.selectedUser = user;
      this.displayLinkDialog = true;
    } else {
      console.error('User ID is undefined');
    }
  }

  onLinkDevicesEvent(event: { success: boolean, message: string }): void {
    this.messageService.add({
      severity: event.success ? 'success' : 'error',
      summary: event.success ? 'Success' : 'Error',
      detail: event.message,
    });
    this.displayLinkDialog = false;
  }
  clearFilter(): void {
    if (this.dt1) {
      this.dt1.reset(); // Clear table filter and pagination
    }
  }
  onInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.dt1.filterGlobal(inputElement.value, 'contains');
  }
}
