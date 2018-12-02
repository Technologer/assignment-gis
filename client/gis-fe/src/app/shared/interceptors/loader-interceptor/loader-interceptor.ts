import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest
} from '@angular/common/http';

import { Observable } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { ConnectionService } from 'src/app/services/connection/connection.service';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  constructor(private connService: ConnectionService) {}
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    this.connService.loader.next(true);

    return next.handle(req).pipe(
      map(event => {
        return event;
      }),
      catchError(error => {
        this.connService.loader.next(false);
        return Observable.throw(error);
      }),
      finalize(() => {
        this.connService.loader.next(false);
      })
    );
  }
}
