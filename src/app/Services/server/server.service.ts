import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServerService {

  constructor(private _http: HttpClient) { }
  /**
   * A function that makes a GET request to the server API.
   *
   * @return {Observable<any>} the response from the server
   */
  server() {
    return this._http.get(`${environment.API}/api/server`,{withCredentials:true})
  }
}
