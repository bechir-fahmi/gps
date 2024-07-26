import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Geofence } from '../../shared/models/geofence';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeofenceService {

  constructor(private _http:HttpClient) {
  }

  getGeofences(params?: any): Observable<Geofence[]> {
    return this._http.get<Geofence[]>(`${environment.API}/api/geofences`, { params });
  }

  createGeofence(geofence: Geofence): Observable<Geofence> {
    return this._http.post<Geofence>(`${environment.API}/api/geofences`, geofence);
  }

  updateGeofence(id: number, geofence: Geofence): Observable<Geofence> {
    return this._http.put<Geofence>(`${environment.API}/api/geofences/${id}`, geofence);
  }

  deleteGeofence(id: number): Observable<void> {
    return this._http.delete<void>(`${environment.API}/api/geofences/${id}`);
  }
}
