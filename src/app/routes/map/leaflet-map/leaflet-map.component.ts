import { Component, AfterViewInit, ElementRef, ViewChild, Input } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-leaflet-map',
  template: '<div #leafletMap style="height: 100%; width: 100%;"></div>',
  styleUrls: ['./leaflet-map.component.css']
})
export class LeafletMapComponent implements AfterViewInit {
  @ViewChild('leafletMap', { static: true }) leafletMapElement!: ElementRef;
  @Input() center: L.LatLngExpression = [36.8448198, 10.0297012]; // Default center
  @Input() zoom: number = 8; // Default zoom level
  private leafletMap!: L.Map;

  ngAfterViewInit(): void {
    this.leafletMap = L.map(this.leafletMapElement.nativeElement).setView(this.center, this.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.leafletMap);

    // Ensure the map is correctly resized and rendered
    setTimeout(() => {
      this.leafletMap.invalidateSize();
    }, 0);
  }

  // Method to add markers, layers, etc.
  addMarker(lat: number, lng: number): void {
    L.marker([lat, lng]).addTo(this.leafletMap);
  }
}
