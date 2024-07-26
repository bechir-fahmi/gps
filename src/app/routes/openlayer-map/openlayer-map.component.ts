import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { Position } from '../../shared/models/position';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Fill, Icon, Stroke, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css';
import { Device } from '../../shared/models/device';

@Component({
  selector: 'app-openlayer-map',
  templateUrl: './openlayer-map.component.html',
  styleUrls: ['./openlayer-map.component.css']
})
export class OpenlayerMapComponent  {
  // @Input() center: [number, number] = [10.0297012, 36.8448198];
  // @Input() zoom: number = 8;
  // map!: Map;
  // vectorSource = new VectorSource();
  // vectorLayer = new VectorLayer({ source: this.vectorSource });

  // ngOnInit(): void {}

  // ngAfterViewInit(): void {
  //   this.map = new Map({
  //     target: 'openlayers-map',
  //     layers: [
  //       new TileLayer({
  //         source: new OSM()
  //       }),
  //       this.vectorLayer
  //     ],
  //     view: new View({
  //       center: fromLonLat(this.center),
  //       zoom: this.zoom
  //     })
  //   });
  // }

  // addMarker(device: Device, position: Position, carIcon: string): void {
  //   const marker = new Feature({
  //     geometry: new Point(fromLonLat([position.longitude, position.latitude]))
  //   });

  //   marker.setStyle(new Style({
  //     image: new Icon({
  //       src: carIcon,
  //       scale: 0.5,
  //       rotation: position.course! * Math.PI / 180,
  //     }),
  //     text: new Text({
  //       text: device.name,
  //       offsetY: -25,
  //       backgroundFill: new Fill({ color: 'white' }),
  //       padding: [2, 5, 2, 5],
  //       font: '12px sans-serif',
  //       fill: new Fill({ color: '#000' }),
  //       stroke: new Stroke({ color: '#000', width: 1 }),
  //       textAlign: 'center',
  //     })
  //   }));

  //   this.vectorSource.addFeature(marker);
  // }

  // panTo(position: [number, number]): void {
  //   this.map.getView().setCenter(fromLonLat(position));
  // }
}
