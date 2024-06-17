import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, forkJoin, throwError } from 'rxjs';
import { catchError, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Device } from '../../shared/models/device';
import { Position } from '../../shared/models/position';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { WebsocketService } from '../ws/websocket.service';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private positionsSubject = new BehaviorSubject<Position[]>([]);
  positions$ = this.positionsSubject.asObservable();
  data: any;
  constructor(private _http: HttpClient, private wsService: WebsocketService) {
    // this.fetchInitialPositions();
    this.listenForPositionUpdates();
   }

  //  private listenForPositionUpdates() {
  //   this.wsService.messages$.subscribe(message => {
  //     if (message.positions) {
  //       console.log("message positions",message.positions);
  //       this.positionsSubject.next(message.positions);
  //     }
  //   });
  // }

  private listenForPositionUpdates() {
    this.wsService.messages$.pipe(
      filter(message => !!message.positions),
      take(1)
    ).subscribe(message => {
      this.positionsSubject.next(message.positions);
    });

    this.wsService.messages$.pipe(
      filter(message => !!message.positions)
    ).subscribe(message => {
      this.positionsSubject.next(message.positions);
    });
  }



  // private fetchInitialPositions() {
  //   this._http.get<Position[]>(`${environment.API}/api/positions`)
  //     .pipe(
  //       tap(positions => this.positionsSubject.next(positions)),
  //       catchError(error => {
  //         return throwError(() => error);
  //       })
  //     ).subscribe();
  // }
  getDevices(): Observable<Device[]> {
    return this._http.get<Device[]>(`${environment.API}/api/devices`,
  )
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  getPositions(): Observable<Position[]> {
    return this._http.get<Position[]>(`${environment.API}/api/positions`,
    )
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  getDevicesWithPositions(): Observable<{ device: Device, position: Position }[]> {
    return this.positions$.pipe(
      filter(positions => positions.length > 0),
      take(1),
      switchMap(() => forkJoin({
        devices: this.getDevices(),
        positions: this.positions$.pipe(take(1))
      })),
      map(result => {
        return result.devices.map(device => {
          const position = result.positions.find(p => p.deviceId === device.id);
          if (position) {
            return { device, position };
          }
          return null;
        }).filter(item => item !== null) as { device: Device, position: Position }[];
      })
    );
  }

}
