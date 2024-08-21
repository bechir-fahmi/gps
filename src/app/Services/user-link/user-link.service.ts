import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserLinkService {
  private readonly apiUrl = `${environment.API}/api/permissions`;
  constructor(private _http: HttpClient) { }

  AddPermession(userId: number, deviceId: number, CurrentUserId?: number): Observable<any> {
    const requestBody = {
      userId: userId.toString(),
      deviceId: deviceId.toString(),
        // managedUserId: CurrentUserId
    };
    return this._http.post<any>(this.apiUrl, requestBody);
  }
  RevokePermession(userId: number, deviceId: number, CurrentUserId?: number): Observable<any> {
    const requestBody = {
      userId: userId.toString(),
      deviceId: deviceId.toString(),
      // managedUserId: CurrentUserId
    };
    return this._http.delete<any>(this.apiUrl, { body: requestBody });
  }
}
