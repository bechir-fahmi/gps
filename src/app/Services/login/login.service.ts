import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoginDTO } from '../../shared/models/loginDTO';
import { environment } from '../../../environments/environment';
import { CookieService } from 'ngx-cookie-service';
import dayjs from 'dayjs';
import { encodeBasicAuth } from '../../shared/util/auth-utils';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  constructor(private _http: HttpClient, private cookieService: CookieService) { }

  login(data: LoginDTO): Observable<HttpResponse<any>> {
    const params = new HttpParams()
      .set('email', data.email || data.username)
      .set('password', data.password);
    return this._http.post<any>(`${environment.API}/api/session`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      observe: 'response',
      withCredentials: true
    }).pipe(
      tap(response => {
        const authHeader = `Basic ${encodeBasicAuth(data.email || data.username, data.password)}`;
        localStorage.setItem('tokenbasic', authHeader);
        console.log("login success", response.body);
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any> {
    return this._http.delete(`${environment.API}/api/session`).pipe(
      tap(() => {
        console.log("Logout success");
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  tokenGenerator(): Observable<any> {
    const expiration = dayjs().add(6, 'months').toISOString();
    const body = new HttpParams().set('expiration', expiration);
    const token = localStorage.getItem('tokenbasic')!;
    return this._http.post(`${environment.API}/api/session/token`, body.toString(), {
      headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded','Authorization': token }),
      responseType: 'text' as 'json',
    }).pipe(
      tap(response => {
        console.log("Token generated successfully", response);
        localStorage.setItem('token',JSON.stringify(response));
      }),
      catchError(error => {
        console.error("Token generation error", error);
        return throwError(() => error);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('tokenbasic');
  }
}
