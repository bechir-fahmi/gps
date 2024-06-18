import { Component, OnInit, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { Device } from '../../shared/models/device';
import { Position } from '../../shared/models/position';
import { GoogleMap } from '@angular/google-maps';
import { DeviceService } from '../../Services/device/device.service';
import { GoogleMapsLoaderService } from '../../Services/google-map-loader/google-maps-loader.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
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
  isZooming = false; // Define the isZooming property
  deviceListOpen = false; // State to toggle the device list

  constructor(
    private deviceService: DeviceService,
    private mapsLoader: GoogleMapsLoaderService,
    private ngZone: NgZone
  ) { }

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
      this.infoWindow = new google.maps.InfoWindow(); // Initialize InfoWindow

      // Listen for custom 'closeInfoWindow' event to close the InfoWindow
      window.addEventListener('closeInfoWindow', () => {
        this.ngZone.run(() => {
          this.infoWindow.close();
        });
      });

      // Listen for custom events for replay, stop, start actions
      window.addEventListener('replayAction', () => {
        this.ngZone.run(() => {
          console.log('Replay action triggered');
        });
      });

      window.addEventListener('stopAction', () => {
        this.ngZone.run(() => {
          console.log('Stop action triggered');
        });
      });

      window.addEventListener('startAction', () => {
        this.ngZone.run(() => {
          console.log('Start action triggered');
        });
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
    });
  }

  addMarker(device: Device, position: Position): void {
    const positionLatLng = { lat: position.latitude, lng: position.longitude };

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

    const speedElement = document.createElement('div');
    speedElement.innerText = `Speed: ${position.speed} km/h`;
    speedElement.style.backgroundColor = 'white';
    speedElement.style.padding = '2px 5px';
    speedElement.style.borderRadius = '3px';
    speedElement.style.boxShadow = '0px 0px 2px rgba(0, 0, 0, 0.3)';
    speedElement.style.marginBottom = '5px';
    speedElement.style.fontSize = '12px';

    const icon = document.createElement('img');
    icon.src = this.carIcon;
    icon.style.width = '50px';
    icon.style.height = '50px';
    icon.style.transform = `rotate(${position.course}deg)`; // Rotate icon based on course

    wrapper.appendChild(nameElement);
    wrapper.appendChild(speedElement);
    wrapper.appendChild(icon);

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map: this.map,
      position: positionLatLng,
      title: device.name,
      content: wrapper,
    });

    marker.addListener('click', () => {
      this.onMarkerClick({ device, position });
    });

    this.markers.set(device.id, marker);
  }

  updateMarkers(positions: Position[]): void {
    positions.forEach(position => {
      const marker = this.markers.get(position.deviceId);
      if (marker) {
        const newPosition = { lat: position.latitude, lng: position.longitude };
        marker.position = newPosition;

        if (marker.content instanceof HTMLElement) {
          const nameElement = marker.content.querySelector('div:nth-child(1)');
          if (nameElement instanceof HTMLElement) {
            nameElement.innerText = this.devicesWithPositions.find(d => d.device.id === position.deviceId)?.device.name || '';
          }

          const speedElement = marker.content.querySelector('div:nth-child(2)');
          if (speedElement instanceof HTMLElement) {
            speedElement.innerText = `Speed: ${position.speed} km/h`;
          }

          const icon = marker.content.querySelector('img');
          if (icon instanceof HTMLElement) {
            icon.style.transform = `rotate(${position.course}deg)`;
          }
        }

        if (this.selectedDevice && this.selectedDevice.device.id === position.deviceId) {
          this.center = { lat: position.latitude, lng: position.longitude };
          this.map.panTo(this.center);
        }
      } else {
        const device = this.devicesWithPositions.find(d => d.device.id === position.deviceId)!.device;
        this.addMarker(device, position);
      }
    });
  }

  onMarkerClick(selected: { device: Device, position: Position }): void {
    this.selectedDevice = selected;

    const content = document.createElement('div');
    content.className = 'info-window-content';

    const title = document.createElement('h3');
    title.textContent = selected.device.name;
    content.appendChild(title);

    const speed = document.createElement('p');
    speed.innerHTML = `<strong>Speed:</strong> ${selected.position.speed} km/h`;
    content.appendChild(speed);

    const latitude = document.createElement('p');
    latitude.innerHTML = `<strong>Latitude:</strong> ${selected.position.latitude}`;
    content.appendChild(latitude);

    const longitude = document.createElement('p');
    longitude.innerHTML = `<strong>Longitude:</strong> ${selected.position.longitude}`;
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
    replayButton.addEventListener('click', () => window.dispatchEvent(new Event('replayAction')));
    buttonsDiv.appendChild(replayButton);

    content.appendChild(buttonsDiv);

    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, this.markers.get(selected.device.id));
  }

  onDeviceSelected(device: Device): void {
    const selectedDevice = this.devicesWithPositions.find(d => d.device.id === device.id);
    if (selectedDevice) {
      this.selectedDevice = selectedDevice;
      this.center = { lat: selectedDevice.position.latitude, lng: selectedDevice.position.longitude };
      if (!this.isZooming) {
        this.smoothZoom(this.defaultZoom, () => {
          this.map?.panTo(this.center);
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

    const increment = targetZoom > currentZoom ? 1 : -2;  // Smaller increment for smoother zoom
    this.isZooming = true;
    const interval = setInterval(() => {
      const newZoom = this.map.getZoom()! + increment;
      this.map.setZoom(newZoom);

      if ((increment > 0 && newZoom >= targetZoom) || (increment < 0 && newZoom <= targetZoom)) {
        clearInterval(interval);
        this.isZooming = false;
        callback();
      }
    }, 100);  // Faster interval for smoother effect
  }

  toggleDeviceList(): void {
    this.deviceListOpen = !this.deviceListOpen;
  }
}
