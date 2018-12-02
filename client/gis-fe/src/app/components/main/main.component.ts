import { Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { MapComponent } from '../map/map.component';
import { ConnectionService } from 'src/app/services/connection/connection.service';
import { cities } from './../../shared/cities-enum';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  @ViewChild(MapComponent)
  private mapComponent: MapComponent;
  loader: Boolean;
  distanceValue = 100;
  selectedMapType = 5;
  selectedCity: any;
  citiesEnum = cities.sort();
  schools: any;
  selectedSchool: any;

  constructor(
    private media: MediaMatcher,
    private connService: ConnectionService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.connService.loader.subscribe(val => (this.loader = val));
    this.changeDetector.detectChanges();
  }

  onShowInRangeButtonClick() {
    this.mapComponent.showAccidentsInRange(this.distanceValue);
  }

  onShowOnRoadButtonClick() {
    this.mapComponent.showAccidentsOnRoad();
  }

  onShowRateMapButtonClick() {
    if (this.selectedMapType) {
      this.mapComponent.showAccidentsRateMap(this.selectedMapType);
    }
  }

  onClearButtonClick() {
    this.mapComponent.clearMap();
  }

  sliderChange(event) {
    this.distanceValue = event.value;
  }

  onCitySelect(event) {
    this.connService
      .getSchoolsList({ city: event.value })
      .subscribe(data => (this.schools = data));
  }

  onSchoolSelect(event) {
    this.mapComponent.showSchool(event.value);
  }

  onShowAccidentsSchoolClick() {
    this.mapComponent.showAccidentsNearSchool(this.selectedSchool);
  }

  isMobileOrTablet(): Boolean {
    return this.media.matchMedia('(max-width: 900px)').matches;
  }
}
