import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { ConnectionService } from 'src/app/services/connection/connection.service';
import { tap } from 'rxjs/operators';
import { ParamService } from 'src/app/services/param/param.service';
import {
  greenMarkerIcon,
  blueMarkerIcon
} from './../../shared/marker-icons/marker-icons';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  options: any;
  layersControl: any;
  mapElement: L.Map;
  marker: L.Marker;
  greenMarkerIcon: L.Icon;

  constructor(
    private connectionService: ConnectionService,
    private paramService: ParamService
  ) {}

  ngOnInit() {
    this.options = {
      layers: [
        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '...'
        })
      ],
      zoom: 8,
      center: L.latLng(50.7294878, -0.3321634)
    };
  }

  onMapReady(mapElement: L.Map) {
    this.mapElement = mapElement;

    this.paramService.value.subscribe(options => {
      this.connectionService
        .getPint({data: options})
        .pipe(
          tap(data => {
            L.geoJSON(data, {
              pointToLayer: (feature, latlng) => {
                return L.marker(latlng, { icon: blueMarkerIcon });
              }
            }).addTo(mapElement);
            // data.map(item => L.marker([item.latitude, item.longitude]).addTo(mapElement));
          })
        )
        .subscribe();
    });

    L.marker([51.54968430132381, -0.12810230255126956], {
      icon: greenMarkerIcon
    }).addTo(this.mapElement);
  }

  addMarker(event) {
    if (this.marker) {
      this.mapElement.removeLayer(this.marker);
    }
    this.marker = L.marker(event.latlng, {
      icon: greenMarkerIcon
    }).addTo(this.mapElement);
    console.log(this.marker.getLatLng());
  }
}
