import { Component, OnInit } from '@angular/core';
import { ConnectionService } from 'src/app/services/connection/connection.service';
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

  constructor(private connectionService: ConnectionService) {}

  ngOnInit() {
    this.options = {
      layers: [
        tileLayer(
          // tslint:disable-next-line:max-line-length
          'https://api.mapbox.com/styles/v1/jvboss/cjp73vwnc2ykw2rnyh6rzcn68/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoianZib3NzIiwiYSI6ImNqcDZyNzhjdjBseXEzcHBuemZ1MnE1ZGwifQ.OcMIjVMbkJBBMAy76RSPgA',
          {
            attribution:
              // tslint:disable-next-line:max-line-length
              'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18
          } as any
        )
      ],
      zoom: 6,
      center: latLng(54.278054859672835, -2.5268554687500004)
    };
  }

  onMapReady(mapElement: L.Map) {
    this.mapElement = mapElement;
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
        lng: this.marker.getLatLng().lng,
        lat: this.marker.getLatLng().lat
      })
      .subscribe(data => {
        if (!data.length) {
          alert('No accidents found in chosen range');
        }
        const layer = geoJSON(data, {
          pointToLayer: (feature, latlng) => {
            return marker(latlng, { icon: blueMarkerIcon });
          },
          onEachFeature: onEachRangeFeature
        });
        this.layers.push(layer);
      });
  }

  showAccidentsRateMap(adminLevel: number) {
    this.clearMap();
    this.connectionService.getAccidentsArea({ adminLevel }).subscribe(data => {
      const layer = geoJSON(data, {
        style: style,
        onEachFeature: onEachAreaFeature
      });
      this.layers.push(layer);
    });
  }

  showSchool(schoolId: string) {
    this.clearMap();
    this.connectionService.getSchool({ schoolId }).subscribe(data => {
      const layer = geoJSON(data);
      this.layers.push(layer);
      this.zoomToFeature(layer);
    });
  }

  showAccidentsNearSchool(schoolId: number) {
    this.connectionService
      .getAccidentsNearSchool({ schoolId })
      .subscribe(data => {
        const max = Math.max.apply(
          Math,
          data.map(feature => feature.properties.accidentsCount)
        );
        const min = Math.min.apply(
          Math,
          data.map(feature => feature.properties.accidentsCount)
        );
        const layer = geoJSON(data, {
          style: function(feature) {
            const count = feature.properties.accidentsCount;
            const rate = max - min ? (count - min) / (max - min) : 0;
            return { color: getRoadColor(rate), weight: 5, opacity: 0.9 };
          }
        });
        this.layers.push(layer);
      });
  }

  showAccidentsOnRoad() {
    if (!this.marker) {
      alert('Please select point on road');
      return;
    }
    this.clearMap();
    this.connectionService
      .getAccidentsOnRoad({
        lng: this.marker.getLatLng().lng,
        lat: this.marker.getLatLng().lat
      })
      .subscribe(data => {
        if (!data.length) {
          alert('No accidents found on chosen road');
        }
        const layer = geoJSON(data, {
          pointToLayer: (feature, latlng) => {
            return marker(latlng, { icon: blueMarkerIcon });
          },
          onEachFeature: onEachRoadFeature
        });
        this.layers.push(layer);
      });
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

  zoomToFeature(e) {
    this.mapElement.fitBounds(e.getBounds());
  }
}

function getColor(value) {
  return value > 1.05
    ? '#800026'
    : value > 0.9
    ? '#BD0026'
    : value > 0.75
    ? '#E31A1C'
    : value > 0.6
    ? '#FC4E2A'
    : value > 0.45
    ? '#FD8D3C'
    : value > 0.3
    ? '#FEB24C'
    : value > 0.15
    ? '#FED976'
    : '#FFEDA0';
}

function getRoadColor(value) {
  return value > 0.8
    ? '#BD0026'
    : value > 0.6
    ? '#FC4E2A'
    : value > 0.4
    ? '#FD8D3C'
    : value > 0.2
    ? '#FEB24C'
    : value > 0
    ? '#FED976'
    : '#FFEDA0';
}

function style(feature) {
  const accidentRate =
    feature.properties.accidentsCount / (feature.properties.area / 1000000);
  return {
    fillColor: getColor(accidentRate),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  };
}

function onEachRangeFeature(feature, layer) {
  if (feature.properties && feature.geometry.type === 'Point') {
    const date = feature.properties.date.substring(0, 10);
    layer.bindPopup(`
      <div class="popup-accidents-range">
        <h3>Accident</h3>
        <ul>
          <li>Distance: ${Math.round(feature.properties.distance * 100) /
            100}m</li>
          <li>Number of vehicles: ${feature.properties.numberOfVehicle}</li>
          <li>Date: ${date}</li>
          <li>Time: ${feature.properties.time}</li>
        </ul>
      </div>
    `);
  }
}

function onEachRoadFeature(feature, layer) {
  if (feature.properties && feature.geometry.type === 'Point') {
    const date = feature.properties.date.substring(0, 10);
    layer.bindPopup(`
      <div class="popup-accidents-range">
        <h3>Accident</h3>
        <ul>
          <li>Number of vehicles: ${feature.properties.numberOfVehicle}</li>
          <li>Date: ${date}</li>
          <li>Time: ${feature.properties.time}</li>
        </ul>
      </div>
    `);
  }
}

function onEachAreaFeature(feature, layer) {
  if (feature.properties && feature.geometry.type === 'Polygon') {
    const rate =
      feature.properties.accidentsCount / (feature.properties.area / 1000000);
    layer.bindPopup(`
      <div class="popup-accidents-range">
        <h3>${feature.properties.areaName}</h3>
        <ul>
          <li>Number of accidents: ${feature.properties.accidentsCount}</li>
          <li>Area: ${(feature.properties.area / 1000000).toFixed(2)}</li>
          <li>Rate: ${Math.round(rate * 100) / 100}</li>
        </ul>
      </div>
    `);
  }
}
