import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { DeviceService } from '../../../Services/device/device.service';
import { Device } from '../../../shared/models/device';
import { UserLinkService } from '../../../Services/user-link/user-link.service';
import { forkJoin, Observable } from 'rxjs';
import { SecureStorageService } from '../../../Services/storage/secure-storage.service';

@Component({
  selector: 'app-link-user-dialog',
  templateUrl: './link-user-dialog.component.html',
  styleUrls: ['./link-user-dialog.component.css']
})
export class LinkUserDialogComponent implements OnInit {
  @Input() display: boolean = false;
  @Input() userId: number | null | undefined = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() linkDevicesEvent = new EventEmitter<{ success: boolean, message: string }>();

  devices: Device[] = [];
  selectedDevices: Device[] = [];
  initialSelectedDevices: Device[] = [];
  private _id: number | undefined;

  constructor(
    private deviceService: DeviceService,
    private userLinkService: UserLinkService,
    private secureStorage: SecureStorageService
  ) {}

  ngOnInit(): void {
    const sessionData = this.secureStorage.getDecryptedItem('sessionData');
    if (sessionData) {
      this._id = sessionData.id;
      }
    if (this.display && this.userId) {
      this.loadDevices();
    }
  }

  ngOnChanges(): void {
    if (this.display && this.userId) {
      this.loadDevices();
    }
  }

  loadDevices(): void {
    if (this.userId) {
      forkJoin([
        this.deviceService.getDevices({ all: true }),
        this.deviceService.getDevices({ userId: this.userId })
      ]).subscribe({
        next: ([allDevices, userDevices]) => {
          this.devices = allDevices.filter(device =>
            !device.attributes.Linked
          );
          this.devices.push(...userDevices);
          this.devices.forEach(device => {
            console.log("userDevices",userDevices);

            console.log("userDevices.some(userDevice => userDevice.id === this.userId)",userDevices.some(userDevice => userDevice.id === this.userId));
          console.log("!device.attributes.Linked",!device.attributes.Linked);
          });

          this.selectedDevices = allDevices.filter(device =>
            userDevices.some(userDevice => userDevice.id === device.id)
          );
          this.initialSelectedDevices = [...this.selectedDevices];
          },
        error: (error) => {
          console.error('Failed to load devices or user devices', error);
        }
      });
    } else {
      this.deviceService.getDevices({ all: true }).subscribe({
        next: (devices) => {
          this.devices = devices;
        },
        error: (error) => {
          console.error('Failed to load devices', error);
        }
      });
    }
  }

  linkDevices(): void {
    if (this.userId) {
      const addObservables: Observable<any>[] = [];
      const removeObservables: Observable<any>[] = [];
      this.selectedDevices.forEach(device => {
        if (!this.initialSelectedDevices.some(d => d.id === device.id)) {
          addObservables.push(this.userLinkService.AddPermession(this.userId!, device.id, this._id));
        }
      });
      this.initialSelectedDevices.forEach(device => {
        if (!this.selectedDevices.some(d => d.id === device.id)) {
          device.attributes.Linked=false;
          this.deviceService.updateDevice(device).subscribe(responses => {
            console.log('responses', responses);

          })
          removeObservables.push(this.userLinkService.RevokePermession(this.userId!, device.id, this._id));
        }
      });
      forkJoin([...addObservables, ...removeObservables]).subscribe({
        next: (responses) => {
          let device :Device;
          this.selectedDevices.forEach(element => {
            element.attributes['LinkerId'] = this._id;
            element.attributes['Linked']=true
            this.deviceService.updateDevice(element).subscribe(responses => {

            });

          });
          // this.deviceService.getDevices({ id:this.selectedDevices[0].id }).subscribe();
          this.linkDevicesEvent.emit({ success: true, message: 'User linked successfully.' });
          this.closeDialog();
        },
        error: (error) => {
          this.linkDevicesEvent.emit({ success: false, message: 'Failed to link devices.' });
          console.error('Failed to update devices', error);
        }
      });
    }
  }

  closeDialog(): void {
    this.onClose.emit();
  }
}
