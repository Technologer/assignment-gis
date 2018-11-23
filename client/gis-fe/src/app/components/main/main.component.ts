import { Component, OnInit } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { ParamService } from 'src/app/services/param/param.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  distance: number;

  constructor(
    private media: MediaMatcher,
    private paramService: ParamService
  ) {}

  ngOnInit() {}

  onButtonClick() {
    this.paramService.value.next(this.distance);
  }

  isMobileOrTablet(): Boolean {
    return this.media.matchMedia('(max-width: 900px)').matches;
  }
}
