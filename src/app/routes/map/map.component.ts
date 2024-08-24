import { Component, OnInit, ViewChild, AfterViewInit, NgZone, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
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
import { DeviceListComponent } from '../device-list/device-list.component';
import * as L from 'leaflet';

declare const ymaps: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  providers: [MessageService, ConfirmationService]
})
export class MapComponent implements OnInit, AfterViewInit {
  @ViewChild('mapElement', { static: false }) mapElement!: GoogleMap;
  @ViewChild('deviceList') deviceListComponent!: DeviceListComponent;
  @ViewChild('leafletMap', { static: false }) leafletMapElement!: ElementRef | undefined;


  devicesWithPositions: { device: Device, position: Position }[] = [];
  center: google.maps.LatLngLiteral = { lat: 36.8448198, lng: 10.0297012 };
  zoom = 8;
  defaultZoom = 15;
  selectedDevice: { device: Device, position: Position } | null = null;
  googleMap!: google.maps.Map;
  leafletMap!: L.Map;
  yandexMap: any;
  currentMap: string = 'google';
  mapId: string = "bdf0595e5330a4d";
  carIcon: string = '../../../assets/images/icons8-voiture-50.png';
  parkingIcon: string = 'https://t4.ftcdn.net/jpg/01/92/38/33/360_F_192383331_4RSRvuUk5OQ0Td04bRGkGw1VJ4PO9lW3.jpg';
  infoWindow!: google.maps.InfoWindow;
  isZooming = false;
  deviceListOpen = false;
  replaying = false;
  following = false;
  trajectory: google.maps.Polyline | null = null;
  replayTimer: any;
  stopAutoFollow = false;
  fromDate: string;
  toDate: string;
  replayGoogleMarker: google.maps.marker.AdvancedMarkerElement | null = null;
  trajectoryPolyline: google.maps.Polyline | null = null;
  trajectoryPath: Position[] = []; // Store full Position objects
  polylines: Map<number, google.maps.Polyline> = new Map();
  disableAutoFollow = false;
  isPlaying = false;
  speed: number = 0;
  currentDatetime: string = '';
  maxReplayPosition: number = 0;
  currentReplayPosition: number = 0;
  private animationFrameId: number | null = null;
  private replayInterval: number = 3000;
  private currentReplayIndex: number = 0;
  private parkingMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
  private trajectoryMarkers: google.maps.Marker[] = [];
  private trajectoryMarkersLeaflet: L.Layer[] = [];
  parkingEvents: any[] = [];
  showParkingHistory = true;
  private apiKey: string = environment.googleMapsApiKey;
  loading = false;
  gaugeSize: number = 50;
  gaugeThickness: number = 12;
  private lastPanTime: number = 0;
  private throttleDelay: number = 200;
  mapOptions = [
    { label: 'Google Map', value: 'google' },
    { label: 'Leaflet Map', value: 'leaflet' }
  ];
  selectedMap: 'google' | 'leaflet' = 'google';
  markers: Map<number, google.maps.marker.AdvancedMarkerElement | any> = new Map();
  leafletMarkers: Map<number, L.Marker> = new Map();
  replayLeafletMarker: L.Marker | null = null;
  private polyline: L.Polyline | null = null;
  constructor(
    private dialog: MatDialog,
    private deviceService: DeviceService,
    private mapsLoader: GoogleMapsLoaderService,
    private ngZone: NgZone,
    private commandService: CommandsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private parkingDetectionService: ParkingDetectionService, private cd: ChangeDetectorRef
  ) {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    this.fromDate = lastWeek.toISOString().split('T')[0] + 'T00:00:00Z';
    this.toDate = today.toISOString().split('T')[0] + 'T23:59:59Z';
  }
  ngOnInit(): void {
    this.updateGaugeSize();
    this.deviceService.getDevicesWithPositions().subscribe(data => {
      this.devicesWithPositions = data;
      this.initializeMarkers();
      this.deviceService.positions$.subscribe(positions => {
        this.updateMarkers(positions);
      });
    });
  }
  @HostListener('window:resize')
  onResize() {
    this.updateGaugeSize();
  }
  updateGaugeSize() {
    const screenWidth = window.innerWidth;
    if (screenWidth < 768) {
      this.gaugeSize = screenWidth * 0.2;
      this.gaugeThickness = 6;
    } else {
      this.gaugeSize = 100;
      this.gaugeThickness = 12;
    }
  }
  // ngAfterViewInit(): void {
  // this.mapsLoader.load().then(() => {
  //   this.googleMap = this.mapElement.googleMap!;
  //   this.initializeMarkers();
  //   this.infoWindow = new google.maps.InfoWindow();
  //   window.addEventListener('replayAction', (event: any) => {
  //     this.ngZone.run(() => {
  //       const dialogRef = this.dialog.open(DateRangeDialogComponent, {
  //         width: 'auto',
  //         data: { fromDate: this.fromDate, toDate: this.toDate }
  //       });
  //       dialogRef.afterClosed().subscribe(result => {
  //         if (result && this.selectedDevice) {
  //           const { fromDate, toDate } = result;
  //           this.startReplay(this.selectedDevice.device.id, fromDate, toDate);
  //         }
  //       });
  //     });
  //   });
  //   window.addEventListener('stopAction', () => {
  //     this.ngZone.run(() => {
  //       if (this.selectedDevice) {
  //         this.stopCar(this.selectedDevice.device.id, "engineStop");
  //       }
  //     });
  //   });
  //   window.addEventListener('startAction', () => {
  //     this.ngZone.run(() => {
  //       if (this.selectedDevice) {
  //         this.startCar(this.selectedDevice.device.id, "engineResume");
  //       }
  //     });
  //   });
  //   this.googleMap.addListener('dragstart', () => {
  //     this.stopAutoFollow = true;
  //   });
  //   this.googleMap.addListener('zoom_changed', () => {
  //     this.updateMarkerSize();
  //   });
  //   this.updateMarkerSize();
  // }).catch(error => {
  //   console.error('Google Maps API loading error:', error);
  // });
  // }

  ngAfterViewInit(): void {
    if (this.currentMap === 'google') {
      this.loadGoogleMap();
    } else if (this.currentMap === 'leaflet') {
      this.loadLeafletMap();
    }
  }
  get devices(): Device[] {
    return this.devicesWithPositions.map(d => d.device);
  }
  loadGoogleMap(): void {
    this.mapsLoader.load().then(() => {
      this.googleMap = this.mapElement.googleMap!;
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
      this.googleMap.addListener('dragstart', () => {
        this.stopAutoFollow = true;
      });
      this.googleMap.addListener('zoom_changed', () => {
        this.updateMarkerSize();
      });
      this.updateMarkerSize();
    }).catch(error => {
      console.error('Google Maps API loading error:', error);
    });

  }
  async loadLeafletMap(): Promise<void> {
    if (this.leafletMapElement) {
      console.log('Leaflet map element found.');
      this.leafletMap = L.map(this.leafletMapElement.nativeElement).setView([this.center.lat, this.center.lng], this.zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 10,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.leafletMap);

      await new Promise(resolve => setTimeout(resolve, 0));
      this.leafletMap.invalidateSize();
    } else {
      console.error('Leaflet map element is not available.');
    }
  }

  // initializeMarkers(): void {
  //   if (this.currentMap === 'google') {
  //     this.devicesWithPositions.forEach(({ device, position }) => {
  //       this.addGoogleMarker(device, position);
  //       this.addGoogleTrajectoryMarker(position);
  //     });
  //   }
  // }

  initializeMarkers(): void {
    console.log("initializeMarkers called");

    if (this.currentMap === 'google') {
      console.log("initializeMarkers google");

      this.devicesWithPositions.forEach(({ device, position }) => {
        this.addGoogleMarker(device, position);
        this.addGoogleTrajectoryMarker(position);
      });
    } else if (this.currentMap === 'leaflet') {
      console.log("initializeMarkers leaflet");
      this.initializeLeafletMarkers();
    }
  }

  initializeLeafletMarkers(): void {
    this.devicesWithPositions.forEach(({ device, position }) => {
      this.addLeafletMarker(device, position);
    });
  }

  addLeafletMarker(device: Device, position: Position): void {
    const marker = L.marker([position.latitude, position.longitude], {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: `<img src="${this.carIcon}" style="transform: rotate(${position.course}deg); width: 30px; height: 30px;">`,
        iconSize: [50, 50],
        iconAnchor: [25, 25]
      })
    }).addTo(this.leafletMap);

    marker.on('click', () => {
      if (!this.replaying) {
        this.onMarkerClick({ device, position });
      }
    });

    this.leafletMarkers.set(device.id, marker);
  }
  addGoogleMarker(device: Device, position: Position): void {
    const existingMarker = this.markers.get(device.id);

    if (existingMarker) {
      // If the marker already exists, update its position and content
      existingMarker.position = new google.maps.LatLng(position.latitude, position.longitude);
      if (existingMarker.content instanceof HTMLElement) {
        const nameElement = existingMarker.content.querySelector('div:nth-child(1)') as HTMLElement;
        if (nameElement) {
          nameElement.innerText = device.name; // Update device name
        }
        const icon = existingMarker.content.querySelector('img') as HTMLElement;
        if (icon) {
          icon.style.transform = `rotate(${position.course}deg)`; // Update rotation
        }
      }
      return;
    }

    // Otherwise, create a new marker
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
    icon.style.width = '20px';
    icon.style.height = '20px';
    icon.style.transform = `rotate(${position.course}deg)`;

    wrapper.appendChild(nameElement);
    wrapper.appendChild(icon);

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map: this.googleMap,
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
  }
  addGoogleTrajectoryMarker(position: Position): void {
    const positionLatLng = new google.maps.LatLng(position.latitude, position.longitude);
    const marker = new google.maps.Marker({
      position: positionLatLng,
      map: this.googleMap,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 5,
        fillColor: '#0000FF',
        fillOpacity: 1,
        strokeWeight: 0,
      },
    });
    this.trajectoryMarkers.push(marker);
  }
  // updateMarkers(positions: Position[]): void {
  //   if (this.replaying) return;
  //   positions.forEach(position => {
  //     if (this.currentMap === 'google') {
  //       this.updateGoogleMarkers(position);
  //     }
  //   });
  // }

  updateMarkers(positions: Position[]): void {
    if (this.replaying) return;
    positions.forEach(position => {
      if (this.currentMap === 'google') {
        this.updateGoogleMarkers(position);
      } else if (this.currentMap === 'leaflet') {
        this.updateLeafletMarkers(position);
      }
      this.updateSpeedAndTime(position);
    });
  }

  updateLeafletMarkers(position: Position): void {
    const marker = this.leafletMarkers.get(position.deviceId);
    if (marker) {
      const newLatLng = L.latLng(position.latitude, position.longitude);
      marker.setLatLng(newLatLng);
      const newIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<img src="${this.carIcon}" style="transform: rotate(${position.course}deg); width: 20px; height: 20px;">`,
        iconSize: [50, 50],
        iconAnchor: [25, 25]
      });
      marker.setIcon(newIcon);
    } else {
      const device = this.devicesWithPositions.find(d => d.device.id === position.deviceId)!.device;
      this.addLeafletMarker(device, position);
    }
  }
  updateGoogleMarkers(position: Position): void {
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
      this.addGoogleTrajectoryMarker(position);
      if (this.selectedDevice && this.selectedDevice.device.id === position.deviceId && !this.stopAutoFollow) {
        this.center = { lat: position.latitude, lng: position.longitude };
        this.googleMap.panTo(this.center);
      }
    } else {
      const device = this.devicesWithPositions.find(d => d.device.id === position.deviceId)!.device;
      this.addGoogleMarker(device, position);
      this.addGoogleTrajectoryMarker(position);
    }
  }
  // removeAllMarkers(): void {
  //   this.markers.forEach(marker => {
  //     if (this.currentMap === 'google') {
  //       marker.map = null;
  //       marker.content = null;
  //     }
  //   });
  //   this.markers.clear();
  //   this.polylines.forEach(polyline => polyline.setMap(null));
  //   this.polylines.clear();
  // }

  removeAllMarkers(): void {
    if (this.currentMap === 'google') {
      this.markers.forEach(marker => {
        if (marker) {
          marker.map = null;
          if (marker.content instanceof HTMLElement) {
            marker.content.innerHTML = '';
          }
        }
      });
      this.markers.clear();
      this.polylines.forEach(polyline => polyline.setMap(null));
      this.polylines.clear();
    } else if (this.currentMap === 'leaflet') {
      this.leafletMarkers.forEach(marker => {
        if (marker) {
          this.leafletMap.removeLayer(marker);
        }
      });
      this.leafletMarkers.clear();
    }
  }

  // async onMarkerClick(selectedDevice: { device: Device, position: Position }) {
  // this.selectedDevice = selectedDevice;
  // const position = { lat: selectedDevice.position.latitude, lng: selectedDevice.position.longitude };
  // if (!this.infoWindow) {
  //   this.infoWindow = new google.maps.InfoWindow();
  // }
  // const content = document.createElement('div');
  // content.className = 'info-window-content';
  // content.style.maxWidth = '300px';  // Force width
  // content.style.maxHeight = '400px'; // Force height
  // content.style.overflowY = 'auto';  // Enable scrolling if needed
  // const buttonContainer = document.createElement('div');
  // buttonContainer.className = 'button-container';
  // buttonContainer.style.display = 'flex';
  // buttonContainer.style.alignItems = 'center';
  // buttonContainer.style.marginBottom = '10px';
  // const stopButton = document.createElement('button');
  // stopButton.className = 'p-button p-button-danger';
  // stopButton.innerHTML = '<span class="p-button-icon pi pi-stop-circle"></span>';
  // stopButton.style.marginRight = '10px'; // Add space between buttons
  // stopButton.addEventListener('click', () => window.dispatchEvent(new Event('stopAction')));
  // buttonContainer.appendChild(stopButton);
  // const spacer = document.createElement('div');
  // spacer.style.flexGrow = '1'; // Ensures space is occupied
  // buttonContainer.appendChild(spacer);
  // const startButton = document.createElement('button');
  // startButton.className = 'p-button p-button-primary';
  // startButton.innerHTML = '<span class="p-button-icon pi pi-play-circle"></span>';
  // startButton.addEventListener('click', () => window.dispatchEvent(new Event('startAction')));
  // buttonContainer.appendChild(startButton);
  // content.appendChild(buttonContainer);
  // const deviceName = document.createElement('h3');
  // deviceName.textContent = selectedDevice.device.name;
  // content.appendChild(deviceName);
  // const latitude = document.createElement('p');
  // let response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${selectedDevice.position.latitude},${selectedDevice.position.longitude}&key=${this.apiKey}`);
  // const data = await response.json();
  // let address = '';
  // if (data.status === 'OK' && data.results.length > 0) {
  //   address = this.getFormattedAddress(data);
  // } else {
  //   address = 'Address not found';
  // }
  // latitude.innerHTML = `<strong>Address:</strong> ${address}`;
  // content.appendChild(latitude);
  // const speedLimitDiv = document.createElement('div');
  // speedLimitDiv.className = 'speed-limit';
  // speedLimitDiv.style.marginTop = '10px'; // Space above speed limit
  // const speedLimitLabel = document.createElement('p');
  // speedLimitLabel.innerHTML = '<strong>Speed Limit:</strong> ';
  // const speedLimitValue = selectedDevice.position.speed || 'There no speed limit';
  // speedLimitLabel.innerHTML += `${speedLimitValue} <i class="pi pi-pencil edit-icon"></i>`;
  // speedLimitDiv.appendChild(speedLimitLabel);
  // content.appendChild(speedLimitDiv);
  // const replayButton = document.createElement('button');
  // replayButton.className = 'p-button p-button-secondary';
  // replayButton.innerHTML = '<span class="p-button-icon pi pi-replay"></span> Replay';
  // replayButton.style.display = 'block'; // Ensure it's on a new line
  // replayButton.style.marginTop = '20px'; // Space above replay button
  // replayButton.addEventListener('click', () => {
  //   const replayEvent = new CustomEvent('replayAction', {
  //     detail: { deviceId: selectedDevice.device.id, from: this.fromDate, to: this.toDate }
  //   });
  //   window.dispatchEvent(replayEvent);
  // });
  // content.appendChild(replayButton);
  // this.infoWindow.setPosition(position);
  // this.infoWindow.setContent(content);
  // this.infoWindow.open(this.googleMap);
  // }

  async onMarkerClick(selectedDevice: { device: Device, position: Position }) {
    this.selectedDevice = selectedDevice;
    const position = { lat: selectedDevice.position.latitude, lng: selectedDevice.position.longitude };
    if (this.currentMap === 'google') {
      if (!this.infoWindow) {
        this.infoWindow = new google.maps.InfoWindow();
      }
      const content = document.createElement('div');
      content.className = 'info-window-content';
      content.style.maxWidth = '300px';  // Force width
      content.style.maxHeight = '400px'; // Force height
      content.style.overflowY = 'auto';  // Enable scrolling if needed
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'button-container';
      buttonContainer.style.display = 'flex';
      buttonContainer.style.alignItems = 'center';
      buttonContainer.style.marginBottom = '10px';
      const stopButton = document.createElement('button');
      stopButton.className = 'p-button p-button-danger';
      stopButton.innerHTML = '<span class="p-button-icon pi pi-stop-circle"></span>';
      stopButton.style.marginRight = '10px'; // Add space between buttons
      stopButton.addEventListener('click', () => window.dispatchEvent(new Event('stopAction')));
      buttonContainer.appendChild(stopButton);
      const spacer = document.createElement('div');
      spacer.style.flexGrow = '1'; // Ensures space is occupied
      buttonContainer.appendChild(spacer);
      const startButton = document.createElement('button');
      startButton.className = 'p-button p-button-primary';
      startButton.innerHTML = '<span class="p-button-icon pi pi-play-circle"></span>';
      startButton.addEventListener('click', () => window.dispatchEvent(new Event('startAction')));
      buttonContainer.appendChild(startButton);
      content.appendChild(buttonContainer);
      const deviceName = document.createElement('h3');
      deviceName.textContent = selectedDevice.device.name;
      content.appendChild(deviceName);
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
      const speedLimitDiv = document.createElement('div');
      speedLimitDiv.className = 'speed-limit';
      speedLimitDiv.style.marginTop = '10px'; // Space above speed limit
      const speedLimitLabel = document.createElement('p');
      speedLimitLabel.innerHTML = '<strong>Speed Limit:</strong> ';
      const speedLimitValue = selectedDevice.device.attributes['speedLimite'] + "km/h" || 'There no speed limit';
      speedLimitLabel.innerHTML += `${speedLimitValue}`;
      speedLimitDiv.appendChild(speedLimitLabel);
      content.appendChild(speedLimitDiv);
      const replayButton = document.createElement('button');
      replayButton.className = 'p-button p-button-secondary';
      replayButton.innerHTML = '<span class="p-button-icon pi pi-replay"></span> Replay';
      replayButton.style.display = 'block'; // Ensure it's on a new line
      replayButton.style.marginTop = '20px'; // Space above replay button
      replayButton.addEventListener('click', () => {
        const replayEvent = new CustomEvent('replayAction', {
          detail: { deviceId: selectedDevice.device.id, from: this.fromDate, to: this.toDate }
        });
        window.dispatchEvent(replayEvent);
      });
      content.appendChild(replayButton);
      this.infoWindow.setPosition(position);
      this.infoWindow.setContent(content);
      this.infoWindow.open(this.googleMap);
    } else if (this.currentMap === 'leaflet') {
      const popupContent = document.createElement('div');
      popupContent.className = 'leaflet-popup-content';

      // Add button container
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'button-container';
      buttonContainer.style.display = 'flex';
      buttonContainer.style.alignItems = 'center';
      buttonContainer.style.marginBottom = '10px';

      const stopButton = document.createElement('button');
      stopButton.className = 'p-button p-button-danger';
      stopButton.innerHTML = '<span class="p-button-icon pi pi-stop-circle"></span>';
      stopButton.style.marginRight = '10px'; // Add space between buttons
      stopButton.onclick = () => window.dispatchEvent(new Event('stopAction'));
      buttonContainer.appendChild(stopButton);

      const spacer = document.createElement('div');
      spacer.style.flexGrow = '1'; // Ensures space is occupied
      buttonContainer.appendChild(spacer);

      const startButton = document.createElement('button');
      startButton.className = 'p-button p-button-primary';
      startButton.innerHTML = '<span class="p-button-icon pi pi-play-circle"></span>';
      startButton.onclick = () => window.dispatchEvent(new Event('startAction'));
      buttonContainer.appendChild(startButton);

      popupContent.appendChild(buttonContainer);

      // Device name
      const deviceName = document.createElement('h3');
      deviceName.textContent = selectedDevice.device.name;
      popupContent.appendChild(deviceName);

      // Address
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
      popupContent.appendChild(latitude);

      // Speed limit
      const speedLimitDiv = document.createElement('div');
      speedLimitDiv.className = 'speed-limit';
      speedLimitDiv.style.marginTop = '10px'; // Space above speed limit
      const speedLimitLabel = document.createElement('p');
      speedLimitLabel.innerHTML = '<strong>Speed Limit:</strong> ';
      const speedLimitValue = selectedDevice.device.attributes['speedLimite'] + "km/h" || 'There is no speed limit';
      speedLimitLabel.innerHTML += `${speedLimitValue}`;
      speedLimitDiv.appendChild(speedLimitLabel);
      popupContent.appendChild(speedLimitDiv);

      // Replay button
      const replayButton = document.createElement('button');
      replayButton.className = 'p-button p-button-secondary';
      replayButton.innerHTML = '<span class="p-button-icon pi pi-replay"></span> Replay';
      replayButton.style.display = 'block'; // Ensure it's on a new line
      replayButton.style.marginTop = '20px'; // Space above replay button
      replayButton.onclick = () => {
        const replayEvent = new CustomEvent('replayAction', {
          detail: { deviceId: selectedDevice.device.id, from: this.fromDate, to: this.toDate }
        });
        window.dispatchEvent(replayEvent);
      };
      popupContent.appendChild(replayButton); L.popup()
        .setLatLng([position.lat, position.lng])
        .setContent(popupContent)
        .openOn(this.leafletMap);
    }
  }

  // startReplay(deviceId: number, from?: string, to?: string): void {
  //   this.loading = true;
  //   this.replaying = true;
  //   this.clearReplay();
  //   this.removeAllMarkers();
  //   if (this.infoWindow) {
  //     this.infoWindow.close();
  //   }
  //   this.deviceService.getPositions(deviceId, from, to).subscribe(positions => {
  //     if (positions.length > 0) {
  //       const parkings = this.parkingDetectionService.findTourParkings(positions);
  //       const extendedParkings = parkings.map((parking, index) => {
  //         const extendedParking = {
  //           ...parking,
  //           distanceFromLastParking: 0,
  //           timeFromLastParking: 0
  //         };
  //         if (index > 0) {
  //           const previousParking = parkings[index - 1];
  //           extendedParking.distanceFromLastParking = this.parkingDetectionService.calculateDistance(
  //             previousParking.latitude,
  //             previousParking.longitude,
  //             parking.latitude,
  //             parking.longitude
  //           );
  //           extendedParking.timeFromLastParking =
  //             (new Date(parking.deviceTime).getTime() - new Date(previousParking.deviceTime).getTime()) / (1000 * 60); // Convert to minutes
  //         }
  //         return extendedParking;
  //       });
  //       this.displayTrajectory(positions);
  //       this.displayParkingMarkers(extendedParkings);
  //       this.currentReplayIndex = 0;
  //       this.replayGoogleMarker = this.createreplayGoogleMarker(positions[0]);
  //       this.isPlaying = true;
  //       this.maxReplayPosition = positions.length - 1;
  //       this.trajectoryPath = positions;
  //       this.animateReplay(this.trajectoryPath);
  //       this.parkingEvents = extendedParkings;
  //       this.deviceListComponent.parkingEvents = extendedParkings;
  //       this.getParkingAddresses();
  //       if (this.currentMap === 'google') {
  //         this.googleMap.panTo({ lat: positions[0].latitude, lng: positions[0].longitude });
  //       } else if (this.currentMap === 'yandex') {
  //         this.yandexMap.setCenter([positions[0].latitude, positions[0].longitude]);
  //       }
  //       this.loading = false;
  //     } else {
  //       this.loading = false;
  //       this.messageService.add({ severity: 'warn', summary: 'No Data', detail: 'No positions found for the selected date range.' });
  //       this.closeReplay();
  //       return;
  //     }
  //   });
  // }

  startReplay(deviceId: number, from?: string, to?: string): void {
    this.loading = true;
    this.replaying = true;
    this.clearReplay();
    this.removeAllMarkers();

    const closeMapPopup = this.mapClosures[this.currentMap];
    if (closeMapPopup) closeMapPopup();

    // Make sure to display the replay controller
    this.cd.detectChanges(); // Ensure the controller visibility updates

    this.deviceService.getPositions(deviceId, from, to).subscribe(positions => {
      if (positions.length > 0) {
        const parkings = this.parkingDetectionService.findTourParkings(positions);
        const extendedParkings = parkings.map((parking, index) => {
          const extendedParking = {
            ...parking,
            distanceFromLastParking: 0,
            timeFromLastParking: 0
          };
          if (index > 0) {
            const previousParking = parkings[index - 1];
            extendedParking.distanceFromLastParking = this.parkingDetectionService.calculateDistance(
              previousParking.latitude,
              previousParking.longitude,
              parking.latitude,
              parking.longitude
            );
            extendedParking.timeFromLastParking =
              (new Date(parking.deviceTime).getTime() - new Date(previousParking.deviceTime).getTime()) / (1000 * 60); // Convert to minutes
          }
          return extendedParking;
        });
        this.displayTrajectory(positions);
        this.displayParkingMarkers(extendedParkings);
        this.currentReplayIndex = 0;
        this.createreplayGoogleMarker(positions[0]);  // Create the replay marker
        this.isPlaying = true;
        this.maxReplayPosition = positions.length - 1;
        this.trajectoryPath = positions;
        this.animateReplay(this.trajectoryPath);
        this.parkingEvents = extendedParkings;
        this.deviceListComponent.parkingEvents = extendedParkings;
        this.getParkingAddresses();
        this.loading = false;

        // Center the map on the first position
        if (this.currentMap === 'google') {
          this.googleMap.panTo({ lat: positions[0].latitude, lng: positions[0].longitude });
        } else if (this.currentMap === 'leaflet') {
          this.leafletMap.panTo([positions[0].latitude, positions[0].longitude]);
        }
      } else {
        this.loading = false;
        this.messageService.add({ severity: 'warn', summary: 'No Data', detail: 'No positions found for the selected date range.' });
        this.closeReplay();
        return;
      }
    });
  }


  clearReplay(): void {
    if (this.currentMap === 'google') {
      if (this.replayGoogleMarker) {
        this.replayGoogleMarker.map = null;
        this.replayGoogleMarker = null;
      }
    } else if (this.currentMap === 'leaflet') {
      if (this.replayLeafletMarker) {
        this.leafletMap.removeLayer(this.replayLeafletMarker);
        this.replayGoogleMarker = null;
      }
    }
    this.clearTrajectoryMarkers();
    this.clearParkingMarkers();
  }


  // createreplayGoogleMarker(position: Position): google.maps.marker.AdvancedMarkerElement {
  //   const positionLatLng = { lat: position.latitude, lng: position.longitude };
  //   const wrapper = document.createElement('div');
  //   wrapper.style.position = 'relative';
  //   wrapper.style.display = 'flex';
  //   wrapper.style.flexDirection = 'column';
  //   wrapper.style.alignItems = 'center';
  //   const nameElement = document.createElement('div');
  //   nameElement.style.backgroundColor = 'white';
  //   nameElement.style.padding = '2px 5px';
  //   nameElement.style.borderRadius = '3px';
  //   nameElement.style.boxShadow = '0px 0px 2px rgba(0, 0, 0, 0.3)';
  //   nameElement.style.marginBottom = '2px';
  //   nameElement.style.fontSize = '12px';
  //   nameElement.style.fontWeight = 'bold';
  //   const icon = document.createElement('img');
  //   icon.src = this.carIcon;
  //   icon.style.width = '50px';
  //   icon.style.height = '50px';
  //   icon.style.transform = `rotate(${position.course}deg)`;
  //   wrapper.appendChild(nameElement);
  //   wrapper.appendChild(icon);
  //   const replayGoogleMarker = new google.maps.marker.AdvancedMarkerElement({
  //     map: this.googleMap,
  //     position: positionLatLng,
  //     content: wrapper,
  //   });
  //   return replayGoogleMarker;
  // }

  // updatereplayGoogleMarkerPosition(position: Position): void {
  //   if (this.replayGoogleMarker) {
  //     const newPosition = new google.maps.LatLng(position.latitude, position.longitude);
  //     this.replayGoogleMarker.position = newPosition;
  //     if (this.replayGoogleMarker.content instanceof HTMLElement) {
  //       const icon = this.replayGoogleMarker.content.querySelector('img');
  //       if (icon instanceof HTMLElement) {
  //         icon.style.transform = `rotate(${position.course}deg)`;
  //       }
  //     }
  //     this.updateSpeedAndTime(position);
  //     this.throttledPanToMarker(newPosition);
  //   }
  // }

  addMarker(device: Device, position: Position): void {
    if (this.currentMap === 'google') {
      // Create a Google Maps marker
      const googleMarker = new google.maps.marker.AdvancedMarkerElement({
        map: this.googleMap,
        position: new google.maps.LatLng(position.latitude, position.longitude),
        title: device.name,
      });
      this.markers.set(device.id, googleMarker);
    } else if (this.currentMap === 'leaflet') {
      // Create a Leaflet marker
      const leafletMarker = L.marker([position.latitude, position.longitude], {
        icon: L.icon({
          iconUrl: this.carIcon,
          iconSize: [50, 50]
        })
      }).addTo(this.leafletMap);
      this.leafletMarkers.set(device.id, leafletMarker);
    }
  }
  createreplayGoogleMarker(position: Position): void {
    if (this.currentMap === 'google') {
      const positionLatLng = { lat: position.latitude, lng: position.longitude };
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      const icon = document.createElement('img');
      icon.src = this.carIcon;
      icon.style.width = '20px';
      icon.style.height = '20px';
      icon.style.transform = `rotate(${position.course}deg)`;
      wrapper.appendChild(icon);
      this.replayGoogleMarker = new google.maps.marker.AdvancedMarkerElement({
        map: this.googleMap,
        position: positionLatLng,
        content: wrapper,
      });
    } else if (this.currentMap === 'leaflet') {
      this.replayLeafletMarker = L.marker([position.latitude, position.longitude], {
        icon: L.icon({
          iconUrl: this.carIcon,
          iconSize: [50, 50]
        })
      }).addTo(this.leafletMap);
    }
  }

  updatereplayGoogleMarkerPosition(position: Position): void {
    if (this.currentMap === 'google' && this.replayGoogleMarker) {
      const newPosition = new google.maps.LatLng(position.latitude, position.longitude);
      this.replayGoogleMarker.position = newPosition;
      if (this.replayGoogleMarker.content instanceof HTMLElement) {
        const icon = this.replayGoogleMarker.content.querySelector('img');
        if (icon instanceof HTMLElement) {
          icon.style.transform = `rotate(${position.course}deg)`;
        }
      }
      this.updateSpeedAndTime(position);
      this.throttledPanToMarker(newPosition);
    } else if (this.currentMap === 'leaflet' && this.replayLeafletMarker) {
      const newPosition = L.latLng(position.latitude, position.longitude);
      this.replayLeafletMarker.setLatLng(newPosition);
      this.leafletMap.panTo(newPosition);
      this.updateSpeedAndTime(position);
    }
  }
  throttledPanToMarker(position: google.maps.LatLng): void {
    const now = Date.now();
    if (now - this.lastPanTime >= this.throttleDelay) {
      this.lastPanTime = now;
      if (this.googleMap) {
        this.googleMap.panTo(position);
      } else {
        console.error('Map is not defined.');
      }
    }
  }

  displayTrajectory(positions: Position[]): void {
    if (this.currentMap === 'google') {
      this.displayGoogleTrajectory(positions);
    } else if (this.currentMap === 'leaflet') {
      this.displayLeafletTrajectory(positions);
    }
  }

  displayLeafletTrajectory(positions: Position[]): void {
    const path = positions.map(pos => [pos.latitude, pos.longitude] as [number, number]);

    // If there's an existing polyline, remove it before adding a new one
    if (this.polyline) {
      this.leafletMap.removeLayer(this.polyline);
    }

    // Create and store the new polyline reference
    this.polyline = L.polyline(path, {
      color: 'yellow',
      weight: 2
    }).addTo(this.leafletMap);
  }

  removePolyline(): void {
    if (this.polyline) {
      this.leafletMap.removeLayer(this.polyline);
      this.polyline = null; // Clear the reference
    }
  }



  displayGoogleTrajectory(positions: Position[]): void {
    const path = positions.map(pos => ({ lat: pos.latitude, lng: pos.longitude }));
    this.trajectory = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#FFFF00',
      strokeOpacity: 2.0,
      strokeWeight: 2
    });
    this.trajectory.setMap(this.googleMap);
    positions.forEach(pos => {
      const marker = new google.maps.Marker({
        position: { lat: pos.latitude, lng: pos.longitude },
        map: this.googleMap,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: '#FFFF00',
          fillOpacity: 1,
          strokeWeight: 0,
        },
      });
      this.trajectoryMarkers.push(marker);
    });
    this.trajectory.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        this.ngZone.run(() => {
          const clickedLatLng = event.latLng;
          const clickedIndex = this.trajectoryPath.findIndex(pos => pos.latitude === clickedLatLng!.lat() && pos.longitude === clickedLatLng!.lng());
          if (clickedIndex !== -1) {
            this.stopReplay();
            this.clearReplay();
            this.replayGoogleMarker = this.createreplayGoogleMarker(this.trajectoryPath[clickedIndex])!;
            this.currentReplayIndex = clickedIndex;
            this.currentReplayPosition = clickedIndex;
            this.isPlaying = true;
            this.animateReplay(this.trajectoryPath, this.currentReplayIndex);
          }
        });
      }
    });
  }

  clearTrajectoryMarkers(): void {
    this.trajectoryMarkers.forEach(marker => {
      marker.setMap(null);
    });
    this.trajectoryMarkers = [];
  }
  displayParkingMarkers(parkings: any): void {
    if (this.currentMap === 'google') {
      this.displayGoogleParkingMarkers(parkings);
    }
  }

  displayGoogleParkingMarkers(parkings: any): void {
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
      icon.className = 'parking-marker';
      wrapper.appendChild(icon);
      const parkingMarker = new google.maps.marker.AdvancedMarkerElement({
        map: this.googleMap,
        position: positionLatLng,
        content: wrapper,
      });
      this.parkingMarkers.push(parkingMarker);
    });
  }

  clearParkingMarkers(): void {
    if (this.currentMap === 'google') {
      this.parkingMarkers.forEach(marker => {
        marker.map = null;
      });
    }
    this.parkingMarkers = [];
    this.deviceListComponent.parkingEvents = [];
  }

  playReplay(): void {
    if (this.trajectoryPath && this.trajectoryPath.length > 0) {
      this.isPlaying = true;

      // If the replay was stopped, restart it from the beginning
      if (!this.replaying) {
        this.replaying = true;
        this.currentReplayIndex = 0;  // Restart from the beginning
        this.createreplayGoogleMarker(this.trajectoryPath[this.currentReplayIndex]);
      }

      this.animateReplay(this.trajectoryPath, this.currentReplayIndex);
    }
  }
  pauseReplay(): void {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  forwardReplay(): void {
    if (this.currentReplayIndex < this.trajectoryPath.length - 1) {
      this.pauseReplay();
      this.currentReplayIndex++;
      this.currentReplayPosition = this.currentReplayIndex;
      this.updatereplayGoogleMarkerPosition(this.trajectoryPath[this.currentReplayIndex]);
    }
  }

  rewindReplay(): void {
    if (this.currentReplayIndex > 0) {
      this.pauseReplay();
      this.currentReplayIndex--;
      this.currentReplayPosition = this.currentReplayIndex;
      this.updatereplayGoogleMarkerPosition(this.trajectoryPath[this.currentReplayIndex]);
    }
  }

  seekReplay(positionIndex: number): void {
    if (positionIndex >= 0 && positionIndex < this.trajectoryPath.length) {
      this.pauseReplay();
      this.currentReplayIndex = positionIndex;
      this.currentReplayPosition = positionIndex;
      this.updatereplayGoogleMarkerPosition(this.trajectoryPath[this.currentReplayIndex]);
      this.playReplay();
    }
  }

  stopReplay(): void {
    this.isPlaying = false;
    this.replaying = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clear the replay marker and other related elements
    if (this.replayGoogleMarker) {
      if (this.currentMap === 'google') {
        this.replayGoogleMarker.map = null;
        this.replayGoogleMarker = null;
      } else if (this.currentMap === 'leaflet') {
        this.leafletMap.removeLayer(this.replayLeafletMarker!);
        this.replayLeafletMarker = null;
      }
    }

    // Optionally clear the trajectory and reset the index to allow restarting
    this.clearReplay();
    this.currentReplayIndex = 0;
  }

  closeReplay(): void {
    this.replaying = false;
    this.following = false;
    this.clearReplay();
    this.stopReplay();
    this.removePolyline();
    if (this.trajectory) {
      this.trajectory.setMap(null);
      this.trajectory = null;
    }
    this.removereplayGoogleMarker();
    this.clearParkingMarkers();
    this.clearTrajectoryMarkers();
    this.deviceService.getDevicesWithPositions().subscribe(data => {
      this.devicesWithPositions = data;
      this.initializeMarkers();
    });
  }

  removereplayGoogleMarker(): void {
    if (this.replayGoogleMarker) {
      this.replayGoogleMarker.map = null;
      this.replayGoogleMarker = null;
    }
  }

  startCar(deviceId: number, action: string): void {
    let command: Command = {
      deviceId: deviceId,
      type: action
    };
    this.confirmationService.confirm({
      message: 'Are you sure you want to start the car?',
      header: 'Start Car Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.commandService.DispatchCommand(command).subscribe({
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
    let command: Command = {
      deviceId: deviceId,
      type: action
    };
    this.confirmationService.confirm({
      message: 'Are you sure you want to stop the car?',
      header: 'Stop Car Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.commandService.DispatchCommand(command).subscribe({
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
    if (this.replayGoogleMarker) {
      this.closeReplay();
    }
    this.toggleDeviceList();
    const selectedDevice = this.devicesWithPositions.find(d => d.device.id === device.id);
    if (selectedDevice) {
      this.selectedDevice = selectedDevice;
      this.center = { lat: selectedDevice.position.latitude, lng: selectedDevice.position.longitude };
      if (!this.isZooming) {
        this.smoothZoom(this.defaultZoom, () => {
          if (this.currentMap === 'google') {
            this.googleMap?.panTo(this.center);
          } else if (this.currentMap === 'yandex') {
            this.yandexMap.setCenter([this.center.lat, this.center.lng]);
          }
          else if (this.currentMap === 'leaflet') {
            // Leaflet Map Zoom to Marker
            const marker = this.leafletMarkers.get(device.id);
            if (marker) {
              this.leafletMap.setView(marker.getLatLng(), this.defaultZoom, { animate: true });
            }
          }

          this.stopAutoFollow = true;
        });
      }
      this.following = true;
      this.updateSpeedAndTime(selectedDevice.position);
      if (this.currentMap === 'google') {
        this.googleMap.panTo(this.center);
      }
    }
  }

  smoothZoom(targetZoom: number, callback: () => void): void {
    if (this.currentMap === 'google' && this.googleMap) {
      let currentZoom = this.googleMap.getZoom() || this.zoom;
      const increment = targetZoom > currentZoom ? 1 : -2;
      this.isZooming = true;
      const interval = setInterval(() => {
        currentZoom += increment;
        this.googleMap.setZoom(currentZoom);

        if ((increment > 0 && currentZoom >= targetZoom) || (increment < 0 && currentZoom <= targetZoom)) {
          clearInterval(interval);
          this.isZooming = false;
          callback();
        }
      }, 100);
    } else if (this.currentMap === 'leaflet' && this.leafletMap) {
      this.smoothZoomLeaflet(targetZoom, callback);
    } else {
      console.warn('smoothZoom: Map is not initialized or unsupported map type.');
      callback(); // Exit gracefully
    }
  }

  smoothZoomLeaflet(targetZoom: number, callback: () => void): void {
    let currentZoom = this.leafletMap.getZoom();
    const increment = targetZoom > currentZoom ? 1 : -1;
    this.isZooming = true;

    const interval = setInterval(() => {
      currentZoom += increment;
      this.leafletMap.setZoom(currentZoom);

      if ((increment > 0 && currentZoom >= targetZoom) || (increment < 0 && currentZoom <= targetZoom)) {
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
    const zoomLevel = this.currentMap === 'google' ? this.googleMap.getZoom() || this.zoom : this.yandexMap.getZoom() || this.zoom;
    this.markers.forEach(marker => {
      if (this.currentMap === 'google' && marker.content instanceof HTMLElement) {
        const icon = marker.content.querySelector('img');
        if (icon) {
          if (icon.classList.contains('parking-marker')) {
            icon.style.width = `20px`;
            icon.style.height = `20px`;
          } else {
            const size = Math.max(20, Math.min(50, zoomLevel * 3));
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
    const stepTime = 50;
    const steps = duration / stepTime;
    const latStep = (end.latitude - start.latitude) / steps;
    const lngStep = (end.longitude - start.longitude) / steps;
    let stepCount = 0;
    const step = () => {
      if (!this.isPlaying) return;
      if (stepCount < steps) {
        const newLat = start.latitude + latStep * stepCount;
        const newLng = start.longitude + lngStep * stepCount;
        const newPosition = {
          ...start,
          latitude: newLat,
          longitude: newLng,
          course: start.course
        };
        this.updateReplayMarkerPosition(newPosition);
        stepCount++;
        this.animationFrameId = requestAnimationFrame(step);
      } else {
        this.currentReplayIndex++;
        this.currentReplayPosition = this.currentReplayIndex;
        this.updateReplayMarkerPosition(end);
        this.updateSpeedAndTime(end);
        this.animateReplay(positions, this.currentReplayIndex);
      }
    };
    step();
  }

  updateReplayMarkerPosition(position: Position): void {
    if (this.currentMap === 'google' && this.replayGoogleMarker) {
      const newPosition = new google.maps.LatLng(position.latitude, position.longitude);
      this.replayGoogleMarker.position = newPosition;
      if (this.replayGoogleMarker.content instanceof HTMLElement) {
        const icon = this.replayGoogleMarker.content.querySelector('img');
        if (icon instanceof HTMLElement) {
          icon.style.transform = `rotate(${position.course}deg)`; // Rotate the icon based on course
        }
      }
      this.updateSpeedAndTime(position);
      this.throttledPanToMarker(newPosition);
    } else if (this.currentMap === 'leaflet' && this.replayLeafletMarker) {
      const newPosition = L.latLng(position.latitude, position.longitude);

      // Update the position of the marker
      this.replayLeafletMarker.setLatLng(newPosition);

      // Create a new DivIcon with rotation
      const newIcon = L.divIcon({
        className: 'custom-div-icon', // Add a custom class for further styling
        html: `<img src="${this.carIcon}" style="transform: rotate(${position.course}deg); width: 30px; height: 30px;">`,
        iconSize: [50, 50], // Size of the icon
        iconAnchor: [25, 25] // Anchor in the center
      });

      // Set the new icon with rotation
      this.replayLeafletMarker.setIcon(newIcon);

      // Pan the map to the new position
      this.leafletMap.panTo(newPosition);

      this.updateSpeedAndTime(position);
    }
  }

  updateSpeedAndTime(position: Position): void {
    this.speed = position.speed ? position.speed * 1.852 : 0; // Convert knots to km/h
    this.currentDatetime = this.formatDatetime(position.deviceTime);
  }

  async getParkingAddresses(): Promise<void> {
    for (const parking of this.parkingEvents) {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${parking.latitude},${parking.longitude}&key=${this.apiKey}`);
      const data = await response.json();
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

  async switchMap(mapType: 'google' | 'leaflet'): Promise<void> {
    this.removeAllMarkers();
    this.currentMap = mapType;
    if (mapType === 'google') {
      this.cd.detectChanges();
      await this.loadGoogleMap();
      this.initializeMarkers();  // Re-initialize markers after loading the map
    } else if (mapType === 'leaflet') {
      this.cd.detectChanges(); // Ensure view updates
      await new Promise(resolve => setTimeout(resolve, 100)); // Short delay
      await this.waitForElement(this.leafletMapElement);
      await this.loadLeafletMap();
      this.initializeMarkers();  // Re-initialize markers after loading the map
    }
  }

  private async waitForElement(ref: ElementRef | undefined): Promise<void> {
    while (!ref || !ref.nativeElement) {
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
  }

  private mapClosures: { [key: string]: () => void } = {
    'leaflet': () => this.leafletMap.closePopup(),
    'google': () => this.infoWindow.close()
  };

}
