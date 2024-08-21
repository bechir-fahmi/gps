import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { Device } from '../../shared/models/device';
import { DeviceService } from '../../Services/device/device.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.css']
})
export class DeviceListComponent implements OnInit {
  devices: Device[] = [];

  @Input() parkingEvents: any[] = [];
  @Output() deviceSelected: EventEmitter<Device> = new EventEmitter<Device>();
  selectedDevices: Set<Device> = new Set();
  @Output() devicesSelected: EventEmitter<Device[]> = new EventEmitter<Device[]>();

  constructor(private deviceService: DeviceService,private router: Router) { }

  ngOnInit(): void {
    this.deviceService.getDevices().subscribe(devices => {
      this.devices = devices;
    });
  }
  onCheckboxChange(device: Device, event: any): void {
    if (event.target.checked) {
      this.selectedDevices.add(device);
    } else {
      this.selectedDevices.delete(device);
    }
    this.devicesSelected.emit(Array.from(this.selectedDevices));
  }

  isDeviceSelected(device: Device): boolean {
    return this.selectedDevices.has(device);
  }
  getStatus(device: Device): string {
    return device.status.charAt(0).toUpperCase() + device.status.slice(1);
  }


  onDeviceClick(device: Device): void {
    this.deviceSelected.emit(device);
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes * 60) % 60);
    return hours > 0
    ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`
    : `${mins} minute${mins > 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
  }

  openSettings(): void {
    this.router.navigate(['/settings']);
  }
}
