import { Component, OnInit, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { Device } from '../../shared/models/device';
import { Position } from '../../shared/models/position';
import { GoogleMap } from '@angular/google-maps';
import { DeviceService } from '../../Services/device/device.service';
import { GoogleMapsLoaderService } from '../../Services/google-map-loader/google-maps-loader.service';
import { CommandsService } from '../../Services/commands/commands.service';
import { Command } from '../../shared/models/command';
import { MessageService } from 'primeng/api';
import { MatDialog } from '@angular/material/dialog';
import { DateRangeDialogComponent } from '../date-range-dialog/date-range-dialog.component';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  providers: [MessageService]
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
  infoWindow!: google.maps.InfoWindow;
  isZooming = false;
  deviceListOpen = false;
  replaying = false;
  trajectory: google.maps.Polyline | null = null;
  replayTimer: any;
  stopAutoFollow = false;
  fromDate: string;
  toDate: string;
  replayMarker: google.maps.marker.AdvancedMarkerElement | null = null;
  trajectoryPolyline: google.maps.Polyline | null = null;
  trajectoryPath: google.maps.LatLngLiteral[] = [];
  polylines: Map<number, google.maps.Polyline> = new Map();
  constructor(private dialog: MatDialog,
    private deviceService: DeviceService,
    private mapsLoader: GoogleMapsLoaderService,
    private ngZone: NgZone,
    private commandService: CommandsService,
    private messageService: MessageService
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

      // Listen for position updates
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
            if (result&&this.selectedDevice) {
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
    }).catch(error => {
      console.error('Google Maps API loading error:', error);
    });
  }

  initializeMarkers(): void {
    if (!google.maps.marker.AdvancedMarkerElement) {
      console.error('AdvancedMarkerElement is not available. Ensure you have included the marker library in your Google Maps script.');
      return;
    }

    this.devicesWithPositions.forEach(({ device, position }) => {
      this.addMarker(device, position);

      // Create a new polyline for each device
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
    icon.style.transform = `rotate(${position.course}deg)`; // Rotate icon based on course

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

    // Add to the polyline path
    const polyline = this.polylines.get(device.id);
    if (polyline) {
      const path = polyline.getPath();
      path.push(positionLatLng);
    }
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

        // Update the corresponding polyline path for the device
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

        // Create a new polyline for the new marker
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

    // Clear all polylines
    this.polylines.forEach(polyline => polyline.setMap(null));
    this.polylines.clear();
  }

  onMarkerClick(selectedDevice: { device: Device, position: Position }) {
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
    latitude.innerHTML = `<strong>Latitude:</strong> ${selectedDevice.position.latitude}`;
    content.appendChild(latitude);

    const longitude = document.createElement('p');
    longitude.innerHTML = `<strong>Longitude:</strong> ${selectedDevice.position.longitude}`;
    content.appendChild(longitude);

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
    // if (this.replaying) {
    //   this.stopReplay();
    // }
    this.replaying = true;
    this.removeAllMarkers();
    this.clearReplay();
    console.log(deviceId, from, to);

    this.deviceService.getPositions(deviceId, from, to).subscribe(positions => {
      if (positions.length > 0) {
        // this.replaying = true;
        // this.removeAllMarkers();
        // this.displayTrajectory(positions);

        let index = 0;
        this.replayMarker = this.createReplayMarker(positions[0]);
        this.replayTimer = setInterval(() => {
          if (index < positions.length) {
            const position = positions[index];
            this.center = { lat: position.latitude, lng: position.longitude };
            this.map.panTo(this.center);
            this.updateReplayMarkerPosition(position);
            index++;
          } else {
            this.stopReplay();
          }
        }, 1000);
      } else {
        this.messageService.add({ severity: 'warn', summary: 'No Data', detail: 'No positions found for the selected date range.' });
        this.replaying = false;
        return;
      }
    });
  }

  clearReplay(): void {
    if (this.replayMarker) {
      this.replayMarker.map = null;
      this.replayMarker = null;
    }

    if (this.trajectoryPolyline) {
      this.trajectoryPolyline.setMap(null);
      this.trajectoryPolyline = null;
    }

    if (this.replayTimer) {
      clearTimeout(this.replayTimer);
      this.replayTimer = null;
    }
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
    icon.style.transform = `rotate(${position.course}deg)`; // Rotate icon based on course

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
      const newPosition = { lat: position.latitude, lng: position.longitude };
      this.replayMarker.position = newPosition;

      if (this.replayMarker.content instanceof HTMLElement) {
        const icon = this.replayMarker.content.querySelector('img');
        if (icon instanceof HTMLElement) {
          icon.style.transform = `rotate(${position.course}deg)`;
        }
      }
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

    const controlsDiv = document.querySelector('.replay-controls') as HTMLElement;
    if (controlsDiv) {
      controlsDiv.style.display = 'block';
    }
  }

  playReplay(): void {
    console.log('playReplay');
    // Add logic to continue the replay if paused
  }

  stopReplay(): void {
    clearInterval(this.replayTimer);
    this.replaying = false;
  }

  closeReplay(): void {
    this.stopReplay();
    if (this.trajectory) {
      this.trajectory.setMap(null);
      this.trajectory = null;
    }
    this.removeReplayMarker();
    this.deviceService.getDevicesWithPositions().subscribe(data => {
      this.devicesWithPositions = data;
      this.initializeMarkers();
    });
    const controlsDiv = document.querySelector('.replay-controls') as HTMLElement;
    if (controlsDiv) {
      controlsDiv.style.display = 'none';
    }
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
    this.commandService.DispatchCommand(test).subscribe(() => {
      console.log("started");
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Engine Resumed', life: 3000 });
    });
  }

  stopCar(deviceId: number, action: string): void {
    let test: Command = {
      deviceId: deviceId,
      type: action
    };
    this.commandService.DispatchCommand(test).subscribe(res => {
      console.log("stopped");
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Engine Stopped', life: 3000 });
    });
  }

  onDeviceSelected(device: Device): void {
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
      const newZoom = this.map.getZoom()! + increment;
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

  updateReplayDates(): void {
    if (this.selectedDevice) {
      this.startReplay(this.selectedDevice.device.id, this.fromDate, this.toDate);
    }
  }
}
