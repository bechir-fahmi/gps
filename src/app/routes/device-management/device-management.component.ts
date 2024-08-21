import { Component, ViewChild } from '@angular/core';
import { DeviceService } from '../../Services/device/device.service';
import { Device } from '../../shared/models/device';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SecureStorageService } from '../../Services/storage/secure-storage.service';
import { UserService } from '../../Services/users/user.service';
import { User } from '../../shared/models/user';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-device-management',
  templateUrl: './device-management.component.html',
  styleUrls: ['./device-management.component.css'],
  providers: [ConfirmationService, MessageService]
})
export class DeviceManagementComponent {
  @ViewChild('dt1') dt1!: Table;
  searchValue: string | undefined;
  devices: Device[] = [];
  loading = true;
  displayDialog = false;
  selectedDevice: Device | null = null;
  isAdmin: any;
  isTechnical: any;
  users: { [key: number]: User } = {}; // To store fetched user data by ID

  constructor(
    private deviceService: DeviceService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private securestrorageservice: SecureStorageService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.initializeUserRole();
    this.fetchDevices();
  }

  initializeUserRole(): void {
    const sessionData = this.securestrorageservice.getDecryptedItem('sessionData');
    if (sessionData) {
      this.isAdmin = sessionData.administrator;
      this.isTechnical = sessionData.attributes.isTechnical;
    }
  }

  fetchDevices(): void {
    this.deviceService.getDevices({ all: true }).subscribe(
      (data: Device[]) => {
        this.devices = data;
        this.loading = false;
        this.fetchUsersForDevices();
      },
      (error) => {
        console.error('Failed to load devices', error);
        this.loading = false;
      }
    );
  }

  SaveDevice(device: Device): void {
    if (device.id===0) {
      device.attributes.Linked=false;
      this.deviceService.createDevice(device).subscribe(
        () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Device  created successfully' });
          this.displayDialog = false; // Close the dialog
          this.fetchDevices();

        },
        (error) => {
          console.error('Failed to update device', error);
        }
      );
    } else {
      this.deviceService.updateDevice(device).subscribe(
        () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Device updated successfully' });
          this.displayDialog = false; // Close the dialog
          this.fetchDevices();


        },
        (error) => {
          console.error('Failed to create device', error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create device' });
          this.displayDialog = false;

        }
      );
    }
  }

  fetchUsersForDevices(): void {
    this.devices.forEach((device) => {
      const linkerId = device.attributes?.LinkerId;
      if (linkerId&& linkerId !== undefined) {
        this.userService.getUsers().subscribe(
          (user: any) => {
            this.users[linkerId] = user.filter((u: any) => u.id === linkerId)[0];
          },
          (error) => {
            console.error(`Failed to load user with ID ${linkerId}`, error);
          }
        );
      }
    });
  }

  showAddDialog(): void {
    this.selectedDevice = null;
    this.displayDialog = true;
  }

  showEditDialog(device: Device): void {
    this.selectedDevice = { ...device };
    this.displayDialog = true;
  }

  deleteDevice(id: number): void {
    this.deviceService.deleteDevice(id).subscribe(
      () => {
        this.devices = this.devices.filter(device => device.id !== id);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Device deleted successfully' });
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete device' });
      }
    );
  }

  confirmDelete(device: Device): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${device.name}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteDevice(device.id);
      },
      reject: () => {
        this.messageService.add({ severity: 'info', summary: 'Cancelled', detail: 'Delete operation cancelled' });
      }
    });
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
