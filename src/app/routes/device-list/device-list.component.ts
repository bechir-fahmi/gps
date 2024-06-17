import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Device } from '../../shared/models/device';
import { DeviceService } from '../../Services/device/device.service';

@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.css']
})
export class DeviceListComponent implements OnInit {
  devices: Device[] = [];

  @Output() deviceSelected: EventEmitter<Device> = new EventEmitter<Device>();

  constructor(private deviceService: DeviceService) { }

  ngOnInit(): void {
    this.deviceService.getDevices().subscribe(devices => {
      this.devices = devices;
    });
  }

  getStatus(device: Device): string {
    return device.status.charAt(0).toUpperCase() + device.status.slice(1);
  }

  onDeviceClick(device: Device): void {
    this.deviceSelected.emit(device);
  }
}
