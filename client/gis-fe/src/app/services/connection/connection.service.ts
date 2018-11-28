import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  constructor(private http: HttpClient) {}

  getAccidentsInRange(data): Observable<any> {
    return this.http
      .post('http://localhost:5000/api/accidents-in-range', data)
      .pipe(take(1));
  }

  getAccidentsOnRoad(data): Observable<any> {
    return this.http
      .post('http://localhost:5000/api/accidents-on-road', data)
      .pipe(take(1));
  }

  getAccidentsCities(data): Observable<any> {
    return this.http
      .post('http://localhost:5000/api/accidents-cities', data)
      .pipe(take(1));
  }

  getAccidentsCounties(data): Observable<any> {
    return this.http
      .post('http://localhost:5000/api/accidents-counties', data)
      .pipe(take(1));
  }

  test(data): Observable<any> {
    return this.http.post('http://localhost:5000/api/test', data).pipe(take(1));
  }
  getCities() {
    return this.http.get('http://localhost:5000/api/cities').pipe(take(1));
  }
}
