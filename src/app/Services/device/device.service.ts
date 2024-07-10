import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, forkJoin, throwError } from 'rxjs';
import { catchError, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Device } from '../../shared/models/device';
import { Position } from '../../shared/models/position';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { WebsocketService } from '../ws/websocket.service';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private positionsSubject = new BehaviorSubject<Position[]>([]);
  positions$ = this.positionsSubject.asObservable();
  data: any;
  /**
 * Initializes a new instance of the DeviceService class.
 *
 * @param {HttpClient} _http - The HttpClient instance.
 * @param {WebsocketService} wsService - The WebsocketService instance.
 */
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
  /**
   * Listens for position updates from the WebSocket service and emits the positions through the positionsSubject.
   *
   * @private
   * @return {void}
   */
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
  /**
   * A function that retrieves devices from the API.
   *
   * @return {Observable<Device[]>} Observable of Device array
   */
  getDevices(): Observable<Device[]> {
    return this._http.get<Device[]>(`${environment.API}/api/devices`,
  )
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }
  /**
   * Retrieves positions based on the provided device ID, 'from' date, and 'to' date.
   *
   * @param {number} deviceId - (Optional) The ID of the device.
   * @param {string} from - (Optional) The start date for the query.
   * @param {string} to - (Optional) The end date for the query.
   * @return {Observable<Position[]>} An observable of position data.
   */
  getPositions(deviceId?: number, from?: string, to?: string): Observable<Position[]> {
    let params =new HttpParams()
    if (deviceId !== undefined) {
      params = params.set('deviceId', deviceId.toString());
    }
    if (from !== undefined) {
      params = params.set('from', from);
    }
    if (to !== undefined) {
      params = params.set('to', to);
    }
    return this._http.get<Position[]>(`${environment.API}/api/positions`,{ params }
    )
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }
  /**
   * Retrieves devices with their corresponding positions.
   *
   * @return {Observable<{ device: Device, position: Position }[]>} An Observable that emits an array of objects containing the device and its position.
   */
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
