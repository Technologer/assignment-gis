import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ParamService {

  value = new Subject<any>();

  constructor() { }

  search(options: any) {
    this.value.next(options);
  }

}
