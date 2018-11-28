import { Component, ViewChild, OnInit } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { MapComponent } from '../map/map.component';
import { ConnectionService } from 'src/app/services/connection/connection.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  @ViewChild(MapComponent)
  private mapComponent: MapComponent;

  distanceValue = 100;
  selectedMapType = 6;
  citiesList: any;
  selectedCity: any;

  constructor(
    private media: MediaMatcher,
    private connService: ConnectionService
  ) {}

  ngOnInit() {
    this.connService
      .getCities()
      .subscribe(cities => (this.citiesList = cities));
  }

  onShowInRangeButtonClick() {
    this.mapComponent.showAccidentsInRange(this.distanceValue);
  }

  onShowOnRoadButtonClick() {
    this.mapComponent.showAccidentsOnRoad();
  }

  onShowRateMapButtonClick() {
    if (this.selectedCity && this.selectedMapType === 8) {
      this.mapComponent.showAccidentsRateMap(this.selectedCity);
    } else {
      this.mapComponent.showAccidentsRateMap();
    }
  }

  onClearButtonClick() {
    this.mapComponent.clearMap();
  }

  sliderChange(event) {
    this.distanceValue = event.value;
  }

  isMobileOrTablet(): Boolean {
    return this.media.matchMedia('(max-width: 900px)').matches;
  }
}
