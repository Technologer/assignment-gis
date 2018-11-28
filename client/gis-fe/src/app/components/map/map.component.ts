import { Component, OnInit } from '@angular/core';
import { ConnectionService } from 'src/app/services/connection/connection.service';
import { tap } from 'rxjs/operators';
import {
  greenMarkerIcon,
  blueMarkerIcon
} from './../../shared/marker-icons/marker-icons';
import { marker, tileLayer, latLng, geoJSON } from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  options: any;
  mapElement: L.Map;
  marker: L.Marker;
  layers: L.Layer[] = [];
  selectedMapType: any;

  constructor(
    private connectionService: ConnectionService,
  ) {}

  ngOnInit() {
    this.options = {
      layers: [
        tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18
        })
      ],
      zoom: 8,
      center: latLng(50.7294878, -0.3321634)
    };
  }

  onMapReady(mapElement: L.Map) {
    this.mapElement = mapElement;

    // testing
    // this.connectionService
    //     .test({})
    //     .pipe(
    //       tap(data => {
    //         L.geoJSON(data, {
    //           style: style
    //         }).addTo(mapElement);
    //       })
    //     )
    //     .subscribe();
  }

  showAccidentsInRange(distance) {
    if (!this.marker) {
      alert('Please select a point on the map');
      return;
    }
    this.clearMap();
    this.connectionService
      .getAccidentsInRange({
        distance: parseFloat(distance),
        latlng: this.marker.getLatLng()
      })
      .pipe(
        tap(data => {
          if (!data.length) {
            alert('No accidents found in chosen range');
          }
          const layer = geoJSON(data, {
            onEachFeature: onEachFeature
          });
          this.layers.push(layer);
        })
      )
      .subscribe();
  }

  showAccidentsRateMap(city?: string) {
    this.clearMap();
    if (city) {
      this.connectionService
        .getAccidentsCounties({ city })
        .pipe(
          tap(data => {
            const layer = geoJSON(data, {
              style: style
            });
            this.layers.push(layer);
          })
        )
        .subscribe();
    } else {
      this.connectionService
        .getAccidentsCities({})
        .pipe(
          tap(data => {
            const layer = geoJSON(data, {
              style: style
            });
            this.layers.push(layer);
          })
        )
        .subscribe();
    }
  }

  showAccidentsOnRoad() {
    if (!this.marker) {
      alert('Please select point on road');
      return;
    }
    this.clearMap();
    this.connectionService
      .getAccidentsOnRoad({
        latlng: this.marker.getLatLng()
      })
      .pipe(
        tap(data => {
          if (!data.length) {
            alert('No accidents found on chosen road');
          }
          const layer = geoJSON(data, {
            pointToLayer: (feature, latlng) => {
              return marker(latlng, { icon: blueMarkerIcon });
            }
          });
          this.layers.push(layer);
        })
      )
      .subscribe();
  }

  addMarker(event) {
    if (this.marker) {
      this.marker = null;
    }
    this.marker = marker(event.latlng, {
      icon: greenMarkerIcon
    });
    this.marker.bindTooltip('Main point');
    this.marker.on('click', () => {
      this.marker.remove();
      this.marker = null;
    });
    console.log(this.marker.getLatLng());
  }

  clearMap() {
    this.layers = [];
  }
}

function getColor(value) {
  return value > 1000
    ? '#800026'
    : value > 500
    ? '#BD0026'
    : value > 200
    ? '#E31A1C'
    : value > 100
    ? '#FC4E2A'
    : value > 50
    ? '#FD8D3C'
    : value > 20
    ? '#FEB24C'
    : value > 10
    ? '#FED976'
    : '#FFEDA0';
}

function style(feature) {
  return {
    fillColor: getColor(feature.properties.accidents_count),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  };
}

// const max = Math.max.apply(
//   Math,
//   data.map(item => item.properties.accidents_count)
// );

// const min = Math.min.apply(
//   Math,
//   data.map(item => item.properties.accidents_count)
// );
// console.log(max, min);

function onEachFeature(feature, layer) {
  if (feature.properties && feature.geometry.type === 'Point') {
    layer.bindPopup(`
      <div class="popup-accidents-range">
        <h3>Accident</h3>
        <ul>
          <li>Distance: ${feature.properties.distance}</li>
          <li>Number of vehicles: ${feature.properties.numberOfVehicle}</li>
          <li>Date: ${feature.properties.date}</li>
          <li>Time: ${feature.properties.time}</li>
        </ul>
      </div>
    `);
  }
}
