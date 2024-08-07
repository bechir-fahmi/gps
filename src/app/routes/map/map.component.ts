import { Component, OnInit, ViewChild, AfterViewInit, NgZone, HostListener, ElementRef } from '@angular/core';
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

declare const ymaps: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  providers: [MessageService, ConfirmationService]
})
export class MapComponent implements OnInit, AfterViewInit {
  @ViewChild('mapElement', { static: false }) mapElement!: GoogleMap;
  @ViewChild('yandexMapContainer') yandexMapContainer!: ElementRef;
  @ViewChild('deviceList') deviceListComponent!: DeviceListComponent;
  devicesWithPositions: { device: Device, position: Position }[] = [];
  center: google.maps.LatLngLiteral = { lat: 36.8448198, lng: 10.0297012 };
  zoom = 8;
  defaultZoom = 15;
  selectedDevice: { device: Device, position: Position } | null = null;
  googleMap!: google.maps.Map;
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
  replayMarker: google.maps.marker.AdvancedMarkerElement | null = null;
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
  parkingEvents: any[] = [];
  showParkingHistory = true;
  private apiKey: string = environment.googleMapsApiKey;
  loading = false;
  gaugeSize: number = 200;
  gaugeThickness: number = 12;
  private lastPanTime: number = 0;
  private throttleDelay: number = 200; // Throttle delay in milliseconds

  mapOptions = [
    { label: 'Google Map', value: 'google' },
    { label: 'Yandex Map', value: 'yandex' }
  ];
  selectedMap = 'google';
  markers: Map<number, google.maps.marker.AdvancedMarkerElement | any> = new Map(); // Updated for Yandex support

  constructor(
    private dialog: MatDialog,
    private deviceService: DeviceService,
    private mapsLoader: GoogleMapsLoaderService,
    private ngZone: NgZone,
    private commandService: CommandsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private parkingDetectionService: ParkingDetectionService
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
      this.gaugeSize = 200;
      this.gaugeThickness = 12;
    }
  }

  ngAfterViewInit(): void {
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

  get devices(): Device[] {
    return this.devicesWithPositions.map(d => d.device);
  }

  switchMap(mapType: string): void {
    this.currentMap = mapType;
    if (mapType === 'yandex') {
      this.loadYandexMap();
    } else if (mapType === 'google') {
      this.loadGoogleMap();
    }
  }

  loadGoogleMap(): void {
    this.googleMap = this.mapElement.googleMap!;
    this.initializeMarkers();
  }

  loadYandexMap() {
    if (!this.yandexMap) {
      const yandexScript = document.createElement('script');
      yandexScript.src = 'https://api-maps.yandex.ru/2.1/?lang=en_RU';
      yandexScript.onload = () => {
        ymaps.ready(() => {
          this.yandexMap = new ymaps.Map(this.yandexMapContainer.nativeElement, {
            center: [this.center.lat, this.center.lng],
            zoom: this.zoom
          });
          this.initializeYandexMarkers();
        });
      };
      document.body.appendChild(yandexScript);
    } else {
      this.yandexMap.setCenter([this.center.lat, this.center.lng], this.zoom);
    }
  }

  initializeMarkers(): void {
    if (this.currentMap === 'google') {
      this.devicesWithPositions.forEach(({ device, position }) => {
        this.addGoogleMarker(device, position);
        this.addGoogleTrajectoryMarker(position);
      });
    } else if (this.currentMap === 'yandex') {
      this.devicesWithPositions.forEach(({ device, position }) => {
        this.addYandexMarker(device, position);
      });
    }
  }

  initializeYandexMarkers(): void {
    this.devicesWithPositions.forEach(({ device, position }) => {
      this.addYandexMarker(device, position);
    });
  }

  addGoogleMarker(device: Device, position: Position): void {
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

    const polyline = this.polylines.get(device.id);
    if (polyline) {
      const path = polyline.getPath();
      path.push(positionLatLng);
    }
    this.updateMarkerSize();
  }

  addYandexMarker(device: Device, position: Position): void {
    const positionLatLng = [position.latitude, position.longitude];

    const marker = new ymaps.Placemark(positionLatLng, {
      hintContent: device.name,
      balloonContent: device.name
    }, {
      iconLayout: 'default#image',
      iconImageHref: this.carIcon,
      iconImageSize: [30, 42],
      iconImageOffset: [-15, -42]
    });

    this.yandexMap.geoObjects.add(marker);
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

  updateMarkers(positions: Position[]): void {
    if (this.replaying) return;

    positions.forEach(position => {
      if (this.currentMap === 'google') {
        this.updateGoogleMarkers(position);
      } else if (this.currentMap === 'yandex') {
        this.updateYandexMarkers(position);
      }
    });
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

  updateYandexMarkers(position: Position): void {
    const marker = this.markers.get(position.deviceId);
    if (marker) {
      const newPosition = [position.latitude, position.longitude];
      marker.geometry.setCoordinates(newPosition);

      if (this.selectedDevice && this.selectedDevice.device.id === position.deviceId && !this.stopAutoFollow) {
        this.center = { lat: position.latitude, lng: position.longitude };
        this.yandexMap.setCenter(newPosition);
      }
    } else {
      const device = this.devicesWithPositions.find(d => d.device.id === position.deviceId)!.device;
      this.addYandexMarker(device, position);
    }
  }

  removeAllMarkers(): void {
    this.markers.forEach(marker => {
      if (this.currentMap === 'google') {
        marker.map = null;
        marker.content = null;
      } else if (this.currentMap === 'yandex') {
        this.yandexMap.geoObjects.remove(marker);
      }
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
    this.infoWindow.open(this.googleMap);
  }

  startReplay(deviceId: number, from?: string, to?: string): void {
    this.loading = true;
    this.replaying = true;
    this.clearReplay();
    this.removeAllMarkers();
    if (this.infoWindow) {
      this.infoWindow.close(); // Close the info window when replay starts
    }

    this.deviceService.getPositions(deviceId, from, to).subscribe(positions => {
      if (positions.length > 0) {
        const parkings = this.parkingDetectionService.findTourParkings(positions);
        this.displayTrajectory(positions);
        this.displayParkingMarkers(parkings);
        this.currentReplayIndex = 0;
        this.replayMarker = this.createReplayMarker(positions[0]);
        this.isPlaying = true;
        this.maxReplayPosition = positions.length - 1;
        this.trajectoryPath = positions; // Store full Position objects
        this.animateReplay(this.trajectoryPath);

        this.parkingEvents = parkings;
        this.deviceListComponent.parkingEvents = parkings;
        this.getParkingAddresses();

        if (this.currentMap === 'google') {
          this.googleMap.panTo({ lat: positions[0].latitude, lng: positions[0].longitude });
        } else if (this.currentMap === 'yandex') {
          this.yandexMap.setCenter([positions[0].latitude, positions[0].longitude]);
        }

        this.loading = false;
      } else {
        this.loading = false;
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

    this.currentDatetime = '';
    this.clearParkingMarkers();
    this.parkingEvents = [];
    this.clearTrajectoryMarkers();
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
      map: this.googleMap,
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

      this.updateSpeedAndTime(position);
      this.throttledPanToMarker(newPosition);
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
    } else if (this.currentMap === 'yandex') {
      this.displayYandexTrajectory(positions);
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
            this.replayMarker = this.createReplayMarker(this.trajectoryPath[clickedIndex]);
            this.currentReplayIndex = clickedIndex;
            this.currentReplayPosition = clickedIndex;
            this.isPlaying = true;
            this.animateReplay(this.trajectoryPath, this.currentReplayIndex);
          }
        });
      }
    });
  }

  displayYandexTrajectory(positions: Position[]): void {
    const path = positions.map(pos => [pos.latitude, pos.longitude]);
    const polyline = new ymaps.Polyline(path, {}, {
      strokeColor: '#FFFF00',
      strokeWidth: 2
    });
    this.yandexMap.geoObjects.add(polyline);
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
    } else if (this.currentMap === 'yandex') {
      this.displayYandexParkingMarkers(parkings);
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

  displayYandexParkingMarkers(parkings: any): void {
    parkings.forEach((parking: any) => {
      const positionLatLng = [parking.latitude, parking.longitude];

      const marker = new ymaps.Placemark(positionLatLng, {}, {
        iconLayout: 'default#image',
        iconImageHref: this.parkingIcon,
        iconImageSize: [20, 20],
        iconImageOffset: [-10, -10]
      });

      this.yandexMap.geoObjects.add(marker);
    });
  }

  clearParkingMarkers(): void {
    if (this.currentMap === 'google') {
      this.parkingMarkers.forEach(marker => {
        marker.map = null;
      });
    } else if (this.currentMap === 'yandex') {
      this.yandexMap.geoObjects.removeAll();
    }
    this.parkingMarkers = [];
    this.deviceListComponent.parkingEvents = [];
  }

  playReplay(): void {
    if (this.replayMarker && this.trajectory) {
      this.isPlaying = true;
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
      this.updateReplayMarkerPosition(this.trajectoryPath[this.currentReplayIndex]);
    }
  }

  rewindReplay(): void {
    if (this.currentReplayIndex > 0) {
      this.pauseReplay();
      this.currentReplayIndex--;
      this.currentReplayPosition = this.currentReplayIndex;
      this.updateReplayMarkerPosition(this.trajectoryPath[this.currentReplayIndex]);
    }
  }

  seekReplay(positionIndex: number): void {
    if (positionIndex >= 0 && positionIndex < this.trajectoryPath.length) {
      this.pauseReplay();
      this.currentReplayIndex = positionIndex;
      this.currentReplayPosition = positionIndex;
      this.updateReplayMarkerPosition(this.trajectoryPath[this.currentReplayIndex]);
      this.playReplay();
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
    this.clearTrajectoryMarkers();
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
          if (this.currentMap === 'google') {
            this.googleMap?.panTo(this.center);
          } else if (this.currentMap === 'yandex') {
            this.yandexMap.setCenter([this.center.lat, this.center.lng]);
          }
          this.stopAutoFollow = true;
        });
      }
      this.following = true;
      this.updateSpeedAndTime(selectedDevice.position);
      // Pan to the last known position
      if (this.currentMap === 'google') {
        this.googleMap.panTo(this.center);
      } else if (this.currentMap === 'yandex') {
        this.yandexMap.setCenter([this.center.lat, this.center.lng]);
      }
    }
  }

  smoothZoom(targetZoom: number, callback: () => void): void {
    const currentZoom = this.currentMap === 'google' ? this.googleMap.getZoom() || this.zoom : this.yandexMap.getZoom() || this.zoom;
    if (currentZoom === targetZoom) {
      callback();
      return;
    }

    const increment = targetZoom > currentZoom ? 1 : -2;
    this.isZooming = true;
    const interval = setInterval(() => {
      const newZoom = (this.currentMap === 'google' ? this.googleMap.getZoom() || 0 : this.yandexMap.getZoom() || 0) + increment;
      if (this.currentMap === 'google') {
        this.googleMap.setZoom(newZoom);
      } else if (this.currentMap === 'yandex') {
        this.yandexMap.setZoom(newZoom);
      }

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
}
