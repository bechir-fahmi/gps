import { Component } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { User } from '../../shared/models/user';
import { UserService } from '../../Services/users/user.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  providers: [MessageService, ConfirmationService],
})
export class UsersComponent {
 users: User[] = [];
  loading: boolean = true;
  selectedUser: User | null = null;
  displayDialog: boolean = false;

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
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
      map: '',
      latitude: 0,
      longitude: 0,
      zoom: 0,
      password: '',
      twelveHourFormat: false,
      coordinateFormat: '',
      disabled: false,
      expirationTime: '',
      deviceLimit: -1,
      userLimit: 0,
      deviceReadonly: false,
      limitCommands: false,
      fixedEmail: false,
      poiLayer: '',
      attributes: {}
    };
    this.displayDialog = true;
  }

  showDialogToEdit(user: User): void {
    this.selectedUser = { ...user };
    this.displayDialog = true;
  }

  saveUser(user: User): void {
    if (user.id === 0) {
      this.userService.createUser(user).subscribe(
        (newUser) => {
          this.users.unshift(newUser);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User added.',
          });
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
}
