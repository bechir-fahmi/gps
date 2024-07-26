import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { Geofence } from '../../models/geofence';
import { GoogleMapsLoaderService } from '../../../Services/google-map-loader/google-maps-loader.service';

@Component({
  selector: 'app-geofence-map-dialog',
  templateUrl: './geofence-map-dialog.component.html',
  styleUrls: ['./geofence-map-dialog.component.css']
})
export class GeofenceMapDialogComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() displayDialog: boolean = false;
  @Output() displayDialogChange = new EventEmitter<boolean>();
  @Input() geofence: Geofence | null = null;
  @Output() geofenceSaved = new EventEmitter<Geofence>();
  @Output() dialogClosed = new EventEmitter<void>();

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  map!: google.maps.Map;
  drawingManager!: google.maps.drawing.DrawingManager;
  currentOverlays: (google.maps.Circle | google.maps.Polygon)[] = [];

  constructor(private googleMapsLoader: GoogleMapsLoaderService, private ngZone: NgZone) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayDialog'] && changes['displayDialog'].currentValue) {
      this.googleMapsLoader.load().then(() => {
        this.initMap();
        if (this.geofence && this.geofence.area) {
          this.loadGeofenceOnMap(this.geofence.area);
        }
      }).catch(error => {
        console.error('Google Maps API failed to load:', error);
      });
    }
  }

  ngAfterViewInit(): void {
    this.googleMapsLoader.load().then(() => {
      this.initMap();
    }).catch(error => {
      console.error('Google Maps API failed to load:', error);
    });
  }

  initMap(): void {
    if (typeof google === 'undefined' || !google.maps) {
      console.error('Google Maps API not loaded correctly');
      return;
    }

    const mapOptions: google.maps.MapOptions = {
      center: { lat: 36.8448198, lng: 10.0297012 },
      zoom: 8,
    };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);

    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.CIRCLE,
          google.maps.drawing.OverlayType.POLYGON,
        ],
      },
    });

    this.drawingManager.setMap(this.map);

    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event: any) => {
      this.currentOverlays.push(event.overlay);
      if (this.geofence) {
        this.geofence.area += this.getOverlayCoordinates(event.overlay) + ';';
      }
    });
  }

  getOverlayCoordinates(overlay: google.maps.Circle | google.maps.Polygon): string {
    if (overlay instanceof google.maps.Circle) {
      const center = overlay.getCenter();
      const radius = overlay.getRadius();
      return `CIRCLE(${center!.lat()} ${center!.lng()}, ${radius})`;
    } else if (overlay instanceof google.maps.Polygon) {
      const path = overlay.getPath().getArray();
      return `POLYGON((${path.map(p => `${p.lat()} ${p.lng()}`).join(', ')}))`;
    }
    return '';
  }

  loadGeofenceOnMap(area: string): void {
    const shapes = area.split(';');
    for (const shape of shapes) {
      if (shape.startsWith('CIRCLE')) {
        this.loadCircleOnMap(shape);
      } else if (shape.startsWith('POLYGON')) {
        this.loadPolygonOnMap(shape);
      }
    }
  }

  loadCircleOnMap(area: string): void {
    const match = area.match(/CIRCLE\(([^)]+)\)/);
    if (match) {
      const [centerCoords, radius] = match[1].split(',').map(s => s.trim());
      const [lat, lng] = centerCoords.split(' ').map(Number);
      const center = new google.maps.LatLng(lat, lng);
      const circle = new google.maps.Circle({
        center,
        radius: Number(radius),
        map: this.map,
      });
      this.map.setCenter(center);
      const bounds = circle.getBounds();
      if (bounds) {
        this.map.fitBounds(bounds as google.maps.LatLngBounds);
      }
      this.currentOverlays.push(circle);
    }
  }

  loadPolygonOnMap(area: string): void {
    const match = area.match(/POLYGON\(\(([^)]+)\)\)/);
    if (match) {
      const paths = match[1].split(',').map(coord => {
        const [lat, lng] = coord.trim().split(' ').map(Number);
        return new google.maps.LatLng(lat, lng);
      });
      const polygon = new google.maps.Polygon({
        paths,
        map: this.map,
      });
      const bounds = new google.maps.LatLngBounds();
      paths.forEach(path => bounds.extend(path));
      if (bounds.isEmpty()) {
        console.warn('Bounds are empty, unable to fit map');
      } else {
        this.map.setCenter(bounds.getCenter());
        this.map.fitBounds(bounds);
      }
      this.currentOverlays.push(polygon);
    }
  }

  saveGeofence(): void {
    if (this.geofence) {
      this.geofenceSaved.emit(this.geofence);
    }
    this.closeDialog();
  }

  closeDialog(): void {
    this.displayDialogChange.emit(false);
    this.dialogClosed.emit();
    this.clearOverlays();
  }

  clearOverlays(): void {
    this.currentOverlays.forEach(overlay => overlay.setMap(null));
    this.currentOverlays = [];
  }
}
