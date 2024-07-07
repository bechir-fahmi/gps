import { Component, OnInit, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { Device } from '../../shared/models/device';
import { Position } from '../../shared/models/position';
import { GoogleMap } from '@angular/google-maps';
import { DeviceService } from '../../Services/device/device.service';
import { GoogleMapsLoaderService } from '../../Services/google-map-loader/google-maps-loader.service';
import { CommandsService } from '../../Services/commands/commands.service';
import { Command } from '../../shared/models/command';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MatDialog } from '@angular/material/dialog';
import { DateRangeDialogComponent } from '../date-range-dialog/date-range-dialog.component';
import { ParkingDetectionService } from '../../Services/parking/parking-detection.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  providers: [MessageService,ConfirmationService]
})
export class MapComponent implements OnInit, AfterViewInit {
  @ViewChild('mapElement', { static: false }) mapElement!: GoogleMap;

  devicesWithPositions: { device: Device, position: Position }[] = [];
  center: google.maps.LatLngLiteral = { lat: 36.8448198, lng: 10.0297012 };
  zoom = 4;
  defaultZoom = 15;
  selectedDevice: { device: Device, position: Position } | null = null;
  map!: google.maps.Map;
  markers: Map<number, google.maps.marker.AdvancedMarkerElement> = new Map();
  mapId: string = "bdf0595e5330a4d";
  carIcon: string = '../../../assets/images/icons8-voiture-50.png';
  parkingIcon: string = 'https://t4.ftcdn.net/jpg/01/92/38/33/360_F_192383331_4RSRvuUk5OQ0Td04bRGkGw1VJ4PO9lW3.jpg';
  infoWindow!: google.maps.InfoWindow;
  isZooming = false;
  deviceListOpen = false;
  replaying = false;
  following = false;  // New state to track if a device is being followed
  trajectory: google.maps.Polyline | null = null;
  replayTimer: any;
  stopAutoFollow = false;
  fromDate: string;
  toDate: string;
  replayMarker: google.maps.marker.AdvancedMarkerElement | null = null;
  trajectoryPolyline: google.maps.Polyline | null = null;
  trajectoryPath: google.maps.LatLngLiteral[] = [];
  polylines: Map<number, google.maps.Polyline> = new Map();
  disableAutoFollow = false;
  isPlaying = false;
  speed: number = 0;
  currentDatetime: string = '';
  private animationFrameId: number | null = null;
  private replayInterval: number = 3000; // Milliseconds between each replay step
  private currentReplayIndex: number = 0;
  private parkingMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
  parkingEvents: any[] = []; // Store parking events
  showParkingHistory = true; // Show or hide parking history
  private apiKey: string = environment.googleMapsApiKey;

  constructor(
    private dialog: MatDialog,
    private deviceService: DeviceService,
    private mapsLoader: GoogleMapsLoaderService,
    private ngZone: NgZone,
    private commandService: CommandsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private parkingDetectionService: ParkingDetectionService // Inject ParkingDetectionService
  ) {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    this.fromDate = lastWeek.toISOString().split('T')[0] + 'T00:00:00Z';
    this.toDate = today.toISOString().split('T')[0] + 'T23:59:59Z';
  }

  ngOnInit(): void {
    this.deviceService.getDevicesWithPositions().subscribe(data => {
      this.devicesWithPositions = data;
      this.initializeMarkers();

      this.deviceService.positions$.subscribe(positions => {
        this.updateMarkers(positions);
      });
    });
  }

  ngAfterViewInit(): void {
    this.mapsLoader.load().then(() => {
      this.map = this.mapElement.googleMap!;
      this.initializeMarkers();
      this.infoWindow = new google.maps.InfoWindow();

      window.addEventListener('replayAction', (event: any) => {
        this.ngZone.run(() => {
          const dialogRef = this.dialog.open(DateRangeDialogComponent, {
            width: 'auto',
            data: { fromDate: this.fromDate, toDate: this.toDate }
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result && this.selectedDevice) {
              const { fromDate, toDate } = result;
              this.startReplay(this.selectedDevice.device.id, fromDate, toDate);
            }
          });
        });
      });

      window.addEventListener('stopAction', () => {
        this.ngZone.run(() => {
          if (this.selectedDevice) {
            this.stopCar(this.selectedDevice.device.id, "engineStop");
          }
        });
      });

      window.addEventListener('startAction', () => {
        this.ngZone.run(() => {
          if (this.selectedDevice) {
            this.startCar(this.selectedDevice.device.id, "engineResume");
          }
        });
      });

      this.map.addListener('dragstart', () => {
        this.stopAutoFollow = true;
      });

      // Add an event listener for zoom changes
      this.map.addListener('zoom_changed', () => {
        this.updateMarkerSize();
      });

      // Initial update of marker size based on the current zoom level
      this.updateMarkerSize();

    }).catch(error => {
      console.error('Google Maps API loading error:', error);
    });
  }

  get devices(): Device[] {
    return this.devicesWithPositions.map(d => d.device);
  }

  initializeMarkers(): void {
    if (!google.maps.marker.AdvancedMarkerElement) {
      console.error('AdvancedMarkerElement is not available. Ensure you have included the marker library in your Google Maps script.');
      return;
    }

    this.devicesWithPositions.forEach(({ device, position }) => {
      this.addMarker(device, position);

      const polyline = new google.maps.Polyline({
        path: [new google.maps.LatLng(position.latitude, position.longitude)],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
      });
      polyline.setMap(this.map);
      this.polylines.set(device.id, polyline);
    });
  }

  addMarker(device: Device, position: Position): void {
    const positionLatLng = new google.maps.LatLng(position.latitude, position.longitude);

    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';

    const nameElement = document.createElement('div');
    nameElement.innerText = device.name;
    nameElement.style.backgroundColor = 'white';
    nameElement.style.padding = '2px 5px';
    nameElement.style.borderRadius = '3px';
    nameElement.style.boxShadow = '0px 0px 2px rgba(0, 0, 0, 0.3)';
    nameElement.style.marginBottom = '2px';
    nameElement.style.fontSize = '12px';
    nameElement.style.fontWeight = 'bold';

    const icon = document.createElement('img');
    icon.src = this.carIcon;
    icon.style.width = '50px';
    icon.style.height = '50px';
    icon.style.transform = `rotate(${position.course}deg)`;

    wrapper.appendChild(nameElement);
    wrapper.appendChild(icon);

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map: this.map,
      position: positionLatLng,
      title: device.name,
      content: wrapper,
    });

    marker.addListener('click', () => {
      if (!this.replaying) {
        this.onMarkerClick({ device, position });
      }
    });

    this.markers.set(device.id, marker);

    const polyline = this.polylines.get(device.id);
    if (polyline) {
      const path = polyline.getPath();
      path.push(positionLatLng);
    }
    this.updateMarkerSize();
  }

  updateMarkers(positions: Position[]): void {
    if (this.replaying) return;
    positions.forEach(position => {
      const marker = this.markers.get(position.deviceId);
      if (marker) {
        const newPosition = new google.maps.LatLng(position.latitude, position.longitude);
        marker.position = newPosition;

        if (marker.content instanceof HTMLElement) {
          const nameElement = marker.content.querySelector('div:nth-child(1)') as HTMLElement;
          if (nameElement) {
            nameElement.innerText = this.devicesWithPositions.find(d => d.device.id === position.deviceId)?.device.name || '';
          }

          const icon = marker.content.querySelector('img') as HTMLElement;
          if (icon) {
            icon.style.transform = `rotate(${position.course}deg)`;
          }
        }

        const polyline = this.polylines.get(position.deviceId);
        if (polyline) {
          const path = polyline.getPath();
          path.push(newPosition);
        }

        if (this.selectedDevice && this.selectedDevice.device.id === position.deviceId && !this.stopAutoFollow) {
          this.center = { lat: position.latitude, lng: position.longitude };
          this.map.panTo(this.center);
        }
      } else {
        const device = this.devicesWithPositions.find(d => d.device.id === position.deviceId)!.device;
        this.addMarker(device, position);

        const polyline = new google.maps.Polyline({
          path: [new google.maps.LatLng(position.latitude, position.longitude)],
          geodesic: true,
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 2
        });
        polyline.setMap(this.map);
        this.polylines.set(position.deviceId, polyline);
      }
    });
  }

  removeAllMarkers(): void {
    this.markers.forEach(marker => {
      marker.map = null;
      marker.content = null;
    });
    this.markers.clear();

    this.polylines.forEach(polyline => polyline.setMap(null));
    this.polylines.clear();
  }

  async onMarkerClick(selectedDevice: { device: Device, position: Position }) {
    this.selectedDevice = selectedDevice;
    const position = { lat: selectedDevice.position.latitude, lng: selectedDevice.position.longitude };

    if (!this.infoWindow) {
      this.infoWindow = new google.maps.InfoWindow();
    }
    const content = document.createElement('div');
    content.className = 'info-window-content';

    const title = document.createElement('h3');
    title.textContent = selectedDevice.device.name;
    content.appendChild(title);

    const latitude = document.createElement('p');
    let response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${selectedDevice.position.latitude},${selectedDevice.position.longitude}&key=${this.apiKey}`);
    const data = await response.json();
    let address = '';
    if (data.status === 'OK' && data.results.length > 0) {
      address = this.getFormattedAddress(data);
    } else {
      address = 'Address not found';
    }

    latitude.innerHTML = `<strong>Address:</strong> ${address}`;
    content.appendChild(latitude);

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'info-window-buttons';

    const stopButton = document.createElement('button');
    stopButton.className = 'p-button p-component';
    stopButton.innerHTML = '<span class="p-button-icon pi pi-stop-circle"></span>';
    stopButton.addEventListener('click', () => window.dispatchEvent(new Event('stopAction')));
    buttonsDiv.appendChild(stopButton);

    const startButton = document.createElement('button');
    startButton.className = 'p-button p-component';
    startButton.innerHTML = '<span class="p-button-icon pi pi-play-circle"></span>';
    startButton.addEventListener('click', () => window.dispatchEvent(new Event('startAction')));
    buttonsDiv.appendChild(startButton);

    const replayButton = document.createElement('button');
    replayButton.className = 'p-button p-component';
    replayButton.innerHTML = '<span class="p-button-icon pi pi-replay"></span>';
    replayButton.addEventListener('click', () => {
      const replayEvent = new CustomEvent('replayAction', {
        detail: { deviceId: selectedDevice.device.id, from: this.fromDate, to: this.toDate }
      });
      window.dispatchEvent(replayEvent);
    });
    buttonsDiv.appendChild(replayButton);

    content.appendChild(buttonsDiv);
    this.infoWindow.setPosition(position);
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map);
  }

  startReplay(deviceId: number, from?: string, to?: string): void {
    this.replaying = true;
    this.clearReplay(); // Ensure we clear the previous trajectory and markers
    this.removeAllMarkers();

    this.deviceService.getPositions(deviceId, from, to).subscribe(positions => {
      if (positions.length > 0) {
        const parkings = this.parkingDetectionService.findTourParkings(positions);
        this.displayTrajectory(positions);
        this.displayParkingMarkers(parkings);
        this.currentReplayIndex = 0;
        this.replayMarker = this.createReplayMarker(positions[0]);
        this.isPlaying = true;
        this.animateReplay(positions);

        // Store parking events
        this.parkingEvents = parkings;
        this.getParkingAddresses();
        // Change map position to the first replay marker
        this.map.panTo({ lat: positions[0].latitude, lng: positions[0].longitude });
      } else {
        this.messageService.add({ severity: 'warn', summary: 'No Data', detail: 'No positions found for the selected date range.' });
        this.closeReplay();
        return;
      }
    });
  }

  clearReplay(): void {
    if (this.replayMarker) {
      this.replayMarker.map = null;
      this.replayMarker = null;
    }

    if (this.trajectory) {
      this.trajectory.setMap(null);
      this.trajectory = null;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.currentDatetime = ''; // Clear the date and time display
    this.clearParkingMarkers(); // Clear parking markers
    this.parkingEvents = []; // Clear parking events
  }

  createReplayMarker(position: Position): google.maps.marker.AdvancedMarkerElement {
    const positionLatLng = { lat: position.latitude, lng: position.longitude };

    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';

    const nameElement = document.createElement('div');
    nameElement.style.backgroundColor = 'white';
    nameElement.style.padding = '2px 5px';
    nameElement.style.borderRadius = '3px';
    nameElement.style.boxShadow = '0px 0px 2px rgba(0, 0, 0, 0.3)';
    nameElement.style.marginBottom = '2px';
    nameElement.style.fontSize = '12px';
    nameElement.style.fontWeight = 'bold';

    const icon = document.createElement('img');
    icon.src = this.carIcon;
    icon.style.width = '50px';
    icon.style.height = '50px';
    icon.style.transform = `rotate(${position.course}deg)`;

    wrapper.appendChild(nameElement);
    wrapper.appendChild(icon);

    const replayMarker = new google.maps.marker.AdvancedMarkerElement({
      map: this.map,
      position: positionLatLng,
      content: wrapper,
    });

    return replayMarker;
  }

  updateReplayMarkerPosition(position: Position): void {
    if (this.replayMarker) {
      const newPosition = new google.maps.LatLng(position.latitude, position.longitude);
      this.replayMarker.position = newPosition;

      if (this.replayMarker.content instanceof HTMLElement) {
        const icon = this.replayMarker.content.querySelector('img');
        if (icon instanceof HTMLElement) {
          icon.style.transform = `rotate(${position.course}deg)`;
        }
      }

      this.currentDatetime = this.formatDatetime(position.deviceTime); // Update the date and time
    }
  }

  displayTrajectory(positions: Position[]): void {
    const path = positions.map(pos => ({ lat: pos.latitude, lng: pos.longitude }));
    this.trajectory = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    this.trajectory.setMap(this.map);

    this.trajectory.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        this.ngZone.run(() => {
          const clickedLatLng = event.latLng;
          const clickedIndex = positions.findIndex(pos => pos.latitude === clickedLatLng!.lat() && pos.longitude === clickedLatLng!.lng());
          if (clickedIndex !== -1) {
            this.stopReplay();
            this.clearReplay();
            this.replayMarker = this.createReplayMarker(positions[clickedIndex]);
            this.currentReplayIndex = clickedIndex;
            this.isPlaying = true;
            this.animateReplay(positions);
          }
        });
      }
    });
  }

  displayParkingMarkers(parkings: any): void {
    parkings.forEach((parking: any) => {
      const positionLatLng = new google.maps.LatLng(parking.latitude, parking.longitude);

      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';

      const icon = document.createElement('img');
      icon.src = this.parkingIcon;
      icon.style.width = '20px';
      icon.style.height = '20px';
      icon.className = 'parking-marker'; // Add a class name for parking markers

      wrapper.appendChild(icon);

      const parkingMarker = new google.maps.marker.AdvancedMarkerElement({
        map: this.map,
        position: positionLatLng,
        content: wrapper,
      });

      this.parkingMarkers.push(parkingMarker);
    });
  }

  clearParkingMarkers(): void {
    this.parkingMarkers.forEach(marker => {
      marker.map = null;
    });
    this.parkingMarkers = [];
  }

  playReplay(): void {
    if (this.replayMarker && this.trajectory) {
      this.isPlaying = true;
      const positions = this.trajectory.getPath().getArray().map(latlng => ({
        latitude: latlng.lat(),
        longitude: latlng.lng(),
        deviceTime: new Date(), // Use current time for demo purposes
        deviceId: this.selectedDevice!.device.id // Ensure deviceId is set correctly
      } as Position));

      this.animateReplay(positions, this.currentReplayIndex);
    }
  }

  stopReplay(): void {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  closeReplay(): void {
    this.replaying = false;
    this.following = false;
    this.stopReplay();
    if (this.trajectory) {
      this.trajectory.setMap(null);
      this.trajectory = null;
    }
    this.removeReplayMarker();
    this.clearParkingMarkers();
    this.deviceService.getDevicesWithPositions().subscribe(data => {
      this.devicesWithPositions = data;
      this.initializeMarkers();
    });
  }

  removeReplayMarker(): void {
    if (this.replayMarker) {
      this.replayMarker.map = null;
      this.replayMarker = null;
    }
  }

  startCar(deviceId: number, action: string): void {
      let test: Command = {
      deviceId: deviceId,
      type: action
    };

    this.confirmationService.confirm({
      message: 'Are you sure you want to start the car?',
      header: 'Start Car Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.commandService.DispatchCommand(test).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Command sent successfully' });
          },
          error: (error) => {
            console.error('Failed to send command:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to send command' });
          },
          complete: () => {
            console.log('DispatchCommand complete');
          }
        });
      },
      reject: () => {
        this.messageService.add({ severity: 'info', summary: 'Cancelled', detail: 'You have cancelled the operation' });
      }
    });
  }

  stopCar(deviceId: number, action: string): void {
    let test: Command = {
      deviceId: deviceId,
      type: action
    };

    this.confirmationService.confirm({
      message: 'Are you sure you want to stop the car?',
      header: 'Stop Car Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.commandService.DispatchCommand(test).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Command sent successfully' });
          },
          error: (error) => {
            console.error('Failed to send command:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to send command' });
          },
          complete: () => {
            console.log('DispatchCommand complete');
          }
        });
      },
      reject: () => {
        this.messageService.add({ severity: 'info', summary: 'Cancelled', detail: 'You have cancelled the operation' });
      }
    });
  }
  onDeviceSelected(device: Device): void {
    if (this.replayMarker) {
      this.closeReplay();
    }
    this.toggleDeviceList();
    const selectedDevice = this.devicesWithPositions.find(d => d.device.id === device.id);
    if (selectedDevice) {
      this.selectedDevice = selectedDevice;
      this.center = { lat: selectedDevice.position.latitude, lng: selectedDevice.position.longitude };
      if (!this.isZooming) {
        this.smoothZoom(this.defaultZoom, () => {
          this.map?.panTo(this.center);
          this.stopAutoFollow = true;
        });
      }
      // Start following and display gauge
      this.following = true;
      this.speed = selectedDevice.position.speed! * 1.852;
      this.currentDatetime = this.formatDatetime(selectedDevice.position.deviceTime);
    }
  }

  smoothZoom(targetZoom: number, callback: () => void): void {
    const currentZoom = this.map.getZoom() || this.zoom;
    if (currentZoom === targetZoom) {
      callback();
      return;
    }

    const increment = targetZoom > currentZoom ? 1 : -2;
    this.isZooming = true;
    const interval = setInterval(() => {
      const newZoom = (this.map.getZoom() || 0) + increment;
      this.map.setZoom(newZoom);

      if ((increment > 0 && newZoom >= targetZoom) || (increment < 0 && newZoom <= targetZoom)) {
        clearInterval(interval);
        this.isZooming = false;
        callback();
      }
    }, 100);
  }

  toggleDeviceList(): void {
    this.deviceListOpen = !this.deviceListOpen;
  }

  toggleParkingHistory(): void {
    this.showParkingHistory = !this.showParkingHistory;
  }

  updateReplayDates(newDates: { fromDate: string, toDate: string }): void {
    this.fromDate = newDates.fromDate;
    this.toDate = newDates.toDate;
    if (this.selectedDevice) {
      this.startReplay(this.selectedDevice.device.id, this.fromDate, this.toDate);
    }
  }

  updateMarkerSize(): void {
    const zoomLevel = this.map.getZoom() || this.zoom;
    this.markers.forEach(marker => {
      if (marker.content instanceof HTMLElement) {
        const icon = marker.content.querySelector('img');
        if (icon) {
          if (icon.classList.contains('parking-marker')) {
            icon.style.width = `20px`;
            icon.style.height = `20px`;
          } else {
            const size = Math.max(20, Math.min(50, zoomLevel * 3)); // Adjust size formula as needed
            icon.style.width = `${size}px`;
            icon.style.height = `${size}px`;
          }
        }
      }
    });
  }

  formatDatetime(date?: Date): string {
    return date ? new Date(date).toLocaleString() : '';
  }

  animateReplay(positions: Position[], startIndex: number = 0): void {
    if (startIndex >= positions.length) {
      this.isPlaying = false;
      return;
    }

    const start = positions[startIndex];
    const end = positions[startIndex + 1];

    if (!end) {
      this.isPlaying = false;
      return;
    }

    const duration = this.replayInterval;
    const stepTime = 50; // Time in ms between each step of animation
    const steps = duration / stepTime;
    const latStep = (end.latitude - start.latitude) / steps;
    const lngStep = (end.longitude - start.longitude) / steps;

    let stepCount = 0;

    const step = () => {
      if (!this.isPlaying) return; // Exit if replay is stopped

      if (stepCount < steps) {
        const newLat = start.latitude + latStep * stepCount;
        const newLng = start.longitude + lngStep * stepCount;
        this.updateReplayMarkerPosition({
          ...start,
          latitude: newLat,
          longitude: newLng
        });
        stepCount++;
        this.animationFrameId = requestAnimationFrame(step);
      } else {
        this.currentReplayIndex++;
        this.updateReplayMarkerPosition(end);
        this.updateSpeedAndTime(end);
        this.animateReplay(positions, this.currentReplayIndex);
      }
    };

    step();
  }

  updateSpeedAndTime(position: Position): void {
    this.speed = position.speed! * 1.852; // conv knot to km/h
    this.currentDatetime = this.formatDatetime(position.deviceTime);
  }

  async getParkingAddresses(): Promise<void> {
    for (const parking of this.parkingEvents) {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${parking.latitude},${parking.longitude}&key=${this.apiKey}`);
      const data = await response.json();
      console.log("data", data);

      if (data.status === 'OK' && data.results.length > 0) {
        parking.address = this.getFormattedAddress(data);
      } else {
        parking.address = 'Address not found';
      }
    }
  }

   getFormattedAddress(data: { results: any; }) {
    const results = data.results;

    for (const result of results) {
        if (result.types.includes('street_address')) {
            return result.formatted_address;
        }
    }

    for (const result of results) {
        if (result.types.includes('administrative_area_level_3')) {
            return result.formatted_address;
        }
    }

    for (const result of results) {
        if (result.types.includes('administrative_area_level_1')) {
            return result.formatted_address;
        }
    }

    return 'No address found for the specified types';
}
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}` : `${mins} minute${mins > 1 ? 's' : ''}`;
  }
}
