import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs/operators';

const BASE_URL = 'http://localhost:5000';
@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  constructor(private http: HttpClient) {}

  getAccidentsInRange(data): Observable<any> {
    return this.http
      .post(`${BASE_URL}/api/accidents-in-range`, data)
      .pipe(take(1));
  }

  getAccidentsOnRoad(data): Observable<any> {
    return this.http
      .post(`${BASE_URL}/api/accidents-on-road`, data)
      .pipe(take(1));
  }

  getAccidentsArea(data): Observable<any> {
    return this.http.post(`${BASE_URL}/api/accidents-area`, data).pipe(take(1));
  }

  getSchoolsList(data): Observable<any> {
    return this.http
      .get(`${BASE_URL}/api/schools`, { params: data })
      .pipe(take(1));
  }

  getSchool(data): Observable<any> {
    return this.http
      .get(`${BASE_URL}/api/school`, { params: data })
      .pipe(take(1));
  }

  getAccidentsNearSchool(data): Observable<any> {
    return this.http
      .get(`${BASE_URL}/api/accidents-school`, { params: data })
      .pipe(take(1));
  }
}
