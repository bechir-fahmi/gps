import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { Device } from '../../shared/models/device';
import { DeviceService } from '../../Services/device/device.service';

@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.css']
})
export class DeviceListComponent implements OnInit {
  devices: Device[] = [];

  @Input() parkingEvents: any[] = [];
  @Output() deviceSelected: EventEmitter<Device> = new EventEmitter<Device>();

  constructor(private deviceService: DeviceService) { }
  /**
   * Initializes the component and retrieves a list of devices from the device service.
   *
   * This function subscribes to the `getDevices()` method of the `deviceService` and assigns the resulting devices to the `devices` property of the component.
   *
   * @return {void} This function does not return a value.
   */
  ngOnInit(): void {
    this.deviceService.getDevices().subscribe(devices => {
      this.devices = devices;
    });
  }

    /**
   * Returns the status of a device with the first letter capitalized.
   *
   * @param {Device} device - The device object to get the status from.
   * @return {string} The status of the device with the first letter capitalized.
   */
  getStatus(device: Device): string {
    return device.status.charAt(0).toUpperCase() + device.status.slice(1);
  }

    /**
   * Emits the selected device when a device is clicked.
   *
   * @param {Device} device - The device that was clicked.
   * @return {void} This function does not return a value.
   */
  onDeviceClick(device: Device): void {
    this.deviceSelected.emit(device);
  }

    /**
   * Formats the given number of minutes into a human-readable duration string.
   *
   * @param {number} minutes - The number of minutes to format.
   * @return {string} The formatted duration string.
   */
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes * 60) % 60);
    return hours > 0
    ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`
    : `${mins} minute${mins > 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
  }
}
