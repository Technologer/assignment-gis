import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  constructor(private http: HttpClient) {}

  getPint(data): Observable<any> {
    return this.http
      .post('http://localhost:5000/api/pdt', data)
      .pipe(take(1));
  }
}
